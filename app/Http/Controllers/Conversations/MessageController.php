<?php

namespace App\Http\Controllers\Conversations;

use App\Events\MentionNotification;
use App\Events\MessageDeleted;
use App\Events\MessageSent;
use App\Events\UserTyping;
use App\Http\Controllers\Controller;
use App\Http\Requests\Conversations\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Notifications\MentionedInMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
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

        // Create the message
        $message = $conversation->messages()->create([
            'sender_id' => $request->user()->id,
            'content' => $validated['content'] ?? '',
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

        // Return JSON for AJAX requests
        if ($request->expectsJson()) {
            return response()->json([
                'message' => $this->formatMessage($message, true),
            ], 201);
        }

        return back();
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
            ->get();

        return response()->json([
            'participants' => $participants,
        ]);
    }

    /**
     * Format a message for JSON response.
     */
    private function formatMessage(Message $message, bool $isMine): array
    {
        return [
            'id' => $message->id,
            'content' => $message->content,
            'created_at' => $message->created_at->toISOString(),
            'sender' => $message->sender ? [
                'id' => $message->sender->id,
                'name' => $message->sender->name,
                'avatar' => $message->sender->avatar,
            ] : null,
            'is_mine' => $isMine,
            'can_delete' => $isMine && $message->canBeDeletedBySender(),
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
