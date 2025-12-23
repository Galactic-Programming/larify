<?php

namespace App\Http\Controllers\Conversations;

use App\Events\MessageDeleted;
use App\Events\MessageEdited;
use App\Events\MessageRead;
use App\Events\MessageSent;
use App\Events\UserTyping;
use App\Http\Controllers\Controller;
use App\Http\Requests\Conversations\StoreMessageRequest;
use App\Http\Requests\Conversations\UpdateMessageRequest;
use App\Models\Conversation;
use App\Models\Message;
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
            ->with(['sender:id,name,avatar', 'attachments', 'parent.sender:id,name'])
            ->orderBy('created_at', 'desc');

        if ($before) {
            $beforeMessage = Message::find($before);
            if ($beforeMessage) {
                $query->where('created_at', '<', $beforeMessage->created_at);
            }
        }

        $messages = $query->limit($limit)->get()->reverse()->values();

        return response()->json([
            'messages' => $messages->map(fn ($message) => [
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
            'parent_id' => $validated['parent_id'] ?? null,
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

        // Load relationships for broadcasting
        $message->load(['sender:id,name,avatar', 'attachments']);

        // Broadcast the message
        broadcast(new MessageSent($message))->toOthers();

        // Return JSON for AJAX requests
        if ($request->expectsJson()) {
            return response()->json([
                'message' => [
                    'id' => $message->id,
                    'content' => $message->content,
                    'is_edited' => $message->is_edited,
                    'created_at' => $message->created_at->toISOString(),
                    'sender' => [
                        'id' => $message->sender->id,
                        'name' => $message->sender->name,
                        'avatar' => $message->sender->avatar,
                    ],
                    'is_mine' => true,
                    'attachments' => $message->attachments->map(fn ($a) => [
                        'id' => $a->id,
                        'original_name' => $a->original_name,
                        'mime_type' => $a->mime_type,
                        'size' => $a->size,
                        'human_size' => $a->human_size,
                        'url' => $a->url,
                    ]),
                ],
            ], 201);
        }

        return back();
    }

    /**
     * Update the specified message.
     */
    public function update(UpdateMessageRequest $request, Conversation $conversation, Message $message): RedirectResponse|JsonResponse
    {
        // Verify message belongs to conversation
        if ($message->conversation_id !== $conversation->id) {
            abort(404);
        }

        $message->edit($request->validated('content'));

        // Broadcast the edit
        broadcast(new MessageEdited($message))->toOthers();

        if ($request->expectsJson()) {
            return response()->json([
                'message' => [
                    'id' => $message->id,
                    'content' => $message->content,
                    'is_edited' => $message->is_edited,
                    'edited_at' => $message->edited_at->toISOString(),
                ],
            ]);
        }

        return back();
    }

    /**
     * Delete the specified message.
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

        $lastMessageId = $request->input('last_message_id');

        // Update the participant's last_read_at
        $conversation->participantRecords()
            ->where('user_id', $request->user()->id)
            ->update(['last_read_at' => now()]);

        // Broadcast read receipt
        broadcast(new MessageRead(
            $conversation,
            $request->user(),
            $lastMessageId
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
}
