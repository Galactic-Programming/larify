<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    /**
     * Determine whether the user can view any projects.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the project.
     */
    public function view(User $user, Project $project): bool
    {
        return $project->hasMember($user);
    }

    /**
     * Determine whether the user can create projects.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the project settings.
     * Only Owner can update project settings (name, description, icon, color, statuses).
     */
    public function update(User $user, Project $project): bool
    {
        return $project->canManageSettings($user);
    }

    /**
     * Determine whether the user can delete the project.
     */
    public function delete(User $user, Project $project): bool
    {
        return $user->id === $project->user_id;
    }

    /**
     * Determine whether the user can restore the project.
     * Only Owner can restore trashed projects.
     */
    public function restore(User $user, Project $project): bool
    {
        return $user->id === $project->user_id;
    }

    /**
     * Determine whether the user can permanently delete the project.
     * Only Owner can force delete projects.
     */
    public function forceDelete(User $user, Project $project): bool
    {
        return $user->id === $project->user_id;
    }

    /**
     * Determine whether the user can archive the project.
     */
    public function archive(User $user, Project $project): bool
    {
        return $user->id === $project->user_id;
    }

    /**
     * Determine whether the user can manage project members.
     * User must be owner AND have a plan that allows inviting members (Pro plan).
     */
    public function manageMembers(User $user, Project $project): bool
    {
        // Must be project owner
        if ($user->id !== $project->user_id) {
            return false;
        }

        // Must have a plan that allows inviting members
        return $user->plan?->canInviteMembers() ?? false;
    }
}
