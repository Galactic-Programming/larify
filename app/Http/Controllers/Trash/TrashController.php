<?php

namespace App\Http\Controllers\Trash;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskList;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TrashController extends Controller
{
    /**
     * Display a listing of all trashed items for the user.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get trashed projects owned by user
        $trashedProjects = Project::onlyTrashed()
            ->where('user_id', $user->id)
            ->with('user:id,name,email')
            ->withCount(['lists' => fn ($q) => $q->withTrashed(), 'tasks' => fn ($q) => $q->withTrashed()])
            ->latest('deleted_at')
            ->get()
            ->map(fn ($project) => [
                'id' => $project->id,
                'type' => 'project',
                'name' => $project->name,
                'description' => $project->description,
                'color' => $project->color,
                'icon' => $project->icon,
                'deleted_at' => $project->deleted_at,
                'deleted_at_human' => $project->deleted_at->diffForHumans(),
                'expires_at' => $project->deleted_at->addDays(config('trash.retention_days', 7)),
                'expires_at_human' => $project->deleted_at->addDays(config('trash.retention_days', 7))->diffForHumans(),
                'lists_count' => $project->lists_count,
                'tasks_count' => $project->tasks_count,
            ]);

        // Get trashed lists from user's projects (not deleted with project)
        $trashedLists = TaskList::onlyTrashed()
            ->whereHas('projectWithTrashed', fn ($q) => $q->where('user_id', $user->id)->whereNull('deleted_at'))
            ->with(['projectWithTrashed:id,name,color'])
            ->withCount(['tasks' => fn ($q) => $q->withTrashed()])
            ->latest('deleted_at')
            ->get()
            ->map(fn ($list) => [
                'id' => $list->id,
                'type' => 'list',
                'name' => $list->name,
                'project' => $list->projectWithTrashed ? [
                    'id' => $list->projectWithTrashed->id,
                    'name' => $list->projectWithTrashed->name,
                    'color' => $list->projectWithTrashed->color,
                ] : null,
                'deleted_at' => $list->deleted_at,
                'deleted_at_human' => $list->deleted_at->diffForHumans(),
                'expires_at' => $list->deleted_at->addDays(config('trash.retention_days', 7)),
                'expires_at_human' => $list->deleted_at->addDays(config('trash.retention_days', 7))->diffForHumans(),
                'tasks_count' => $list->tasks_count,
            ]);

        // Get trashed tasks from user's projects (not deleted with list/project)
        $trashedTasks = Task::onlyTrashed()
            ->whereHas('projectWithTrashed', fn ($q) => $q->where('user_id', $user->id)->whereNull('deleted_at'))
            ->whereHas('listWithTrashed', fn ($q) => $q->whereNull('deleted_at'))
            ->with(['projectWithTrashed:id,name,color', 'listWithTrashed:id,name', 'assignee:id,name,avatar'])
            ->latest('deleted_at')
            ->get()
            ->map(fn ($task) => [
                'id' => $task->id,
                'type' => 'task',
                'title' => $task->title,
                'description' => $task->description,
                'priority' => $task->priority?->value,
                'due_date' => $task->due_date?->format('Y-m-d'),
                'project' => $task->projectWithTrashed ? [
                    'id' => $task->projectWithTrashed->id,
                    'name' => $task->projectWithTrashed->name,
                    'color' => $task->projectWithTrashed->color,
                ] : null,
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

        return Inertia::render('trash/index', [
            'trashedProjects' => $trashedProjects,
            'trashedLists' => $trashedLists,
            'trashedTasks' => $trashedTasks,
            'retentionDays' => config('trash.retention_days', 7),
        ]);
    }

    /**
     * Restore a trashed project.
     */
    public function restoreProject(Request $request, int $id): RedirectResponse
    {
        $project = Project::onlyTrashed()->findOrFail($id);

        Gate::authorize('restore', $project);

        $project->restore();

        return back()->with('success', 'Project restored successfully.');
    }

    /**
     * Permanently delete a project.
     */
    public function forceDeleteProject(Request $request, int $id): RedirectResponse
    {
        $project = Project::onlyTrashed()->findOrFail($id);

        Gate::authorize('forceDelete', $project);

        $project->forceDelete();

        return back()->with('success', 'Project permanently deleted.');
    }

    /**
     * Restore a trashed list.
     */
    public function restoreList(Request $request, int $id): RedirectResponse
    {
        $list = TaskList::onlyTrashed()->findOrFail($id);
        $project = Project::withTrashed()->findOrFail($list->project_id);

        Gate::authorize('restore', [$list, $project]);

        $list->restore();

        return back()->with('success', 'List restored successfully.');
    }

    /**
     * Permanently delete a list.
     */
    public function forceDeleteList(Request $request, int $id): RedirectResponse
    {
        $list = TaskList::onlyTrashed()->findOrFail($id);
        $project = Project::withTrashed()->findOrFail($list->project_id);

        Gate::authorize('forceDelete', [$list, $project]);

        $list->forceDelete();

        return back()->with('success', 'List permanently deleted.');
    }

    /**
     * Restore a trashed task.
     */
    public function restoreTask(Request $request, int $id): RedirectResponse
    {
        $task = Task::onlyTrashed()->findOrFail($id);
        $project = Project::withTrashed()->findOrFail($task->project_id);

        Gate::authorize('restore', [$task, $project]);

        $task->restore();

        return back()->with('success', 'Task restored successfully.');
    }

    /**
     * Permanently delete a task.
     */
    public function forceDeleteTask(Request $request, int $id): RedirectResponse
    {
        $task = Task::onlyTrashed()->findOrFail($id);
        $project = Project::withTrashed()->findOrFail($task->project_id);

        Gate::authorize('forceDelete', [$task, $project]);

        $task->forceDelete();

        return back()->with('success', 'Task permanently deleted.');
    }

    /**
     * Empty all trash (force delete all trashed items).
     */
    public function emptyTrash(Request $request): RedirectResponse
    {
        $user = $request->user();

        // Force delete all trashed tasks from user's projects
        Task::onlyTrashed()
            ->whereHas('projectWithTrashed', fn ($q) => $q->where('user_id', $user->id))
            ->forceDelete();

        // Force delete all trashed lists from user's projects
        TaskList::onlyTrashed()
            ->whereHas('projectWithTrashed', fn ($q) => $q->where('user_id', $user->id))
            ->forceDelete();

        // Force delete all trashed projects owned by user
        Project::onlyTrashed()
            ->where('user_id', $user->id)
            ->forceDelete();

        return back()->with('success', 'Trash emptied successfully.');
    }
}
