<?php

namespace App\Events;

use App\Models\Project;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProjectUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(
        public Project $project,
        public string $action = 'updated',
        public ?int $userId = null // The user who owns the project (for user channel)
    ) {
        $this->userId = $userId ?? $project->user_id;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            // Broadcast to project channel (for members viewing project details)
            new PrivateChannel('project.' . $this->project->id),
            // Broadcast to user channel (for owner's project list)
            new PrivateChannel('user.' . $this->userId . '.projects'),
        ];

        // Also broadcast to all members' user channels
        foreach ($this->project->projectMembers as $member) {
            $channels[] = new PrivateChannel('user.' . $member->user_id . '.projects');
        }

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
            'project' => [
                'id' => $this->project->id,
                'user_id' => $this->project->user_id,
                'name' => $this->project->name,
                'description' => $this->project->description,
                'color' => $this->project->color,
                'icon' => $this->project->icon,
                'is_archived' => $this->project->is_archived,
                'lists_count' => $this->project->lists()->count(),
                'tasks_count' => $this->project->tasks()->count(),
                'members_count' => $this->project->projectMembers()->count(),
                'created_at' => $this->project->created_at->toISOString(),
                'updated_at' => $this->project->updated_at->toISOString(),
            ],
            'action' => $this->action,
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'project.updated';
    }
}
