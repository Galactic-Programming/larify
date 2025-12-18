<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskDueSoon extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Task $task,
        public string $timeUntilDue = '24 hours',
        public int $reminderHours = 24
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
        return 'task.due_soon';
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Task due soon: {$this->task->title}")
            ->greeting("Hello {$notifiable->name}!")
            ->line("Your task \"{$this->task->title}\" is due in {$this->timeUntilDue}.")
            ->line("Project: {$this->task->project->name}")
            ->action('View Task', url("/projects/{$this->task->project_id}"))
            ->line('Don\'t forget to complete it on time!');
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
            'due_date' => $this->task->due_date->toDateString(),
            'due_time' => $this->task->due_time,
            'time_until_due' => $this->timeUntilDue,
            'reminder_hours' => $this->reminderHours,
            'message' => "\"{$this->task->title}\" is due in {$this->timeUntilDue}",
        ];
    }
}
