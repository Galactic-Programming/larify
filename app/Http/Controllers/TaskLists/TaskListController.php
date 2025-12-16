<?php

namespace App\Http\Controllers\TaskLists;

use App\Events\ListUpdated;
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
            'lists.tasks.assignee',
            'user:id,name,email',
            'members:id,name,email',
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

        $list = $project->lists()->create([
            ...$request->validated(),
            'position' => $maxPosition + 1,
        ]);

        broadcast(new ListUpdated($list, 'created'))->toOthers();

        return back();
    }

    /**
     * Update the specified list in storage.
     */
    public function update(UpdateTaskListRequest $request, Project $project, TaskList $list): RedirectResponse
    {
        // Verify the list belongs to the project (security check)
        if ($list->project_id !== $project->id) {
            abort(404);
        }

        $list->update($request->validated());

        broadcast(new ListUpdated($list, 'updated'))->toOthers();

        return back();
    }

    /**
     * Remove the specified list from storage.
     */
    public function destroy(Project $project, TaskList $list): RedirectResponse
    {
        Gate::authorize('delete', [$list, $project]);

        // Prevent deletion of Done list
        if ($list->is_done_list) {
            return back()->withErrors(['list' => 'Cannot delete the Done list. Unset it as Done list first.']);
        }

        // Broadcast before delete so we have the list data
        broadcast(new ListUpdated($list, 'deleted'))->toOthers();

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

        // Broadcast a generic list update for reordering
        $firstList = $project->lists()->first();
        if ($firstList) {
            broadcast(new ListUpdated($firstList, 'reordered'))->toOthers();
        }

        return back();
    }

    /**
     * Set or unset a list as the Done list for the project.
     */
    public function setDoneList(Project $project, TaskList $list): RedirectResponse
    {
        // Verify the list belongs to the project (security check)
        if ($list->project_id !== $project->id) {
            abort(404);
        }

        Gate::authorize('update', [$list, $project]);

        // If this list is already the done list, unset it
        if ($list->is_done_list) {
            $list->update(['is_done_list' => false]);
        } else {
            // Unset any existing done list in this project
            TaskList::where('project_id', $project->id)
                ->where('is_done_list', true)
                ->update(['is_done_list' => false]);

            // Set this list as done list
            $list->update(['is_done_list' => true]);
        }

        broadcast(new ListUpdated($list, 'updated'))->toOthers();

        return back();
    }
}
