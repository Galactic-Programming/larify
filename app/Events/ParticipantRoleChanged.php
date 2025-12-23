<?php

namespace App\Events;

use App\Enums\ParticipantRole;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ParticipantRoleChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Conversation $conversation,
        public User $user,
        public ParticipantRole $newRole,
        public ?User $changedBy = null
    ) {}

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
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ],
            'new_role' => $this->newRole->value,
            'changed_by' => $this->changedBy ? [
                'id' => $this->changedBy->id,
                'name' => $this->changedBy->name,
            ] : null,
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'participant.role_changed';
    }
}
