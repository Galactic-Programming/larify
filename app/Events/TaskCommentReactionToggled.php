<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskCommentReactionToggled implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public int $commentId,
        public int $taskId,
        public int $projectId,
        public string $emoji,
        public string $action, // 'added' or 'removed'
        public int $userId,
        public string $userName
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('project.'.$this->projectId.'.task.'.$this->taskId.'.comments'),
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
            'comment_id' => $this->commentId,
            'emoji' => $this->emoji,
            'action' => $this->action,
            'user' => [
                'id' => $this->userId,
                'name' => $this->userName,
            ],
        ];
    }
}
