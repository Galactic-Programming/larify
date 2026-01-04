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
     *
     * @param  array<int, array{emoji: string, count: int, reacted_by_me: bool}>  $reactions
     */
    public function __construct(
        public int $commentId,
        public int $taskId,
        public int $projectId,
        public string $emoji,
        public string $action, // 'added' or 'removed'
        public int $userId,
        public string $userName,
        public array $reactions = []
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
            'task_id' => $this->taskId,
            'emoji' => $this->emoji,
            'action' => $this->action,
            'user_id' => $this->userId,
            'user' => [
                'id' => $this->userId,
                'name' => $this->userName,
            ],
            'reactions' => $this->reactions,
        ];
    }
}
