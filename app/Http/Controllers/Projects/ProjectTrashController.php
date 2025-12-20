<?php

namespace App\Http\Controllers\Projects;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskList;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ProjectTrashController extends Controller
{
    /**
     * Get trashed items for a specific project.
     */
    public function index(Request $request, Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        // Get trashed lists in this project
        $trashedLists = TaskList::onlyTrashed()
            ->where('project_id', $project->id)
            ->withCount(['tasks' => fn ($q) => $q->withTrashed()])
            ->latest('deleted_at')
            ->get()
            ->map(fn ($list) => [
                'id' => $list->id,
                'type' => 'list',
                'name' => $list->name,
                'deleted_at' => $list->deleted_at,
                'deleted_at_human' => $list->deleted_at->diffForHumans(),
                'expires_at' => $list->deleted_at->addDays(config('trash.retention_days', 7)),
                'expires_at_human' => $list->deleted_at->addDays(config('trash.retention_days', 7))->diffForHumans(),
                'tasks_count' => $list->tasks_count,
            ]);

        // Get trashed tasks in this project (from non-trashed lists only)
        $trashedTasks = Task::onlyTrashed()
            ->where('project_id', $project->id)
            ->whereHas('listWithTrashed', fn ($q) => $q->whereNull('deleted_at'))
            ->with(['listWithTrashed:id,name', 'assignee:id,name,avatar'])
            ->latest('deleted_at')
            ->get()
            ->map(fn ($task) => [
                'id' => $task->id,
                'type' => 'task',
                'title' => $task->title,
                'description' => $task->description,
                'priority' => $task->priority?->value,
                'due_date' => $task->due_date?->format('Y-m-d'),
                'list' => $task->listWithTrashed ? [
                    'id' => $task->listWithTrashed->id,
                    'name' => $task->listWithTrashed->name,
                ] : null,
                'assignee' => $task->assignee ? [
                    'id' => $task->assignee->id,
                    'name' => $task->assignee->name,
                    'avatar' => $task->assignee->avatar,
                ] : null,
                'deleted_at' => $task->deleted_at,
                'deleted_at_human' => $task->deleted_at->diffForHumans(),
                'expires_at' => $task->deleted_at->addDays(config('trash.retention_days', 7)),
                'expires_at_human' => $task->deleted_at->addDays(config('trash.retention_days', 7))->diffForHumans(),
            ]);

        return response()->json([
            'trashedLists' => $trashedLists,
            'trashedTasks' => $trashedTasks,
            'retentionDays' => config('trash.retention_days', 7),
        ]);
    }

    /**
     * Restore a trashed list within the project.
     */
    public function restoreList(Request $request, Project $project, int $listId): RedirectResponse
    {
        $list = TaskList::onlyTrashed()
            ->where('project_id', $project->id)
            ->findOrFail($listId);

        Gate::authorize('restore', [$list, $project]);

        $list->restore();

        return back()->with('success', 'List restored successfully.');
    }

    /**
     * Permanently delete a list within the project.
     */
    public function forceDeleteList(Request $request, Project $project, int $listId): RedirectResponse
    {
        $list = TaskList::onlyTrashed()
            ->where('project_id', $project->id)
            ->findOrFail($listId);

        Gate::authorize('forceDelete', [$list, $project]);

        $list->forceDelete();

        return back()->with('success', 'List permanently deleted.');
    }

    /**
     * Restore a trashed task within the project.
     */
    public function restoreTask(Request $request, Project $project, int $taskId): RedirectResponse
    {
        $task = Task::onlyTrashed()
            ->where('project_id', $project->id)
            ->findOrFail($taskId);

        Gate::authorize('restore', [$task, $project]);

        // Check if the list still exists
        $list = TaskList::withTrashed()->find($task->list_id);
        if (! $list || $list->trashed()) {
            return back()->withErrors(['task' => 'Cannot restore task: the list it belongs to has been deleted.']);
        }

        $task->restore();

        return back()->with('success', 'Task restored successfully.');
    }

    /**
     * Permanently delete a task within the project.
     */
    public function forceDeleteTask(Request $request, Project $project, int $taskId): RedirectResponse
    {
        $task = Task::onlyTrashed()
            ->where('project_id', $project->id)
            ->findOrFail($taskId);

        Gate::authorize('forceDelete', [$task, $project]);

        $task->forceDelete();

        return back()->with('success', 'Task permanently deleted.');
    }

    /**
     * Empty project trash (force delete all trashed items in this project).
     */
    public function emptyTrash(Request $request, Project $project): RedirectResponse
    {
        Gate::authorize('delete', $project);

        // Force delete all trashed tasks in this project
        Task::onlyTrashed()
            ->where('project_id', $project->id)
            ->forceDelete();

        // Force delete all trashed lists in this project
        TaskList::onlyTrashed()
            ->where('project_id', $project->id)
            ->forceDelete();

        return back()->with('success', 'Project trash emptied successfully.');
    }
}
