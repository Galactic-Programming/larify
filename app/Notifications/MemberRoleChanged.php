<?php

namespace App\Notifications;

use App\Enums\ProjectRole;
use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MemberRoleChanged extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Project $project,
        public User $changedBy,
        public ProjectRole $oldRole,
        public ProjectRole $newRole
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the database notification type.
     */
    public function databaseType(object $notifiable): string
    {
        return 'member.role_changed';
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Your role has changed in project: {$this->project->name}")
            ->greeting("Hello {$notifiable->name}!")
            ->line("Your role in \"{$this->project->name}\" has been changed from {$this->oldRole->label()} to {$this->newRole->label()}.")
            ->line("This change was made by {$this->changedBy->name}.")
            ->action('View Project', url("/projects/{$this->project->id}"))
            ->line('Thank you for using Larify!');
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
            'changed_by_id' => $this->changedBy->id,
            'changed_by_name' => $this->changedBy->name,
            'changed_by_avatar' => $this->changedBy->avatar,
            'old_role' => $this->oldRole->value,
            'old_role_label' => $this->oldRole->label(),
            'new_role' => $this->newRole->value,
            'new_role_label' => $this->newRole->label(),
            'message' => "Your role in \"{$this->project->name}\" changed to {$this->newRole->label()}",
        ];
    }
}
