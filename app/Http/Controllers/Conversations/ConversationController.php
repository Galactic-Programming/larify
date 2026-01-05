<?php

namespace App\Http\Controllers\Conversations;

use App\Events\MessagesRead;
use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ConversationController extends Controller
{
    /**
     * Get formatted conversations list for the current user.
     * Only returns conversations from projects the user is a member of.
     * Optimized to avoid N+1 queries for unread counts.
     *
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    protected function getConversationsList(Request $request): \Illuminate\Support\Collection
    {
        $userId = $request->user()->id;

        $conversations = $request->user()
            ->conversations()
            ->with([
                'project:id,name,color,icon',
                'latestMessage.sender:id,name,avatar',
                'participants:id,name,avatar',
                'participantRecords' => fn ($query) => $query->where('user_id', $userId),
            ])
            ->orderByDesc('last_message_at')
            ->orderByDesc('created_at')
            ->get();

        // Get all conversation IDs
        $conversationIds = $conversations->pluck('id')->toArray();

        // Calculate unread counts for all conversations in a single query
        $unreadCounts = Message::select('conversation_id', DB::raw('COUNT(*) as unread_count'))
            ->whereIn('conversation_id', $conversationIds)
            ->where('sender_id', '!=', $userId)
            ->where(function ($query) use ($userId) {
                $query->whereRaw('created_at > COALESCE(
                    (SELECT last_read_at FROM conversation_participants 
                     WHERE conversation_participants.conversation_id = messages.conversation_id 
                     AND conversation_participants.user_id = ?),
                    ?
                )', [$userId, '1970-01-01 00:00:00']);
            })
            ->groupBy('conversation_id')
            ->pluck('unread_count', 'conversation_id');

        return $conversations->map(function ($conversation) use ($unreadCounts) {
            return [
                'id' => $conversation->id,
                'name' => $conversation->getDisplayName(),
                'color' => $conversation->getDisplayColor(),
                'icon' => $conversation->getDisplayIcon(),
                'project_id' => $conversation->project_id,
                'last_message' => $conversation->latestMessage ? [
                    'id' => $conversation->latestMessage->id,
                    'content' => $conversation->latestMessage->content,
                    'sender' => $conversation->latestMessage->sender ? [
                        'id' => $conversation->latestMessage->sender->id,
                        'name' => $conversation->latestMessage->sender->name,
                    ] : null,
                    'created_at' => $conversation->latestMessage->created_at->toISOString(),
                ] : null,
                'unread_count' => $unreadCounts[$conversation->id] ?? 0,
                'participants' => $conversation->participants->map(fn ($user) => [
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

        // Broadcast that messages were read (silently fail if Reverb is not running)
        try {
            event(new MessagesRead($conversation, $request->user(), $now->toISOString()));
        } catch (\Illuminate\Broadcasting\BroadcastException $e) {
            // Reverb server not running - continue without broadcasting
            report($e);
        }

        // Load conversation with messages and participants
        $conversation->load([
            'project:id,name,color,icon',
            'participants:id,name,email,avatar',
            'participantRecords',
            'messages' => fn ($query) => $query
                ->with(['sender:id,name,avatar', 'attachments', 'mentions.user:id,name,email'])
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
                'name' => $conversation->getDisplayName(),
                'color' => $conversation->getDisplayColor(),
                'icon' => $conversation->getDisplayIcon(),
                'project_id' => $conversation->project_id,
                'project' => $conversation->project ? [
                    'id' => $conversation->project->id,
                    'name' => $conversation->project->name,
                    'color' => $conversation->project->color,
                    'icon' => $conversation->project->icon,
                ] : null,
                'participants' => $this->getParticipantsWithAI($conversation),
                'messages' => $conversation->messages->map(function ($message) use ($request, $otherParticipantsReadAt) {
                    $isMine = $message->sender_id === $request->user()->id;
                    $isAI = $message->sender?->isAI() ?? false;

                    // Check if message is read by at least one other participant
                    $isRead = $isMine && $otherParticipantsReadAt->contains(function ($lastReadAt) use ($message) {
                        return $lastReadAt && $lastReadAt >= $message->created_at;
                    });

                    return [
                        'id' => $message->id,
                        'content' => $message->content,
                        'created_at' => $message->created_at->toISOString(),
                        'sender' => $message->sender ? [
                            'id' => $message->sender->id,
                            'name' => $message->sender->name,
                            'avatar' => $message->sender->avatar,
                            'is_ai' => $isAI,
                        ] : null,
                        'is_ai' => $isAI,
                        'is_mine' => $isMine && ! $isAI,
                        'is_read' => $isRead,
                        'can_delete' => $isMine && ! $isAI && $message->canBeDeletedBySender(),
                        'mentions' => $message->mentions->map(fn ($m) => [
                            'user_id' => $m->user_id,
                            'name' => $m->user?->name,
                            'email' => $m->user?->email,
                        ])->values()->toArray(),
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
            ],
        ]);
    }

    /**
     * Show conversation for a specific project.
     * This is the entry point from the project view.
     */
    public function showByProject(Request $request, Project $project): Response
    {
        Gate::authorize('view', $project);

        // Get or create conversation for this project
        $conversation = $project->getOrCreateConversation();

        // If no conversation (project has < 2 members), show empty state
        if (! $conversation) {
            return Inertia::render('conversations/show', [
                'conversations' => $this->getConversationsList($request),
                'conversation' => null,
                'project' => [
                    'id' => $project->id,
                    'name' => $project->name,
                    'color' => $project->color,
                    'icon' => $project->icon,
                    'member_count' => $project->getTotalMemberCount(),
                    'has_chat_enabled' => false,
                ],
            ]);
        }

        // Redirect to the conversation view
        return $this->show($request, $conversation);
    }

    /**
     * Get unread conversations for the notification bell.
     * Returns conversations with unread messages, limited to 10.
     */
    public function unread(Request $request): \Illuminate\Http\JsonResponse
    {
        $userId = $request->user()->id;

        $conversations = $request->user()
            ->conversations()
            ->with([
                'project:id,name,color,icon',
                'latestMessage.sender:id,name,avatar',
                'participantRecords' => fn ($query) => $query->where('user_id', $userId),
            ])
            ->orderByDesc('last_message_at')
            ->get();

        // Get all conversation IDs
        $conversationIds = $conversations->pluck('id')->toArray();

        // Calculate unread counts for all conversations in a single query
        $unreadCounts = Message::select('conversation_id', DB::raw('COUNT(*) as unread_count'))
            ->whereIn('conversation_id', $conversationIds)
            ->where('sender_id', '!=', $userId)
            ->where(function ($query) use ($userId) {
                $query->whereRaw('created_at > COALESCE(
                    (SELECT last_read_at FROM conversation_participants 
                     WHERE conversation_participants.conversation_id = messages.conversation_id 
                     AND conversation_participants.user_id = ?),
                    ?
                )', [$userId, '1970-01-01 00:00:00']);
            })
            ->groupBy('conversation_id')
            ->pluck('unread_count', 'conversation_id');

        // Filter to only conversations with unread messages
        $unreadConversations = $conversations
            ->filter(fn ($conv) => ($unreadCounts[$conv->id] ?? 0) > 0)
            ->take(10)
            ->map(function ($conversation) use ($unreadCounts) {
                return [
                    'id' => $conversation->id,
                    'name' => $conversation->getDisplayName(),
                    'color' => $conversation->getDisplayColor(),
                    'unread_count' => $unreadCounts[$conversation->id] ?? 0,
                    'last_message' => $conversation->latestMessage ? [
                        'content' => $conversation->latestMessage->content,
                        'sender_name' => $conversation->latestMessage->sender?->name ?? 'Unknown',
                        'created_at' => $conversation->latestMessage->created_at->toISOString(),
                    ] : null,
                ];
            })
            ->values();

        $totalUnread = $unreadCounts->sum();

        return response()->json([
            'conversations' => $unreadConversations,
            'total_unread' => $totalUnread,
        ]);
    }

    /**
     * Get participants list with AI assistant included at the top.
     *
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    protected function getParticipantsWithAI(Conversation $conversation): \Illuminate\Support\Collection
    {
        $aiUser = User::getAIUser();

        // Start with AI User at the top
        $participants = collect([[
            'id' => $aiUser->id,
            'name' => $aiUser->name,
            'email' => $aiUser->email,
            'avatar' => null,
            'is_ai' => true,
        ]]);

        // Add regular participants
        $regularParticipants = $conversation->participants->map(fn ($user) => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'is_ai' => false,
        ]);

        return $participants->merge($regularParticipants);
    }
}
