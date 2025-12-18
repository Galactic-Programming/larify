<?php

namespace App\Http\Controllers\Tasks;

use App\Enums\ActivityType;
use App\Events\TaskUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tasks\MoveTaskRequest;
use App\Http\Requests\Tasks\ReorderTaskRequest;
use App\Http\Requests\Tasks\StoreTaskRequest;
use App\Http\Requests\Tasks\UpdateTaskRequest;
use App\Models\Activity;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskList;
use App\Notifications\TaskAssigned;
use App\Notifications\TaskCompleted;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class TaskController extends Controller
{
    /**
     * Store a newly created task in storage.
     */
    public function store(StoreTaskRequest $request, Project $project, TaskList $list): RedirectResponse
    {
        $maxPosition = $list->tasks()->max('position') ?? -1;

        $task = $list->tasks()->create([
            ...$request->validated(),
            'project_id' => $project->id,
            'position' => $maxPosition + 1,
        ]);

        // Log activity
        Activity::log(
            type: ActivityType::TaskCreated,
            subject: $task,
            project: $project,
        );

        // Notify assignee if task is assigned to someone else
        if ($task->assigned_to && $task->assigned_to !== auth()->id()) {
            $task->assignee->notify(new TaskAssigned($task, auth()->user()));
        }

        // Broadcast real-time update
        broadcast(new TaskUpdated($task->load('assignee'), 'created'))->toOthers();

        return back();
    }

    /**
     * Update the specified task in storage.
     */
    public function update(UpdateTaskRequest $request, Project $project, Task $task): RedirectResponse
    {
        // Verify task belongs to project (prevent URL manipulation)
        if ($task->project_id !== $project->id) {
            abort(404);
        }

        // Check if assignee changed
        $oldAssigneeId = $task->assigned_to;
        $newAssigneeId = $request->validated('assigned_to');
        $assigneeChanged = $newAssigneeId && $oldAssigneeId !== $newAssigneeId;

        $task->update($request->validated());

        // Log activity
        Activity::log(
            type: ActivityType::TaskUpdated,
            subject: $task,
            project: $project,
        );

        // Notify new assignee if task assignment changed
        if ($assigneeChanged && $newAssigneeId !== auth()->id()) {
            $task->load('assignee');
            $task->assignee->notify(new TaskAssigned($task, auth()->user()));

            // Log assignment activity separately
            Activity::log(
                type: ActivityType::TaskAssigned,
                subject: $task,
                project: $project,
                properties: ['assigned_to_name' => $task->assignee->name],
            );
        }

        // Broadcast real-time update
        broadcast(new TaskUpdated($task->load('assignee'), 'updated'))->toOthers();

        return back();
    }

    /**
     * Remove the specified task from storage.
     */
    public function destroy(Project $project, Task $task): RedirectResponse
    {
        // Verify task belongs to project (prevent URL manipulation)
        if ($task->project_id !== $project->id) {
            abort(404);
        }

        Gate::authorize('delete', [$task, $project]);

        // Store task data before deletion for activity log
        $taskTitle = $task->title;

        // Log activity before deletion
        Activity::log(
            type: ActivityType::TaskDeleted,
            subject: null,
            project: $project,
            properties: ['task_title' => $taskTitle],
        );

        $task->delete();

        // Broadcast deletion event
        broadcast(new TaskUpdated($task, 'deleted'))->toOthers();

        return back();
    }

    /**
     * Move task to a different list.
     */
    public function move(MoveTaskRequest $request, Project $project, Task $task): RedirectResponse
    {
        // Verify task belongs to project (prevent URL manipulation)
        if ($task->project_id !== $project->id) {
            abort(404);
        }

        Gate::authorize('update', [$task, $project]);

        $validated = $request->validated();
        $newListId = $validated['list_id'];

        // Check if target list is a done list
        $targetList = TaskList::find($newListId);
        $isMovingToDoneList = $targetList && $targetList->is_done_list;
        $isMovingFromDoneList = $task->list->is_done_list ?? false;

        // Use provided position or auto-calculate at end of list
        if (isset($validated['position'])) {
            $newPosition = $validated['position'];

            // Shift existing tasks to make room for the new position
            Task::where('list_id', $newListId)
                ->where('position', '>=', $newPosition)
                ->increment('position');
        } else {
            // Auto-calculate position at the end of target list
            $newPosition = (Task::where('list_id', $newListId)->max('position') ?? -1) + 1;
        }

        $updateData = [
            'list_id' => $newListId,
            'position' => $newPosition,
        ];

        // Auto-complete task when moving to done list
        if ($isMovingToDoneList && ! $task->completed_at) {
            $updateData['completed_at'] = now();
            $updateData['original_list_id'] = $task->list_id;
        }

        // Auto-uncomplete task when moving from done list to another list
        if ($isMovingFromDoneList && ! $isMovingToDoneList && $task->completed_at) {
            $updateData['completed_at'] = null;
            $updateData['original_list_id'] = null;
        }

        $task->update($updateData);

        // Log activity
        Activity::log(
            type: ActivityType::TaskMoved,
            subject: $task,
            project: $project,
            properties: [
                'from_list' => $task->list->name ?? 'Unknown',
                'to_list' => $targetList->name,
            ],
        );

        // Broadcast real-time update
        broadcast(new TaskUpdated($task->load('assignee'), 'moved'))->toOthers();

        return back();
    }

    /**
     * Reorder tasks within a list.
     */
    public function reorder(ReorderTaskRequest $request, Project $project, TaskList $list): RedirectResponse
    {
        // Use DB transaction to prevent race condition during bulk position updates
        DB::transaction(function () use ($request, $list) {
            foreach ($request->validated('tasks') as $item) {
                Task::where('id', $item['id'])
                    ->where('list_id', $list->id)
                    ->update(['position' => $item['position']]);
            }
        });

        return back();
    }

    /**
     * Toggle task completion status.
     * Completing: Editor or Owner can mark tasks as complete.
     * Uncompleting: Only Owner can unmark (reopen) completed tasks.
     */
    public function complete(Project $project, Task $task): RedirectResponse
    {
        // Verify task belongs to project (prevent URL manipulation)
        if ($task->project_id !== $project->id) {
            abort(404);
        }

        // If task is already completed, we need reopen permission to uncomplete
        if ($task->completed_at) {
            Gate::authorize('reopen', [$task, $project]);
        } else {
            Gate::authorize('update', [$task, $project]);
        }

        // Use DB transaction with fresh data to prevent race condition
        DB::transaction(function () use ($task, $project) {
            // Refresh to get latest data (optimistic locking)
            $task->refresh();

            if ($task->completed_at) {
                // If already completed, mark as incomplete (reopen)
                // Check if the task is overdue - if so, require new deadline via reopen endpoint
                if ($task->isOverdue()) {
                    // Return early - frontend should use reopen endpoint with new deadline
                    return;
                }

                // Move back to original list if it exists
                $updateData = ['completed_at' => null];

                if ($task->original_list_id) {
                    // Check if original list still exists
                    $originalListExists = TaskList::where('id', $task->original_list_id)
                        ->where('project_id', $project->id)
                        ->exists();

                    if ($originalListExists) {
                        // Calculate new position at end of original list
                        $maxPosition = Task::where('list_id', $task->original_list_id)->max('position') ?? -1;
                        $updateData['list_id'] = $task->original_list_id;
                        $updateData['position'] = $maxPosition + 1;
                    }

                    $updateData['original_list_id'] = null;
                }

                $task->update($updateData);
            } else {
                // Mark as completed
                $updateData = ['completed_at' => now()];

                // Find done list in this project
                $doneList = TaskList::where('project_id', $project->id)
                    ->where('is_done_list', true)
                    ->first();

                // Auto-move to done list if exists and task is not already there
                if ($doneList && $task->list_id !== $doneList->id) {
                    // Store original list before moving
                    $updateData['original_list_id'] = $task->list_id;

                    // Calculate new position at end of done list
                    $maxPosition = Task::where('list_id', $doneList->id)->max('position') ?? -1;
                    $updateData['list_id'] = $doneList->id;
                    $updateData['position'] = $maxPosition + 1;
                }

                $task->update($updateData);
            }
        });

        // Log activity and notify based on what happened
        $task->refresh();
        if ($task->completed_at) {
            // Task was completed
            Activity::log(
                type: ActivityType::TaskCompleted,
                subject: $task,
                project: $project,
            );

            // Notify project owner and members about task completion
            $this->notifyTaskCompleted($task, $project);
        } else {
            // Task was reopened (uncompleted)
            Activity::log(
                type: ActivityType::TaskReopened,
                subject: $task,
                project: $project,
            );
        }

        // Broadcast real-time update
        broadcast(new TaskUpdated($task->load('assignee'), 'completed'))->toOthers();

        return back();
    }

    /**
     * Reopen an overdue task with a new deadline.
     * Only project owners can reopen tasks.
     */
    public function reopen(Request $request, Project $project, Task $task): RedirectResponse
    {
        // Verify task belongs to project (prevent URL manipulation)
        if ($task->project_id !== $project->id) {
            abort(404);
        }

        Gate::authorize('reopen', [$task, $project]);

        // Validate new deadline
        $validated = $request->validate([
            'due_date' => ['required', 'date', 'after_or_equal:today'],
            'due_time' => ['required', 'date_format:H:i'],
        ]);

        // Use DB transaction with fresh data to prevent race condition
        DB::transaction(function () use ($task, $project, $validated) {
            // Refresh to get latest data (optimistic locking)
            $task->refresh();

            // Only allow reopen if task is completed
            if (! $task->completed_at) {
                return;
            }

            // Prepare update data
            $updateData = [
                'completed_at' => null,
                'due_date' => $validated['due_date'],
                'due_time' => $validated['due_time'],
            ];

            // Move back to original list if it exists
            if ($task->original_list_id) {
                // Check if original list still exists
                $originalListExists = TaskList::where('id', $task->original_list_id)
                    ->where('project_id', $project->id)
                    ->exists();

                if ($originalListExists) {
                    // Calculate new position at end of original list
                    $maxPosition = Task::where('list_id', $task->original_list_id)->max('position') ?? -1;
                    $updateData['list_id'] = $task->original_list_id;
                    $updateData['position'] = $maxPosition + 1;
                }

                $updateData['original_list_id'] = null;
            }

            $task->update($updateData);
        });

        // Log activity
        Activity::log(
            type: ActivityType::TaskReopened,
            subject: $task,
            project: $project,
            properties: [
                'new_due_date' => $validated['due_date'],
                'new_due_time' => $validated['due_time'],
            ],
        );

        // Broadcast real-time update
        broadcast(new TaskUpdated($task->load('assignee'), 'reopened'))->toOthers();

        return back();
    }

    /**
     * Notify relevant users when a task is completed.
     */
    protected function notifyTaskCompleted(Task $task, Project $project): void
    {
        $completedBy = auth()->user();

        // Notify project owner if they didn't complete the task
        if ($project->user_id !== $completedBy->id) {
            $project->user->notify(new TaskCompleted($task, $completedBy));
        }

        // Notify task assignee if they didn't complete it themselves
        if ($task->assigned_to && $task->assigned_to !== $completedBy->id) {
            $task->assignee->notify(new TaskCompleted($task, $completedBy));
        }
    }
}
