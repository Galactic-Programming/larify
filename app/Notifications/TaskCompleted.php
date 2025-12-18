<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskCompleted extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Task $task,
        public User $completedBy
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
        return 'task.completed';
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Task completed: {$this->task->title}")
            ->greeting("Hello {$notifiable->name}!")
            ->line("{$this->completedBy->name} completed the task \"{$this->task->title}\" in project \"{$this->task->project->name}\".")
            ->action('View Project', url("/projects/{$this->task->project_id}"))
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
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'project_id' => $this->task->project_id,
            'project_name' => $this->task->project->name,
            'completed_by_id' => $this->completedBy->id,
            'completed_by_name' => $this->completedBy->name,
            'completed_by_avatar' => $this->completedBy->avatar,
            'message' => "{$this->completedBy->name} completed \"{$this->task->title}\"",
        ];
    }
}
