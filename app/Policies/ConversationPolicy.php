<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\User;

class ConversationPolicy
{
    /**
     * Determine whether the user can view any conversations.
     * All authenticated users can view the conversations page.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the conversation.
     * User must be a participant (which means they're a project member).
     */
    public function view(User $user, Conversation $conversation): bool
    {
        return $conversation->hasParticipant($user);
    }

    /**
     * Determine whether the user can send messages in the conversation.
     * All participants can send messages.
     */
    public function sendMessage(User $user, Conversation $conversation): bool
    {
        return $conversation->hasParticipant($user);
    }
}
