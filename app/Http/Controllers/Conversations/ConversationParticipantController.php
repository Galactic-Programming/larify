<?php

namespace App\Http\Controllers\Conversations;

use App\Enums\ParticipantRole;
use App\Events\ParticipantAdded;
use App\Events\ParticipantRemoved;
use App\Events\ParticipantRoleChanged;
use App\Http\Controllers\Controller;
use App\Http\Requests\Conversations\AddParticipantRequest;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class ConversationParticipantController extends Controller
{
    /**
     * Add a participant to the conversation.
     */
    public function store(AddParticipantRequest $request, Conversation $conversation): RedirectResponse
    {
        $userId = $request->validated('user_id');
        $addedUser = User::findOrFail($userId);

        // Check if user previously left (has existing record with left_at)
        $existingParticipant = $conversation->participantRecords()
            ->where('user_id', $userId)
            ->whereNotNull('left_at')
            ->first();

        if ($existingParticipant) {
            // Rejoin: update the existing record
            $existingParticipant->update([
                'left_at' => null,
                'joined_at' => now(),
                'role' => ParticipantRole::Member,
            ]);
        } else {
            // Create new participant record
            $conversation->participantRecords()->create([
                'user_id' => $userId,
                'role' => ParticipantRole::Member,
                'joined_at' => now(),
            ]);
        }

        // Broadcast the event
        broadcast(new ParticipantAdded(
            $conversation,
            $addedUser,
            $request->user()
        ))->toOthers();

        return back()->with('success', "{$addedUser->name} has been added to the conversation.");
    }

    /**
     * Update a participant's role.
     */
    public function update(Conversation $conversation, ConversationParticipant $participant): RedirectResponse
    {
        Gate::authorize('manageParticipants', $conversation);

        // Verify participant belongs to this conversation
        if ($participant->conversation_id !== $conversation->id) {
            abort(404);
        }

        // Cannot change owner's role through this endpoint
        if ($participant->isOwner()) {
            return back()->with('error', 'Cannot change the owner\'s role.');
        }

        $newRole = request('role');
        if (! $newRole || ! in_array($newRole, ['member'])) {
            return back()->with('error', 'Invalid role.');
        }

        $participant->update([
            'role' => ParticipantRole::from($newRole),
        ]);

        // Broadcast the event
        broadcast(new ParticipantRoleChanged(
            $conversation,
            $participant->user,
            ParticipantRole::from($newRole),
            auth()->user()
        ))->toOthers();

        return back()->with('success', 'Participant role updated.');
    }

    /**
     * Remove a participant from the conversation.
     */
    public function destroy(Conversation $conversation, ConversationParticipant $participant): RedirectResponse
    {
        Gate::authorize('manageParticipants', $conversation);

        // Verify participant belongs to this conversation
        if ($participant->conversation_id !== $conversation->id) {
            abort(404);
        }

        // Cannot remove the owner
        if ($participant->isOwner()) {
            return back()->with('error', 'Cannot remove the owner from the conversation.');
        }

        // Cannot remove yourself (use leave instead)
        if ($participant->user_id === auth()->id()) {
            return back()->with('error', 'Use the leave option to remove yourself.');
        }

        $removedUser = $participant->user;

        // Mark as left (soft removal)
        $participant->update(['left_at' => now()]);

        // Broadcast the event
        broadcast(new ParticipantRemoved(
            $conversation,
            $removedUser,
            auth()->user(),
            wasKicked: true
        ))->toOthers();

        return back()->with('success', "{$removedUser->name} has been removed from the conversation.");
    }

    /**
     * Transfer ownership to another participant.
     */
    public function transferOwnership(Conversation $conversation, ConversationParticipant $participant): RedirectResponse
    {
        Gate::authorize('manageParticipants', $conversation);

        // Verify participant belongs to this conversation
        if ($participant->conversation_id !== $conversation->id) {
            abort(404);
        }

        // Cannot transfer to yourself
        if ($participant->user_id === auth()->id()) {
            return back()->with('error', 'You are already the owner.');
        }

        // Get current owner's participant record
        $currentOwner = $conversation->participantRecords()
            ->where('user_id', auth()->id())
            ->first();

        if (! $currentOwner || ! $currentOwner->isOwner()) {
            return back()->with('error', 'Only the owner can transfer ownership.');
        }

        // Update roles
        $currentOwner->update(['role' => ParticipantRole::Member]);
        $participant->update(['role' => ParticipantRole::Owner]);

        // Broadcast the events
        broadcast(new ParticipantRoleChanged(
            $conversation,
            auth()->user(),
            ParticipantRole::Member,
            auth()->user()
        ))->toOthers();

        broadcast(new ParticipantRoleChanged(
            $conversation,
            $participant->user,
            ParticipantRole::Owner,
            auth()->user()
        ))->toOthers();

        return back()->with('success', "Ownership transferred to {$participant->user->name}.");
    }
}
