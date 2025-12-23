<?php

namespace App\Policies;

use App\Enums\ParticipantRole;
use App\Models\Conversation;
use App\Models\User;

class ConversationPolicy
{
    /**
     * Determine whether the user can view any conversations.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the conversation.
     * User must be an active participant.
     */
    public function view(User $user, Conversation $conversation): bool
    {
        return $conversation->hasParticipant($user);
    }

    /**
     * Determine whether the user can create conversations.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the conversation settings.
     * Only group owners can update (group name, avatar).
     * Direct conversations cannot be updated.
     */
    public function update(User $user, Conversation $conversation): bool
    {
        // Direct conversations cannot be updated
        if ($conversation->isDirect()) {
            return false;
        }

        // Must be the owner of the group
        return $this->isOwner($user, $conversation);
    }

    /**
     * Determine whether the user can delete the conversation.
     * Only group owners can delete.
     * Direct conversations cannot be deleted (only archived/left).
     */
    public function delete(User $user, Conversation $conversation): bool
    {
        // Direct conversations cannot be deleted
        if ($conversation->isDirect()) {
            return false;
        }

        return $this->isOwner($user, $conversation);
    }

    /**
     * Determine whether the user can send messages in the conversation.
     */
    public function sendMessage(User $user, Conversation $conversation): bool
    {
        return $conversation->hasParticipant($user);
    }

    /**
     * Determine whether the user can manage participants (add/remove).
     * Only group owners can manage participants.
     */
    public function manageParticipants(User $user, Conversation $conversation): bool
    {
        // Direct conversations don't allow adding/removing participants
        if ($conversation->isDirect()) {
            return false;
        }

        return $this->isOwner($user, $conversation);
    }

    /**
     * Determine whether the user can leave the conversation.
     * Owners of groups cannot leave (must transfer ownership or delete).
     */
    public function leave(User $user, Conversation $conversation): bool
    {
        // Must be a participant first
        if (! $conversation->hasParticipant($user)) {
            return false;
        }

        // Direct conversations: you can leave (archive)
        if ($conversation->isDirect()) {
            return true;
        }

        // Group owners cannot leave without transferring ownership
        return ! $this->isOwner($user, $conversation);
    }

    /**
     * Check if the user is the owner of the conversation.
     */
    private function isOwner(User $user, Conversation $conversation): bool
    {
        $participant = $conversation->participantRecords()
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->first();

        return $participant && $participant->role === ParticipantRole::Owner;
    }
}
