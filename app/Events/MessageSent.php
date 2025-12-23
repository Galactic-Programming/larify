<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Message $message
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\PrivateChannel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('conversation.'.$this->message->conversation_id),
        ];

        // Also broadcast to each participant's user channel for sidebar updates
        $participants = $this->message->conversation->activeParticipants()
            ->where('users.id', '!=', $this->message->sender_id)
            ->pluck('users.id');

        foreach ($participants as $userId) {
            $channels[] = new PrivateChannel('user.'.$userId.'.conversations');
        }

        return $channels;
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->message->conversation_id,
            'message' => [
                'id' => $this->message->id,
                'conversation_id' => $this->message->conversation_id,
                'content' => $this->message->content,
                'parent_id' => $this->message->parent_id,
                'is_edited' => $this->message->is_edited,
                'created_at' => $this->message->created_at->toISOString(),
                'sender' => [
                    'id' => $this->message->sender->id,
                    'name' => $this->message->sender->name,
                    'avatar' => $this->message->sender->avatar,
                ],
                'is_mine' => false, // Broadcast is always for other users
                'parent' => $this->message->parent ? [
                    'id' => $this->message->parent->id,
                    'content' => $this->message->parent->trashed() ? null : $this->message->parent->content,
                    'sender_name' => $this->message->parent->trashed() ? null : $this->message->parent->sender?->name,
                    'is_deleted' => $this->message->parent->trashed(),
                ] : null,
                'attachments' => $this->message->attachments->map(fn ($a) => [
                    'id' => $a->id,
                    'original_name' => $a->original_name,
                    'mime_type' => $a->mime_type,
                    'size' => $a->size,
                    'human_size' => $a->human_size,
                    'url' => $a->url,
                ])->toArray(),
            ],
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'message.sent';
    }
}
