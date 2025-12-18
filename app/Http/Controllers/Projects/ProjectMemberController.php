<?php

namespace App\Http\Controllers\Projects;

use App\Enums\ProjectRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Projects\AddMemberRequest;
use App\Http\Requests\Projects\UpdateMemberRequest;
use App\Models\Project;
use App\Models\ProjectMember;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ProjectMemberController extends Controller
{
    /**
     * Display a listing of the project members.
     */
    public function index(Project $project): Response
    {
        Gate::authorize('view', $project);

        // Load project with owner and members
        $project->load([
            'user:id,name,email,avatar',
            'members' => fn ($query) => $query->withPivot(['id', 'role', 'joined_at']),
        ]);

        // Get members with their pivot data
        $members = $project->members->map(fn ($user) => [
            'id' => $user->id,
            'pivot_id' => $user->pivot->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'role' => $user->pivot->role,
            'joined_at' => $user->pivot->joined_at,
            'is_owner' => false,
        ]);

        return Inertia::render('projects/members/index', [
            'project' => [
                'id' => $project->id,
                'user_id' => $project->user_id,
                'name' => $project->name,
                'description' => $project->description,
                'color' => $project->color,
                'icon' => $project->icon,
                'is_archived' => $project->is_archived,
                'created_at' => $project->created_at,
                'updated_at' => $project->updated_at,
                'user' => $project->user,
                'members' => $members,
            ],
        ]);
    }

    /**
     * Add a new member to the project.
     */
    public function store(AddMemberRequest $request, Project $project): RedirectResponse
    {
        $project->members()->attach($request->validated('user_id'), [
            'role' => $request->validated('role', ProjectRole::Viewer->value),
            'joined_at' => now(),
        ]);

        return back()->with('success', 'Member added successfully.');
    }

    /**
     * Update the member's role.
     */
    public function update(UpdateMemberRequest $request, Project $project, ProjectMember $member): RedirectResponse
    {
        Gate::authorize('manageMembers', $project);

        // Verify the member belongs to this project
        if ($member->project_id !== $project->id) {
            abort(404);
        }

        $member->update([
            'role' => $request->validated('role'),
        ]);

        return back()->with('success', 'Member role updated successfully.');
    }

    /**
     * Remove a member from the project.
     */
    public function destroy(Project $project, ProjectMember $member): RedirectResponse
    {
        Gate::authorize('manageMembers', $project);

        // Prevent removing the owner
        if ($member->user_id === $project->user_id) {
            return back()->withErrors(['member' => 'Cannot remove the project owner.']);
        }

        $member->delete();

        return back()->with('success', 'Member removed successfully.');
    }
}
