<?php

namespace App\Events;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ParticipantRemoved implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Conversation $conversation,
        public User $removedUser,
        public ?User $removedBy = null,
        public bool $wasKicked = false
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            // Notify remaining participants
            new PrivateChannel('conversation.'.$this->conversation->id),
            // Notify the removed user
            new PrivateChannel('user.'.$this->removedUser->id.'.conversations'),
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
            'removed_user' => [
                'id' => $this->removedUser->id,
                'name' => $this->removedUser->name,
            ],
            'removed_by' => $this->removedBy ? [
                'id' => $this->removedBy->id,
                'name' => $this->removedBy->name,
            ] : null,
            'was_kicked' => $this->wasKicked,
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'participant.removed';
    }
}
