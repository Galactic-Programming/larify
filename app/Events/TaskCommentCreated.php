<?php

namespace App\Events;

use App\Models\TaskComment;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskCommentCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public TaskComment $comment
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('project.'.$this->comment->task->project_id.'.task.'.$this->comment->task_id.'.comments'),
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
            'comment' => [
                'id' => $this->comment->id,
                'task_id' => $this->comment->task_id,
                'content' => $this->comment->content,
                'parent_id' => $this->comment->parent_id,
                'is_edited' => $this->comment->is_edited,
                'created_at' => $this->comment->created_at->toISOString(),
                'user' => [
                    'id' => $this->comment->user->id,
                    'name' => $this->comment->user->name,
                    'avatar' => $this->comment->user->avatar,
                ],
                'is_mine' => false, // Broadcast is for other users
                'parent' => $this->comment->parent ? [
                    'id' => $this->comment->parent->id,
                    'content' => $this->comment->parent->trashed() ? null : $this->comment->parent->content,
                    'user_name' => $this->comment->parent->trashed() ? null : $this->comment->parent->user?->name,
                    'is_deleted' => $this->comment->parent->trashed(),
                ] : null,
                'reactions' => [],
                'replies_count' => 0,
            ],
        ];
    }
}
