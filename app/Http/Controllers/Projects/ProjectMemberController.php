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

class ProjectMemberController extends Controller
{
    /**
     * Display a listing of the project members.
     */
    public function index(Project $project): array
    {
        Gate::authorize('view', $project);

        return [
            'members' => $project->members()
                ->withPivot(['role', 'joined_at'])
                ->get()
                ->map(fn ($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->pivot->role,
                    'joined_at' => $user->pivot->joined_at,
                    'is_owner' => $project->user_id === $user->id,
                ]),
            'owner' => [
                'id' => $project->user->id,
                'name' => $project->user->name,
                'email' => $project->user->email,
            ],
        ];
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
