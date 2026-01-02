<?php

namespace App\Policies;

use App\Models\TaskComment;
use App\Models\User;

class TaskCommentPolicy
{
    /**
     * Determine whether the user can view the comment.
     * User must be a member of the project.
     */
    public function view(User $user, TaskComment $comment): bool
    {
        return $comment->task->project->hasMember($user);
    }

    /**
     * Determine whether the user can update the comment.
     * Only the comment owner can edit their own comments.
     * Comments can only be edited within a time limit.
     */
    public function update(User $user, TaskComment $comment): bool
    {
        // Only the owner can edit
        if ($comment->user_id !== $user->id) {
            return false;
        }

        // Check if comment was created within edit time limit (15 minutes)
        $editTimeLimit = config('chat.edit_time_limit', 15); // minutes

        return $comment->created_at->diffInMinutes(now()) <= $editTimeLimit;
    }

    /**
     * Determine whether the user can delete the comment.
     * Owner can delete their own comments.
     * Project owner can delete any comment.
     */
    public function delete(User $user, TaskComment $comment): bool
    {
        // Comment owner can delete
        if ($comment->user_id === $user->id) {
            return true;
        }

        // Project owner can delete any comment
        return $comment->task->project->user_id === $user->id;
    }

    /**
     * Determine whether the user can restore the comment.
     */
    public function restore(User $user, TaskComment $comment): bool
    {
        return $comment->user_id === $user->id;
    }

    /**
     * Determine whether the user can permanently delete the comment.
     */
    public function forceDelete(User $user, TaskComment $comment): bool
    {
        return $comment->user_id === $user->id;
    }
}
