<?php

namespace App\Events;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ParticipantAdded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Conversation $conversation,
        public User $addedUser,
        public ?User $addedBy = null
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\PrivateChannel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            // Notify existing participants
            new PrivateChannel('conversation.'.$this->conversation->id),
            // Notify the added user about their new conversation
            new PrivateChannel('user.'.$this->addedUser->id.'.conversations'),
        ];

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
            'conversation_id' => $this->conversation->id,
            'added_user' => [
                'id' => $this->addedUser->id,
                'name' => $this->addedUser->name,
                'avatar' => $this->addedUser->avatar,
            ],
            'added_by' => $this->addedBy ? [
                'id' => $this->addedBy->id,
                'name' => $this->addedBy->name,
            ] : null,
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'participant.added';
    }
}
