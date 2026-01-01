<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\User;

class MessagePolicy
{
    /**
     * Determine whether the user can view the message.
     * User must be a participant in the conversation.
     */
    public function view(User $user, Message $message): bool
    {
        return $message->conversation->hasParticipant($user);
    }

    /**
     * Determine whether the user can update the message.
     * Only the sender can edit their own messages.
     * Messages can only be edited within a time limit (e.g., 15 minutes).
     */
    public function update(User $user, Message $message): bool
    {
        // Only the sender can edit
        if ($message->sender_id !== $user->id) {
            return false;
        }

        // Check if message was sent within edit time limit (15 minutes)
        $editTimeLimit = config('chat.edit_time_limit', 15); // minutes

        return $message->created_at->diffInMinutes(now()) <= $editTimeLimit;
    }

    /**
     * Determine whether the user can delete the message.
     * Only the sender can delete their own messages.
     * (In project-based chat, there's no owner distinction - only sender can delete)
     */
    public function delete(User $user, Message $message): bool
    {
        // Only the sender can delete their own messages
        return $message->sender_id === $user->id;
    }

    /**
     * Determine whether the user can restore the message.
     * Only the sender can restore their soft-deleted messages.
     */
    public function restore(User $user, Message $message): bool
    {
        return $message->sender_id === $user->id;
    }

    /**
     * Determine whether the user can permanently delete the message.
     * Only the sender can force delete their own messages.
     */
    public function forceDelete(User $user, Message $message): bool
    {
        return $message->sender_id === $user->id;
    }
}
