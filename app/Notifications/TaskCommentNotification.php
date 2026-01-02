<?php

namespace App\Notifications;

use App\Models\TaskComment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskCommentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     *
     * @param  string  $type  'mention', 'task_assignee', or 'reply'
     */
    public function __construct(
        public TaskComment $comment,
        public string $type = 'mention'
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Get the database notification type.
     */
    public function databaseType(object $notifiable): string
    {
        return match ($this->type) {
            'mention' => 'task_comment.mention',
            'reply' => 'task_comment.reply',
            default => 'task_comment.new',
        };
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $task = $this->comment->task;
        $project = $task->project;
        $commenter = $this->comment->user;

        $subject = match ($this->type) {
            'mention' => "{$commenter->name} mentioned you in a comment",
            'reply' => "{$commenter->name} replied to your comment",
            default => "New comment on task: {$task->title}",
        };

        return (new MailMessage)
            ->subject($subject)
            ->greeting("Hello {$notifiable->name}!")
            ->line($this->getMessage())
            ->line("Comment: \"{$this->truncateContent($this->comment->content)}\"")
            ->action('View Task', url("/projects/{$project->id}"))
            ->line('Thank you for using LaraFlow!');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $task = $this->comment->task;
        $project = $task->project;
        $commenter = $this->comment->user;

        return [
            'comment_id' => $this->comment->id,
            'task_id' => $task->id,
            'task_title' => $task->title,
            'project_id' => $project->id,
            'project_name' => $project->name,
            'commenter_id' => $commenter->id,
            'commenter_name' => $commenter->name,
            'commenter_avatar' => $commenter->avatar,
            'comment_preview' => $this->truncateContent($this->comment->content),
            'type' => $this->type,
            'message' => $this->getMessage(),
        ];
    }

    /**
     * Get the notification message.
     */
    private function getMessage(): string
    {
        $commenter = $this->comment->user->name;
        $taskTitle = $this->comment->task->title;

        return match ($this->type) {
            'mention' => "{$commenter} mentioned you in a comment on \"{$taskTitle}\"",
            'reply' => "{$commenter} replied to your comment on \"{$taskTitle}\"",
            default => "{$commenter} commented on \"{$taskTitle}\"",
        };
    }

    /**
     * Truncate comment content for preview.
     */
    private function truncateContent(string $content, int $length = 100): string
    {
        if (mb_strlen($content) <= $length) {
            return $content;
        }

        return mb_substr($content, 0, $length).'...';
    }
}
