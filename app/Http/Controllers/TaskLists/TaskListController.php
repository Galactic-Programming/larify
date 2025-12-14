<?php

namespace App\Http\Controllers\TaskLists;

use App\Http\Controllers\Controller;
use App\Http\Requests\TaskLists\ReorderTaskListRequest;
use App\Http\Requests\TaskLists\StoreTaskListRequest;
use App\Http\Requests\TaskLists\UpdateTaskListRequest;
use App\Models\Project;
use App\Models\TaskList;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TaskListController extends Controller
{
    /**
     * Display a listing of the lists for a project.
     */
    public function index(Project $project): Response
    {
        Gate::authorize('view', $project);

        $project->load([
            'lists' => fn ($query) => $query->orderBy('position')->withCount('tasks'),
            'lists.tasks' => fn ($query) => $query->orderBy('position'),
        ]);

        return Inertia::render('projects/lists/index', [
            'project' => $project,
        ]);
    }

    /**
     * Store a newly created list in storage.
     */
    public function store(StoreTaskListRequest $request, Project $project): RedirectResponse
    {
        $maxPosition = $project->lists()->max('position') ?? -1;

        $project->lists()->create([
            ...$request->validated(),
            'position' => $maxPosition + 1,
        ]);

        return back();
    }

    /**
     * Update the specified list in storage.
     */
    public function update(UpdateTaskListRequest $request, Project $project, TaskList $list): RedirectResponse
    {
        $list->update($request->validated());

        return back();
    }

    /**
     * Remove the specified list from storage.
     */
    public function destroy(Project $project, TaskList $list): RedirectResponse
    {
        Gate::authorize('delete', [$list, $project]);

        $list->delete();

        return back();
    }

    /**
     * Reorder lists within a project.
     */
    public function reorder(ReorderTaskListRequest $request, Project $project): RedirectResponse
    {
        foreach ($request->validated('lists') as $item) {
            TaskList::where('id', $item['id'])
                ->where('project_id', $project->id)
                ->update(['position' => $item['position']]);
        }

        return back();
    }
}
