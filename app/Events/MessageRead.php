<?php

namespace App\Events;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class MessageRead implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Carbon $readAt;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Conversation $conversation,
        public User $user,
        public ?int $lastReadMessageId = null
    ) {
        $this->readAt = now();
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('conversation.'.$this->conversation->id),
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
            'conversation_id' => $this->conversation->id,
            'user_id' => $this->user->id,
            'last_read_message_id' => $this->lastReadMessageId,
            'read_at' => $this->readAt->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'message.read';
    }
}
