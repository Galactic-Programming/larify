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
     * Determine whether the user can delete the message.
     * Only the sender can delete their own messages within 5 minutes.
     */
    public function delete(User $user, Message $message): bool
    {
        // Only the sender can delete their own messages
        if ($message->sender_id !== $user->id) {
            return false;
        }

        // Can only delete within the time window
        return $message->canBeDeletedBySender();
    }
}
