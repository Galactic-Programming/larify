<?php

namespace App\Http\Controllers\Projects;

use App\Enums\ActivityType;
use App\Events\ProjectUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Projects\StoreProjectRequest;
use App\Http\Requests\Projects\UpdateProjectRequest;
use App\Models\Activity;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    /**
     * Display a listing of the projects.
     */
    public function index(Request $request): Response
    {
        // Get all projects the user has access to (owned + member)
        $projects = $request->user()
            ->allProjects()
            ->with('user:id,name,email,avatar')
            ->withCount(['lists', 'tasks', 'members'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($project) use ($request) {
                $project->is_owner = $project->user_id === $request->user()->id;
                $project->my_role = $project->getMemberRole($request->user())?->value;

                return $project;
            });

        return Inertia::render('projects/index', [
            'projects' => $projects,
        ]);
    }

    /**
     * Show the form for creating a new project.
     */
    public function create(): Response
    {
        return Inertia::render('projects/create');
    }

    /**
     * Store a newly created project in storage.
     */
    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $project = $request->user()->projects()->create($request->validated());

        // Create default lists for the new project
        $defaultLists = ['To Do', 'In Progress', 'Review', 'Done'];
        foreach ($defaultLists as $position => $name) {
            $project->lists()->create([
                'name' => $name,
                'position' => $position,
                'is_done_list' => $name === 'Done',
            ]);
        }

        // Log activity
        Activity::log(
            type: ActivityType::ProjectCreated,
            subject: $project,
            project: $project,
        );

        // Broadcast project created event
        broadcast(new ProjectUpdated($project, 'created'))->toOthers();

        return to_route('projects.index');
    }

    /**
     * Display the specified project (Kanban board).
     */
    public function show(Project $project): Response
    {
        Gate::authorize('view', $project);

        $project->load([
            'lists' => fn ($query) => $query->orderBy('position'),
            'lists.tasks' => fn ($query) => $query->orderBy('position'),
        ]);

        return Inertia::render('projects/show', [
            'project' => $project,
        ]);
    }

    /**
     * Show the form for editing the specified project.
     */
    public function edit(Project $project): Response
    {
        Gate::authorize('update', $project);

        return Inertia::render('projects/edit', [
            'project' => $project,
        ]);
    }

    /**
     * Update the specified project in storage.
     */
    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        Gate::authorize('update', $project);

        $project->update($request->validated());

        // Log activity
        Activity::log(
            type: ActivityType::ProjectUpdated,
            subject: $project,
            project: $project,
        );

        // Broadcast project updated event
        broadcast(new ProjectUpdated($project, 'updated'))->toOthers();

        return back();
    }

    /**
     * Remove the specified project from storage.
     */
    public function destroy(Project $project): RedirectResponse
    {
        Gate::authorize('delete', $project);

        // Broadcast before delete so we have the project data
        broadcast(new ProjectUpdated($project, 'deleted'))->toOthers();

        $project->delete();

        return to_route('projects.index');
    }

    /**
     * Archive or unarchive the specified project.
     */
    public function toggleArchive(Project $project): RedirectResponse
    {
        Gate::authorize('archive', $project);

        $wasArchived = $project->is_archived;

        $project->update([
            'is_archived' => ! $project->is_archived,
        ]);

        // Log activity
        Activity::log(
            type: $wasArchived ? ActivityType::ProjectRestored : ActivityType::ProjectArchived,
            subject: $project,
            project: $project,
        );

        // Broadcast project archived/unarchived event
        broadcast(new ProjectUpdated($project, 'archived'))->toOthers();

        return back();
    }
}
