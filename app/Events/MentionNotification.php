<?php

namespace App\Events;

use App\Models\Message;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MentionNotification implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Message $message,
        public User $mentionedUser,
        public string $notificationId
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('App.Models.User.'.$this->mentionedUser->id),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->notificationId,
            'type' => 'mention',
            'data' => [
                'message_id' => $this->message->id,
                'conversation_id' => $this->message->conversation_id,
                'conversation_name' => $this->message->conversation->getDisplayName(),
                'sender_id' => $this->message->sender_id,
                'sender_name' => $this->message->sender?->name ?? 'Unknown',
                'sender_avatar' => $this->message->sender?->avatar,
                'content_preview' => str($this->message->content)->limit(100)->toString(),
                'url' => "/conversations/{$this->message->conversation_id}",
                'message' => "{$this->message->sender?->name} mentioned you in {$this->message->conversation->getDisplayName()}",
            ],
            'read_at' => null,
            'is_read' => false,
            'created_at' => now()->toISOString(),
            'created_at_human' => 'just now',
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'mention.notification';
    }
}
