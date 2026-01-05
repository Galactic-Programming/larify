<?php

namespace App\Http\Controllers\Conversations;

use App\Events\AIThinking;
use App\Events\MentionNotification;
use App\Events\MessageDeleted;
use App\Events\MessageSent;
use App\Events\UserTyping;
use App\Http\Controllers\Controller;
use App\Http\Requests\Conversations\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Notifications\MentionedInMessage;
use App\Services\AI\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    public function __construct(
        protected GeminiService $geminiService
    ) {}

    /**
     * Fetch more messages (pagination).
     */
    public function index(Request $request, Conversation $conversation): JsonResponse
    {
        Gate::authorize('view', $conversation);

        $before = $request->query('before'); // Message ID to load before
        $limit = min((int) $request->query('limit', 50), 100);

        $query = $conversation->messages()
            ->with(['sender:id,name,avatar', 'attachments', 'mentions.user:id,name,email'])
            ->orderBy('created_at', 'desc');

        if ($before) {
            $beforeMessage = Message::find($before);
            if ($beforeMessage) {
                $query->where('created_at', '<', $beforeMessage->created_at);
            }
        }

        $messages = $query->limit($limit)->get()->reverse()->values();

        return response()->json([
            'messages' => MessageResource::collection($messages),
            'has_more' => $messages->count() === $limit,
        ]);
    }

    /**
     * Store a new message.
     */
    public function store(StoreMessageRequest $request, Conversation $conversation): RedirectResponse|JsonResponse
    {
        $validated = $request->validated();
        $content = $validated['content'] ?? '';

        // Create the message
        $message = $conversation->messages()->create([
            'sender_id' => $request->user()->id,
            'content' => $content,
        ]);

        // Handle file attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('message-attachments', 'public');

                $message->attachments()->create([
                    'disk' => 'public',
                    'path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                ]);
            }
        }

        // Parse and sync @mentions
        $participantIds = $conversation->participants()->pluck('users.id')->toArray();
        $message->syncMentions($participantIds);

        // Notify mentioned users (queue for performance)
        $mentionedUsers = $message->mentions()->with('user')->get()->pluck('user');
        foreach ($mentionedUsers as $mentionedUser) {
            if ($mentionedUser && $mentionedUser->id !== $request->user()->id) {
                // Save notification to database
                $notification = $mentionedUser->notify(new MentionedInMessage($message));

                // Get the notification ID from database
                $dbNotification = $mentionedUser->notifications()
                    ->where('type', MentionedInMessage::class)
                    ->where('data->message_id', $message->id)
                    ->first();

                // Broadcast real-time notification
                if ($dbNotification) {
                    broadcast(new MentionNotification($message, $mentionedUser, $dbNotification->id));
                }
            }
        }

        // Load relationships for broadcasting
        $message->load(['sender:id,name,avatar', 'attachments', 'mentions.user:id,name,email']);

        // Broadcast the message
        broadcast(new MessageSent($message))->toOthers();

        // Check for @AI mention and generate AI response
        $aiMessage = $this->handleAIMention($request->user(), $conversation, $content);

        // Return JSON for AJAX requests
        if ($request->expectsJson()) {
            $response = ['message' => $this->formatMessage($message, true)];

            // Include AI message if generated
            if ($aiMessage) {
                $response['ai_message'] = $this->formatMessage($aiMessage, false);
            }

            return response()->json($response, 201);
        }

        return back();
    }

    /**
     * Handle @AI mention in message content.
     * Generates AI response if user mentions @AI or @Laraflow AI.
     * Supports conversation history for context-aware responses.
     */
    protected function handleAIMention(User $user, Conversation $conversation, string $content): ?Message
    {
        // Check for @AI or @Laraflow AI mention (case-insensitive)
        if (! preg_match('/@(AI|Laraflow\s*AI)\b/i', $content)) {
            return null;
        }

        $aiUser = User::getAIUser();

        // Check if user can use AI features
        if (! $this->geminiService->canUserUseAI($user)) {
            return $this->createAIMessage(
                $conversation,
                $aiUser,
                "⚠️ AI features require a Pro subscription. Please upgrade your plan to chat with me!\n\n".
                '[Upgrade to Pro](/settings/billing)'
            );
        }

        // Extract the question (text after @AI)
        $question = $this->extractAIQuestion($content);

        if (empty(trim($question))) {
            return null;
        }

        // Broadcast AI thinking state to all participants
        broadcast(new AIThinking($conversation, true));

        try {
            // Get project context for AI
            $project = $conversation->project;
            $projectContext = $this->buildProjectContext($project);

            // Get conversation history for context-aware responses
            $history = $this->getAIConversationHistory($conversation, $aiUser->id);

            // Call AI service with history
            $aiResponse = $this->geminiService->chatInConversation($question, $projectContext, $history);

            // Retry once if failed
            if (! $aiResponse) {
                Log::info('AI Chat: First attempt failed, retrying...', [
                    'conversation_id' => $conversation->id,
                ]);
                usleep(500000); // Wait 500ms before retry
                $aiResponse = $this->geminiService->chatInConversation($question, $projectContext, $history);
            }

            if (! $aiResponse) {
                return $this->createAIErrorMessage($conversation, $aiUser, 'service_unavailable');
            }

            // Create AI response message
            $aiMessage = $this->createAIMessage($conversation, $aiUser, $aiResponse);

            // Increment AI usage for the user who triggered it
            $this->geminiService->incrementUsage($user);

            return $aiMessage;
        } catch (\Exception $e) {
            Log::error('AI Chat Error', [
                'user_id' => $user->id,
                'conversation_id' => $conversation->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Determine error type and create appropriate message
            $errorType = $this->determineAIErrorType($e);

            return $this->createAIErrorMessage($conversation, $aiUser, $errorType);
        } finally {
            // Always turn off AI thinking indicator (even on error)
            broadcast(new AIThinking($conversation, false));
        }
    }

    /**
     * Create and broadcast an AI message.
     */
    protected function createAIMessage(Conversation $conversation, User $aiUser, string $content): Message
    {
        $aiMessage = $conversation->messages()->create([
            'sender_id' => $aiUser->id,
            'content' => $content,
        ]);

        $aiMessage->load(['sender:id,name,avatar', 'attachments', 'mentions.user:id,name,email']);
        broadcast(new MessageSent($aiMessage));

        return $aiMessage;
    }

    /**
     * Create an AI error message with friendly text.
     */
    protected function createAIErrorMessage(Conversation $conversation, User $aiUser, string $errorType): Message
    {
        $errorMessages = [
            'service_unavailable' => "😔 I'm having trouble processing your request right now. Please try again in a moment.\n\n*Tip: If this persists, the AI service might be temporarily unavailable.*",
            'rate_limit' => "⏳ You've been using me a lot! Please wait a moment before asking another question.\n\n*Your daily limit resets at midnight.*",
            'timeout' => '⏱️ That took too long to process. Could you try rephrasing your question or making it shorter?',
            'invalid_response' => '🤔 I generated a response but something went wrong. Please try asking again.',
            'unknown' => '❌ Something unexpected happened. Please try again or contact support if this continues.',
        ];

        $content = $errorMessages[$errorType] ?? $errorMessages['unknown'];

        return $this->createAIMessage($conversation, $aiUser, $content);
    }

    /**
     * Determine the type of AI error from exception.
     */
    protected function determineAIErrorType(\Exception $e): string
    {
        $message = strtolower($e->getMessage());

        if (str_contains($message, 'rate limit') || str_contains($message, 'quota')) {
            return 'rate_limit';
        }

        if (str_contains($message, 'timeout') || str_contains($message, 'timed out')) {
            return 'timeout';
        }

        if (str_contains($message, 'invalid') || str_contains($message, 'parse')) {
            return 'invalid_response';
        }

        return 'unknown';
    }

    /**
     * Get conversation history for AI context.
     * Returns the last N messages involving AI (both user questions and AI responses).
     *
     * @return array<array{role: string, content: string}>
     */
    protected function getAIConversationHistory(Conversation $conversation, int $aiUserId): array
    {
        // Get recent messages that involve AI interactions
        // Limit to last 20 messages (10 conversation turns) for token efficiency
        $recentMessages = $conversation->messages()
            ->where(function ($query) use ($aiUserId) {
                $query->where('sender_id', $aiUserId) // AI responses
                    ->orWhere('content', 'LIKE', '%@AI%') // User @AI mentions
                    ->orWhere('content', 'LIKE', '%@Laraflow%'); // User @Laraflow AI mentions
            })
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get(['sender_id', 'content', 'created_at'])
            ->reverse() // Oldest first for chronological order
            ->values();

        $history = [];

        foreach ($recentMessages as $message) {
            if ($message->sender_id === $aiUserId) {
                // AI response
                $history[] = [
                    'role' => 'model',
                    'content' => $message->content,
                ];
            } else {
                // User question - extract just the question part
                $question = $this->extractAIQuestion($message->content);
                if (! empty(trim($question))) {
                    $history[] = [
                        'role' => 'user',
                        'content' => $question,
                    ];
                }
            }
        }

        return $history;
    }

    /**
     * Extract the question from message content (text after @AI).
     */
    protected function extractAIQuestion(string $content): string
    {
        // Remove @AI or @Laraflow AI and get the rest
        $question = preg_replace('/@(AI|Laraflow\s*AI)\b/i', '', $content);

        return trim($question);
    }

    /**
     * Build comprehensive project context for AI.
     * Includes detailed information about lists, tasks, members, and labels.
     *
     * @return array<string, mixed>
     */
    protected function buildProjectContext(\App\Models\Project $project): array
    {
        // Load lists with task counts
        $lists = $project->lists()->withCount([
            'tasks',
            'tasks as completed_tasks_count' => fn ($q) => $q->whereNotNull('completed_at'),
            'tasks as pending_tasks_count' => fn ($q) => $q->whereNull('completed_at'),
        ])->get();

        $totalTasks = $lists->sum('tasks_count');
        $completedTasks = $lists->sum('completed_tasks_count');
        $pendingTasks = $lists->sum('pending_tasks_count');

        // Get ALL pending tasks with full details (limit 50 to avoid token overflow)
        $allPendingTasks = $project->tasks()
            ->with(['list:id,name', 'assignee:id,name', 'labels:id,name,color'])
            ->whereNull('completed_at')
            ->orderByRaw('CASE WHEN due_date IS NULL THEN 1 ELSE 0 END')
            ->orderBy('due_date')
            ->orderByRaw("CASE priority 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                WHEN 'low' THEN 4 
                ELSE 5 END")
            ->limit(50)
            ->get(['id', 'title', 'description', 'due_date', 'priority', 'list_id', 'assigned_to']);

        // Get recently completed tasks (last 7 days)
        $recentlyCompleted = $project->tasks()
            ->with(['list:id,name'])
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', now()->subDays(7))
            ->orderBy('completed_at', 'desc')
            ->limit(10)
            ->get(['id', 'title', 'completed_at', 'list_id']);

        // Get overdue tasks
        $overdueTasks = $project->tasks()
            ->with(['list:id,name', 'assignee:id,name'])
            ->whereNull('completed_at')
            ->whereNotNull('due_date')
            ->where('due_date', '<', now())
            ->orderBy('due_date')
            ->limit(20)
            ->get(['id', 'title', 'due_date', 'priority', 'list_id', 'assigned_to']);

        // Get project members
        $members = $project->members()->get(['users.id', 'users.name', 'users.email']);
        $owner = $project->user;

        // Get project labels
        $labels = $project->labels()->get(['id', 'name', 'color']);

        // Get tasks due soon (next 3 days) - high priority alert
        $tasksDueSoon = $project->tasks()
            ->with(['assignee:id,name'])
            ->whereNull('completed_at')
            ->whereNotNull('due_date')
            ->whereBetween('due_date', [now(), now()->addDays(3)])
            ->orderBy('due_date')
            ->limit(10)
            ->get(['id', 'title', 'due_date', 'priority', 'assigned_to']);

        return [
            'name' => $project->name,
            'description' => $project->description,
            'created_at' => $project->created_at->format('Y-m-d'),

            // Statistics
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'pending_tasks' => $pendingTasks,
            'overdue_count' => $overdueTasks->count(),
            'completion_rate' => $totalTasks > 0
                ? round(($completedTasks / $totalTasks) * 100, 1)
                : 0,

            // Lists details
            'lists' => $lists->map(fn ($list) => [
                'id' => $list->id,
                'name' => $list->name,
                'total' => $list->tasks_count,
                'completed' => $list->completed_tasks_count,
                'pending' => $list->pending_tasks_count,
            ])->toArray(),

            // All pending tasks with details
            'pending_tasks_details' => $allPendingTasks->map(fn ($task) => [
                'title' => $task->title,
                'description' => $task->description ? mb_substr($task->description, 0, 100) : null,
                'list' => $task->list?->name,
                'priority' => $task->priority?->value,
                'due_date' => $task->due_date?->format('Y-m-d'),
                'days_until_due' => $task->due_date ? now()->diffInDays($task->due_date, false) : null,
                'assignee' => $task->assignee?->name,
                'labels' => $task->labels->pluck('name')->toArray(),
            ])->toArray(),

            // Overdue tasks (urgent attention needed)
            'overdue_tasks' => $overdueTasks->map(fn ($task) => [
                'title' => $task->title,
                'list' => $task->list?->name,
                'due_date' => $task->due_date?->format('Y-m-d'),
                'days_overdue' => now()->diffInDays($task->due_date),
                'priority' => $task->priority?->value,
                'assignee' => $task->assignee?->name,
            ])->toArray(),

            // Tasks due soon (next 3 days)
            'tasks_due_soon' => $tasksDueSoon->map(fn ($task) => [
                'title' => $task->title,
                'due_date' => $task->due_date?->format('Y-m-d'),
                'priority' => $task->priority?->value,
                'assignee' => $task->assignee?->name,
            ])->toArray(),

            // Recently completed (for progress tracking)
            'recently_completed' => $recentlyCompleted->map(fn ($task) => [
                'title' => $task->title,
                'completed_at' => $task->completed_at?->format('Y-m-d H:i'),
                'list' => $task->list?->name,
            ])->toArray(),

            // Team members
            'owner' => [
                'name' => $owner?->name,
                'email' => $owner?->email,
            ],
            'members' => $members->map(fn ($member) => [
                'name' => $member->name,
                'email' => $member->email,
                'role' => $member->pivot->role ?? 'member',
            ])->toArray(),
            'team_size' => $members->count() + 1,

            // Labels available in project
            'labels' => $labels->map(fn ($label) => [
                'name' => $label->name,
                'color' => $label->color,
            ])->toArray(),
        ];
    }

    /**
     * Delete the specified message.
     * Messages can only be deleted within 5 minutes of being sent.
     */
    public function destroy(Request $request, Conversation $conversation, Message $message): RedirectResponse|JsonResponse
    {
        Gate::authorize('delete', $message);

        // Verify message belongs to conversation
        if ($message->conversation_id !== $conversation->id) {
            abort(404);
        }

        $messageId = $message->id;
        $conversationId = $conversation->id;

        // Delete attachments from storage
        foreach ($message->attachments as $attachment) {
            Storage::disk($attachment->disk)->delete($attachment->path);
            $attachment->delete();
        }

        // Delete mentions
        $message->mentions()->delete();

        // Soft delete the message
        $message->delete();

        // Broadcast the deletion
        broadcast(new MessageDeleted($messageId, $conversationId))->toOthers();

        if ($request->expectsJson()) {
            return response()->json(['success' => true]);
        }

        return back();
    }

    /**
     * Mark messages as read.
     */
    public function markAsRead(Request $request, Conversation $conversation): JsonResponse
    {
        Gate::authorize('view', $conversation);

        // Update the participant's last_read_at
        $now = now();
        $conversation->participantRecords()
            ->where('user_id', $request->user()->id)
            ->update(['last_read_at' => $now]);

        // Broadcast read receipt
        broadcast(new \App\Events\MessagesRead(
            $conversation,
            $request->user(),
            $now->toISOString()
        ))->toOthers();

        return response()->json(['success' => true]);
    }

    /**
     * Broadcast typing indicator.
     */
    public function typing(Request $request, Conversation $conversation): JsonResponse
    {
        Gate::authorize('sendMessage', $conversation);

        $isTyping = $request->boolean('is_typing', true);

        broadcast(new UserTyping(
            $conversation,
            $request->user(),
            $isTyping
        ))->toOthers();

        return response()->json(['success' => true]);
    }

    /**
     * Search messages within a conversation.
     */
    public function search(Request $request, Conversation $conversation): JsonResponse
    {
        Gate::authorize('view', $conversation);

        $request->validate([
            'q' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        $query = $request->input('q');
        $limit = min((int) $request->query('limit', 20), 50);

        $messages = $conversation->messages()
            ->with(['sender:id,name,avatar', 'attachments', 'mentions.user:id,name,email'])
            ->where('content', 'like', "%{$query}%")
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->reverse()
            ->values();

        return response()->json([
            'messages' => MessageResource::collection($messages),
            'total' => $conversation->messages()
                ->where('content', 'like', "%{$query}%")
                ->count(),
        ]);
    }

    /**
     * Get participants for @mention autocomplete.
     * Includes the AI assistant as a mentionable participant.
     */
    public function participants(Request $request, Conversation $conversation): JsonResponse
    {
        Gate::authorize('view', $conversation);

        $search = $request->query('q', '');

        $participants = $conversation->participants()
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->select('users.id', 'users.name', 'users.email', 'users.avatar')
            ->limit(10)
            ->get()
            ->toArray();

        // Add AI assistant to the list if it matches the search
        $aiUser = User::getAIUser();
        $aiMatches = empty($search)
            || stripos($aiUser->name, $search) !== false
            || stripos('AI', $search) !== false;

        if ($aiMatches) {
            // Add AI at the beginning of the list
            array_unshift($participants, [
                'id' => $aiUser->id,
                'name' => $aiUser->name,
                'email' => $aiUser->email,
                'avatar' => null,
                'is_ai' => true,
            ]);
        }

        return response()->json([
            'participants' => $participants,
        ]);
    }

    /**
     * Format a message for JSON response.
     */
    private function formatMessage(Message $message, bool $isMine): array
    {
        $isAI = $message->sender?->isAI() ?? false;

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
            'is_mine' => $isMine && ! $isAI,
            'is_ai' => $isAI,
            'can_delete' => $isMine && ! $isAI && $message->canBeDeletedBySender(),
            'mentions' => $message->mentions->map(fn ($m) => [
                'user_id' => $m->user_id,
                'name' => $m->user->name,
                'email' => $m->user->email,
            ])->values()->toArray(),
            'attachments' => $message->attachments->map(fn ($a) => [
                'id' => $a->id,
                'original_name' => $a->original_name,
                'mime_type' => $a->mime_type,
                'size' => $a->size,
                'human_size' => $a->human_size,
                'url' => $a->url,
            ])->values()->toArray(),
            'reactions' => [],
        ];
    }
}
