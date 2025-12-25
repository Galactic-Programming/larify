<?php

namespace App\Policies;

use App\Enums\ParticipantRole;
use App\Models\Conversation;
use App\Models\User;

class ConversationPolicy
{
    /**
     * Determine whether the user can view any conversations.
     * Allow all authenticated users to view the conversations page.
     * The frontend will show an upgrade prompt for Free users.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the conversation.
     * User must be Pro and an active participant.
     */
    public function view(User $user, Conversation $conversation): bool
    {
        return $user->plan->canUseChat() && $conversation->hasParticipant($user);
    }

    /**
     * Determine whether the user can create conversations.
     * Pro users only.
     */
    public function create(User $user): bool
    {
        return $user->plan->canUseChat();
    }

    /**
     * Determine whether the user can update the conversation settings.
     * Any participant of a group can update (group name, avatar).
     * Direct conversations cannot be updated.
     */
    public function update(User $user, Conversation $conversation): bool
    {
        // Direct conversations cannot be updated
        if ($conversation->isDirect()) {
            return false;
        }

        // Any participant can update group settings
        return $conversation->hasParticipant($user);
    }

    /**
     * Determine whether the user can delete (soft delete) the conversation.
     * Any participant can delete the conversation for themselves.
     * When a new message is sent, the conversation reappears for participants who deleted it.
     * The conversation is only fully deleted when all participants have deleted it.
     */
    public function delete(User $user, Conversation $conversation): bool
    {
        return $conversation->hasParticipant($user);
    }

    /**
     * Determine whether the user can send messages in the conversation.
     * Pro users only.
     */
    public function sendMessage(User $user, Conversation $conversation): bool
    {
        return $user->plan->canUseChat() && $conversation->hasParticipant($user);
    }

    /**
     * Determine whether the user can manage participants (add/remove).
     * Any participant of a group can add new members.
     * Only the owner can remove members.
     */
    public function manageParticipants(User $user, Conversation $conversation): bool
    {
        // Direct conversations don't allow adding/removing participants
        if ($conversation->isDirect()) {
            return false;
        }

        return $conversation->hasParticipant($user);
    }

    /**
     * Determine whether the user can remove a participant from the conversation.
     * Only the owner can remove members.
     */
    public function removeParticipant(User $user, Conversation $conversation): bool
    {
        if ($conversation->isDirect()) {
            return false;
        }

        return $this->isOwner($user, $conversation);
    }

    /**
     * Determine whether the user can transfer ownership.
     * Only the owner can transfer ownership.
     */
    public function transferOwnership(User $user, Conversation $conversation): bool
    {
        if ($conversation->isDirect()) {
            return false;
        }

        return $this->isOwner($user, $conversation);
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
