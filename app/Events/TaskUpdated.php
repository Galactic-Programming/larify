<?php

namespace App\Events;

use App\Models\Task;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Task $task,
        public string $action = 'updated'
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('project.'.$this->task->project_id),
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
            'task' => [
                'id' => $this->task->id,
                'list_id' => $this->task->list_id,
                'title' => $this->task->title,
                'description' => $this->task->description,
                'priority' => $this->task->priority,
                'due_date' => $this->task->due_date?->format('Y-m-d'),
                'due_time' => $this->task->due_time,
                'started_at' => $this->task->started_at?->toISOString(),
                'completed_at' => $this->task->completed_at?->toISOString(),
                'assigned_to' => $this->task->assigned_to,
                'assignee' => $this->task->assignee ? [
                    'id' => $this->task->assignee->id,
                    'name' => $this->task->assignee->name,
                    'email' => $this->task->assignee->email,
                    'avatar' => $this->task->assignee->avatar,
                ] : null,
                'position' => $this->task->position,
                'created_at' => $this->task->created_at->toISOString(),
                'updated_at' => $this->task->updated_at->toISOString(),
            ],
            'action' => $this->action,
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'task.updated';
    }
}
