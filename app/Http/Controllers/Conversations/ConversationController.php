<?php

namespace App\Http\Controllers\Conversations;

use App\Enums\ConversationType;
use App\Enums\ParticipantRole;
use App\Events\ConversationCreated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Conversations\StoreConversationRequest;
use App\Http\Requests\Conversations\UpdateConversationRequest;
use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ConversationController extends Controller
{
    /**
     * Get formatted conversations list for the current user.
     *
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    protected function getConversationsList(Request $request): \Illuminate\Support\Collection
    {
        return $request->user()
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
    }

    /**
     * Display a listing of the user's conversations.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('conversations/index', [
            'conversations' => $this->getConversationsList($request),
        ]);
    }

    /**
     * Search users by email for creating conversations (JSON API).
     * Requires at least 3 characters to search for privacy.
     */
    public function users(Request $request): JsonResponse
    {
        $request->validate([
            'query' => ['required', 'string', 'min:3', 'max:100'],
        ]);

        $query = $request->input('query');

        // Search users by email (exact or partial match)
        // For better privacy, prioritize exact email matches
        $users = \App\Models\User::query()
            ->where('id', '!=', $request->user()->id)
            ->where(function ($q) use ($query) {
                $q->where('email', $query) // Exact match first
                    ->orWhere('email', 'like', "{$query}%"); // Or starts with
            })
            ->select('id', 'name', 'email', 'avatar')
            ->orderByRaw('CASE WHEN email = ? THEN 0 ELSE 1 END', [$query])
            ->orderBy('name')
            ->limit(10)
            ->get();

        return response()->json([
            'users' => $users,
        ]);
    }

    /**
     * Store a newly created conversation.
     */
    public function store(StoreConversationRequest $request): RedirectResponse|JsonResponse
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

            if ($request->wantsJson()) {
                return response()->json([
                    'conversation' => [
                        'id' => $existingConversation->id,
                    ],
                ]);
            }

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

        if ($request->wantsJson()) {
            return response()->json([
                'conversation' => [
                    'id' => $conversation->id,
                ],
            ]);
        }

        return to_route('conversations.show', $conversation);
    }

    /**
     * Display the specified conversation.
     */
    public function show(Request $request, Conversation $conversation): Response
    {
        Gate::authorize('view', $conversation);

        // Mark messages as read and broadcast
        $now = now();
        $conversation->participantRecords()
            ->where('user_id', $request->user()->id)
            ->update(['last_read_at' => $now]);

        // Broadcast that messages were read
        event(new \App\Events\MessagesRead($conversation, $request->user(), $now->toISOString()));

        // Load conversation with messages and participants (including last_read_at)
        $conversation->load([
            'activeParticipants:id,name,email,avatar',
            'participantRecords' => fn ($query) => $query->whereNull('left_at'),
            'messages' => fn ($query) => $query
                ->with(['sender:id,name,avatar', 'attachments', 'parent.sender:id,name'])
                ->orderBy('created_at', 'asc')
                ->limit(50),
        ]);

        // Get other participants' last_read_at for read status
        $otherParticipantsReadAt = $conversation->participantRecords
            ->where('user_id', '!=', $request->user()->id)
            ->pluck('last_read_at', 'user_id');

        return Inertia::render('conversations/show', [
            'conversations' => $this->getConversationsList($request),
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
                'messages' => $conversation->messages->map(function ($message) use ($request, $otherParticipantsReadAt) {
                    $isMine = $message->sender_id === $request->user()->id;

                    // Check if message is read by at least one other participant
                    $isRead = $isMine && $otherParticipantsReadAt->contains(function ($lastReadAt) use ($message) {
                        return $lastReadAt && $lastReadAt >= $message->created_at;
                    });

                    return [
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
                        'is_mine' => $isMine,
                        'is_read' => $isRead,
                        'parent' => $message->parent ? [
                            'id' => $message->parent->id,
                            'content' => $message->parent->trashed() ? null : $message->parent->content,
                            'sender_name' => $message->parent->trashed() ? null : $message->parent->sender?->name,
                            'is_deleted' => $message->parent->trashed(),
                        ] : null,
                        'attachments' => $message->attachments->map(fn ($a) => [
                            'id' => $a->id,
                            'original_name' => $a->original_name,
                            'mime_type' => $a->mime_type,
                            'size' => $a->size,
                            'human_size' => $a->human_size,
                            'url' => $a->url,
                        ]),
                    ];
                }),
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
