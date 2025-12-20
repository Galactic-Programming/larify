<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    /**
     * Determine whether the user can view the task.
     */
    public function view(User $user, Task $task, Project $project): bool
    {
        return $project->hasMember($user)
            && $task->project_id === $project->id;
    }

    /**
     * Determine whether the user can create tasks.
     */
    public function create(User $user, Project $project): bool
    {
        return $project->canEdit($user);
    }

    /**
     * Determine whether the user can update the task.
     */
    public function update(User $user, Task $task, Project $project): bool
    {
        return $project->canEdit($user)
            && $task->project_id === $project->id;
    }

    /**
     * Determine whether the user can delete the task.
     * Only Owner can delete tasks.
     */
    public function delete(User $user, Task $task, Project $project): bool
    {
        return $project->canDelete($user)
            && $task->project_id === $project->id;
    }

    /**
     * Determine whether the user can restore the task.
     * Only Owner or Admin can restore trashed tasks.
     */
    public function restore(User $user, Task $task, Project $project): bool
    {
        return $project->canDelete($user)
            && $task->project_id === $project->id;
    }

    /**
     * Determine whether the user can permanently delete the task.
     * Only Owner can force delete tasks.
     */
    public function forceDelete(User $user, Task $task, Project $project): bool
    {
        return $user->id === $project->user_id
            && $task->project_id === $project->id;
    }

    /**
     * Determine whether the user can reopen a completed task.
     * Only Owner can reopen tasks.
     */
    public function reopen(User $user, Task $task, Project $project): bool
    {
        return $project->canReopen($user)
            && $task->project_id === $project->id;
    }
}
