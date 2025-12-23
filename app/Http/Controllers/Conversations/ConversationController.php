<?php

namespace App\Http\Controllers\Conversations;

use App\Enums\ConversationType;
use App\Enums\ParticipantRole;
use App\Events\ConversationCreated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Conversations\StoreConversationRequest;
use App\Http\Requests\Conversations\UpdateConversationRequest;
use App\Models\Conversation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ConversationController extends Controller
{
    /**
     * Display a listing of the user's conversations.
     */
    public function index(Request $request): Response
    {
        $conversations = $request->user()
            ->conversations()
            ->with(['latestMessage.sender:id,name,avatar', 'activeParticipants:id,name,avatar'])
            ->orderByDesc('last_message_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($conversation) use ($request) {
                return [
                    'id' => $conversation->id,
                    'type' => $conversation->type->value,
                    'name' => $conversation->getDisplayName($request->user()),
                    'avatar' => $conversation->getDisplayAvatar($request->user()),
                    'last_message' => $conversation->latestMessage ? [
                        'id' => $conversation->latestMessage->id,
                        'content' => $conversation->latestMessage->content,
                        'sender' => $conversation->latestMessage->sender ? [
                            'id' => $conversation->latestMessage->sender->id,
                            'name' => $conversation->latestMessage->sender->name,
                        ] : null,
                        'created_at' => $conversation->latestMessage->created_at->toISOString(),
                    ] : null,
                    'unread_count' => $conversation->getUnreadCount($request->user()),
                    'participants' => $conversation->activeParticipants->map(fn ($user) => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'avatar' => $user->avatar,
                    ]),
                    'last_message_at' => $conversation->last_message_at?->toISOString(),
                    'created_at' => $conversation->created_at->toISOString(),
                ];
            });

        return Inertia::render('conversations/index', [
            'conversations' => $conversations,
        ]);
    }

    /**
     * Store a newly created conversation.
     */
    public function store(StoreConversationRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $type = ConversationType::from($validated['type']);
        $participantIds = $validated['participant_ids'];

        // For direct messages, check if conversation already exists
        if ($type === ConversationType::Direct && count($participantIds) === 1) {
            $existingConversation = Conversation::findOrCreateDirect(
                $request->user(),
                \App\Models\User::find($participantIds[0])
            );

            return to_route('conversations.show', $existingConversation);
        }

        // Create new group conversation
        $conversation = Conversation::create([
            'type' => $type,
            'name' => $validated['name'] ?? null,
            'avatar' => $validated['avatar'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        // Add creator as owner
        $conversation->participantRecords()->create([
            'user_id' => $request->user()->id,
            'role' => ParticipantRole::Owner,
            'joined_at' => now(),
        ]);

        // Add other participants as members
        foreach ($participantIds as $userId) {
            $conversation->participantRecords()->create([
                'user_id' => $userId,
                'role' => ParticipantRole::Member,
                'joined_at' => now(),
            ]);
        }

        // Reload with participants for broadcasting
        $conversation->load('activeParticipants');

        // Broadcast to all participants
        broadcast(new ConversationCreated($conversation))->toOthers();

        return to_route('conversations.show', $conversation);
    }

    /**
     * Display the specified conversation.
     */
    public function show(Request $request, Conversation $conversation): Response
    {
        Gate::authorize('view', $conversation);

        // Mark messages as read
        $conversation->participantRecords()
            ->where('user_id', $request->user()->id)
            ->update(['last_read_at' => now()]);

        // Load conversation with messages and participants
        $conversation->load([
            'activeParticipants:id,name,email,avatar',
            'messages' => fn ($query) => $query
                ->with(['sender:id,name,avatar', 'attachments', 'parent.sender:id,name'])
                ->orderBy('created_at', 'asc')
                ->limit(50),
        ]);

        return Inertia::render('conversations/show', [
            'conversation' => [
                'id' => $conversation->id,
                'type' => $conversation->type->value,
                'name' => $conversation->getDisplayName($request->user()),
                'avatar' => $conversation->getDisplayAvatar($request->user()),
                'raw_name' => $conversation->name,
                'participants' => $conversation->activeParticipants->map(fn ($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'role' => $user->pivot->role,
                ]),
                'messages' => $conversation->messages->map(fn ($message) => [
                    'id' => $message->id,
                    'content' => $message->content,
                    'is_edited' => $message->is_edited,
                    'edited_at' => $message->edited_at?->toISOString(),
                    'created_at' => $message->created_at->toISOString(),
                    'sender' => $message->sender ? [
                        'id' => $message->sender->id,
                        'name' => $message->sender->name,
                        'avatar' => $message->sender->avatar,
                    ] : null,
                    'is_mine' => $message->sender_id === $request->user()->id,
                    'parent' => $message->parent ? [
                        'id' => $message->parent->id,
                        'content' => $message->parent->content,
                        'sender_name' => $message->parent->sender?->name,
                    ] : null,
                    'attachments' => $message->attachments->map(fn ($a) => [
                        'id' => $a->id,
                        'original_name' => $a->original_name,
                        'mime_type' => $a->mime_type,
                        'size' => $a->size,
                        'human_size' => $a->human_size,
                        'url' => $a->url,
                    ]),
                ]),
                'can_update' => Gate::allows('update', $conversation),
                'can_manage_participants' => Gate::allows('manageParticipants', $conversation),
                'can_leave' => Gate::allows('leave', $conversation),
            ],
        ]);
    }

    /**
     * Update the specified conversation.
     */
    public function update(UpdateConversationRequest $request, Conversation $conversation): RedirectResponse
    {
        $conversation->update($request->validated());

        return back()->with('success', 'Conversation updated.');
    }

    /**
     * Remove the specified conversation (soft delete/archive).
     */
    public function destroy(Conversation $conversation): RedirectResponse
    {
        Gate::authorize('delete', $conversation);

        // For groups: delete the conversation entirely
        $conversation->delete();

        return to_route('conversations.index')->with('success', 'Conversation deleted.');
    }

    /**
     * Leave the conversation.
     */
    public function leave(Request $request, Conversation $conversation): RedirectResponse
    {
        Gate::authorize('leave', $conversation);

        // Mark participant as left
        $conversation->participantRecords()
            ->where('user_id', $request->user()->id)
            ->update(['left_at' => now()]);

        return to_route('conversations.index')->with('success', 'You have left the conversation.');
    }
}
