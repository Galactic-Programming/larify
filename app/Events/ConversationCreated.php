<?php

namespace App\Events;

use App\Models\Conversation;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ConversationCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Conversation $conversation
    ) {}

    /**
     * Get the channels the event should broadcast on.
     * Broadcast to each participant's personal channel.
     *
     * @return array<int, \Illuminate\Broadcasting\PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return $this->conversation->activeParticipants
            ->pluck('id')
            ->map(fn ($userId) => new PrivateChannel('user.'.$userId.'.conversations'))
            ->toArray();
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'conversation' => [
                'id' => $this->conversation->id,
                'type' => $this->conversation->type->value,
                'name' => $this->conversation->name,
                'avatar' => $this->conversation->avatar,
                'created_at' => $this->conversation->created_at->toISOString(),
                'participants' => $this->conversation->activeParticipants->map(fn ($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar' => $user->avatar,
                ])->toArray(),
            ],
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'conversation.created';
    }
}
