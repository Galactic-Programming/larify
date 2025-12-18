<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskOverdue extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Task $task,
        public string $overdueBy = '1 day',
        public int $overdueHours = 1
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * Get the database notification type.
     */
    public function databaseType(object $notifiable): string
    {
        return 'task.overdue';
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("⚠️ Task overdue: {$this->task->title}")
            ->greeting("Hello {$notifiable->name}!")
            ->line("Your task \"{$this->task->title}\" is overdue by {$this->overdueBy}.")
            ->line("Project: {$this->task->project->name}")
            ->action('View Task', url("/projects/{$this->task->project_id}"))
            ->line('Please complete this task as soon as possible.');
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
            'due_date' => $this->task->due_date?->toISOString(),
            'overdue_by' => $this->overdueBy,
            'overdue_hours' => $this->overdueHours,
            'message' => "\"{$this->task->title}\" is overdue by {$this->overdueBy}",
        ];
    }
}
