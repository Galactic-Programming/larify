<?php

namespace App\Http\Controllers\Tasks;

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

        $list->tasks()->create([
            ...$request->validated(),
            'project_id' => $project->id,
            'position' => $maxPosition + 1,
        ]);

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

        $task->delete();

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

        return back();
    }

    /**
     * Reorder tasks within a list.
     */
    public function reorder(ReorderTaskRequest $request, Project $project, TaskList $list): RedirectResponse
    {
        foreach ($request->validated('tasks') as $item) {
            Task::where('id', $item['id'])
                ->where('list_id', $list->id)
                ->update(['position' => $item['position']]);
        }

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

            $task->update([
                'completed_at' => $task->completed_at ? null : now(),
            ]);
        });

        return back();
    }
}
