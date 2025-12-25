<?php

namespace App\Notifications;

use App\Enums\ProjectRole;
use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProjectInvitation extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Project $project,
        public User $invitedBy,
        public ProjectRole $role
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail', 'broadcast'];
    }

    /**
     * Get the database notification type.
     */
    public function databaseType(object $notifiable): string
    {
        return 'project.invitation';
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("You've been invited to project: {$this->project->name}")
            ->greeting("Hello {$notifiable->name}!")
            ->line("{$this->invitedBy->name} invited you to join the project \"{$this->project->name}\" as {$this->role->label()}.")
            ->action('View Project', url("/projects/{$this->project->id}"))
            ->line('Thank you for using LaraFlow!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'project_id' => $this->project->id,
            'project_name' => $this->project->name,
            'project_color' => $this->project->color,
            'project_icon' => $this->project->icon,
            'invited_by_id' => $this->invitedBy->id,
            'invited_by_name' => $this->invitedBy->name,
            'invited_by_avatar' => $this->invitedBy->avatar,
            'role' => $this->role->value,
            'role_label' => $this->role->label(),
            'message' => "{$this->invitedBy->name} added you to \"{$this->project->name}\"",
        ];
    }
}
