<?php

namespace App\Http\Controllers\Tasks;

use App\Events\TaskUpdated;
use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TaskLabelController extends Controller
{
    /**
     * Sync labels for a task (replace all labels).
     */
    public function sync(Request $request, Project $project, Task $task): JsonResponse|RedirectResponse
    {
        Gate::authorize('update', $project);

        abort_if($task->project_id !== $project->id, 404);

        $validated = $request->validate([
            'label_ids' => ['present', 'array'],
            'label_ids.*' => ['integer', 'exists:labels,id'],
        ]);

        // Verify all labels belong to this project
        $validLabelIds = $project->labels()
            ->whereIn('id', $validated['label_ids'])
            ->pluck('id');

        $task->labels()->sync($validLabelIds);

        // Broadcast task update for real-time sync
        $task->load('labels');
        broadcast(new TaskUpdated($task, 'updated'))->toOthers();

        if ($request->wantsJson()) {
            return response()->json(['labels' => $task->labels]);
        }

        return back();
    }

    /**
     * Attach a label to a task.
     */
    public function attach(Request $request, Project $project, Task $task): JsonResponse|RedirectResponse
    {
        Gate::authorize('update', $project);

        abort_if($task->project_id !== $project->id, 404);

        $validated = $request->validate([
            'label_id' => ['required', 'integer', 'exists:labels,id'],
        ]);

        // Verify the label belongs to this project
        $label = $project->labels()->findOrFail($validated['label_id']);

        $task->labels()->syncWithoutDetaching([$label->id]);

        // Broadcast task update for real-time sync
        $task->load('labels');
        broadcast(new TaskUpdated($task, 'updated'))->toOthers();

        if ($request->wantsJson()) {
            return response()->json(['labels' => $task->labels]);
        }

        return back();
    }

    /**
     * Detach a label from a task.
     */
    public function detach(Request $request, Project $project, Task $task): JsonResponse|RedirectResponse
    {
        Gate::authorize('update', $project);

        abort_if($task->project_id !== $project->id, 404);

        $validated = $request->validate([
            'label_id' => ['required', 'integer', 'exists:labels,id'],
        ]);

        $task->labels()->detach($validated['label_id']);

        // Broadcast task update for real-time sync
        $task->load('labels');
        broadcast(new TaskUpdated($task, 'updated'))->toOthers();

        if ($request->wantsJson()) {
            return response()->json(['labels' => $task->labels]);
        }

        return back();
    }
}
