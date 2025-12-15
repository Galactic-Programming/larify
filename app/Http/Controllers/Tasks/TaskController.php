<?php

namespace App\Http\Controllers\Tasks;

use App\Events\TaskUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tasks\MoveTaskRequest;
use App\Http\Requests\Tasks\ReorderTaskRequest;
use App\Http\Requests\Tasks\StoreTaskRequest;
use App\Http\Requests\Tasks\UpdateTaskRequest;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskList;
use Illuminate\Http\RedirectResponse;
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

        $task->update($request->validated());

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

        // Store task data before deletion for broadcast
        $taskData = $task->toArray();

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

        // Auto-calculate position at the end of target list to prevent race condition
        $maxPosition = Task::where('list_id', $newListId)->max('position') ?? -1;

        $task->update([
            'list_id' => $newListId,
            'position' => $maxPosition + 1,
        ]);

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
     * Start tracking time for a task.
     */
    public function start(Project $project, Task $task): RedirectResponse
    {
        // Verify task belongs to project (prevent URL manipulation)
        if ($task->project_id !== $project->id) {
            abort(404);
        }

        Gate::authorize('update', [$task, $project]);

        // Only set started_at if not already started (prevent overwrite)
        if ($task->started_at === null) {
            $task->update([
                'started_at' => now(),
            ]);

            // Broadcast real-time update
            broadcast(new TaskUpdated($task->load('assignee'), 'started'))->toOthers();
        }

        return back();
    }

    /**
     * Pause time tracking for a task.
     */
    public function pause(Project $project, Task $task): RedirectResponse
    {
        // Verify task belongs to project (prevent URL manipulation)
        if ($task->project_id !== $project->id) {
            abort(404);
        }

        Gate::authorize('update', [$task, $project]);

        // Only pause if task is in progress (started but not paused or completed)
        if ($task->started_at !== null && $task->paused_at === null && $task->completed_at === null) {
            $task->update([
                'paused_at' => now(),
            ]);

            // Broadcast real-time update
            broadcast(new TaskUpdated($task->load('assignee'), 'paused'))->toOthers();
        }

        return back();
    }

    /**
     * Resume time tracking for a paused task.
     */
    public function resume(Project $project, Task $task): RedirectResponse
    {
        // Verify task belongs to project (prevent URL manipulation)
        if ($task->project_id !== $project->id) {
            abort(404);
        }

        Gate::authorize('update', [$task, $project]);

        // Only resume if task is paused
        if ($task->paused_at !== null && $task->completed_at === null) {
            // Calculate paused duration and add to total (absolute value to prevent negative)
            $pausedDuration = max(0, (int) $task->paused_at->diffInSeconds(now()));

            $task->update([
                'paused_at' => null,
                'total_paused_seconds' => $task->total_paused_seconds + $pausedDuration,
            ]);

            // Broadcast real-time update
            broadcast(new TaskUpdated($task->load('assignee'), 'resumed'))->toOthers();
        }

        return back();
    }

    /**
     * Mark task as completed.
     */
    public function complete(Project $project, Task $task): RedirectResponse
    {
        // Verify task belongs to project (prevent URL manipulation)
        if ($task->project_id !== $project->id) {
            abort(404);
        }

        Gate::authorize('update', [$task, $project]);

        // Use DB transaction with fresh data to prevent race condition
        DB::transaction(function () use ($task) {
            // Refresh to get latest data (optimistic locking)
            $task->refresh();

            if ($task->completed_at) {
                // If already completed, mark as incomplete (toggle off)
                $task->update([
                    'completed_at' => null,
                ]);
            } else {
                // Mark as completed
                // If task was paused, calculate final paused time
                $additionalPausedSeconds = 0;
                if ($task->paused_at !== null) {
                    $additionalPausedSeconds = max(0, (int) $task->paused_at->diffInSeconds(now()));
                }

                $task->update([
                    'completed_at' => now(),
                    'paused_at' => null,
                    'total_paused_seconds' => max(0, $task->total_paused_seconds + $additionalPausedSeconds),
                ]);
            }
        });

        // Broadcast real-time update
        broadcast(new TaskUpdated($task->load('assignee'), 'completed'))->toOthers();

        return back();
    }
}
