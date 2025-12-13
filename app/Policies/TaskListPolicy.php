<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\TaskList;
use App\Models\User;

class TaskListPolicy
{
    /**
     * Determine whether the user can view the list.
     */
    public function view(User $user, TaskList $taskList, Project $project): bool
    {
        return $user->id === $project->user_id
            && $taskList->project_id === $project->id;
    }

    /**
     * Determine whether the user can create lists.
     */
    public function create(User $user, Project $project): bool
    {
        return $user->id === $project->user_id;
    }

    /**
     * Determine whether the user can update the list.
     */
    public function update(User $user, TaskList $taskList, Project $project): bool
    {
        return $user->id === $project->user_id
            && $taskList->project_id === $project->id;
    }

    /**
     * Determine whether the user can delete the list.
     */
    public function delete(User $user, TaskList $taskList, Project $project): bool
    {
        return $user->id === $project->user_id
            && $taskList->project_id === $project->id;
    }
}
