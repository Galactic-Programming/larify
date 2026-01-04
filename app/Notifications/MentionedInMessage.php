<?php

namespace App\Notifications;

use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class MentionedInMessage extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Message $message
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
     * Get the array representation of the notification for database storage.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'mention',
            'message_id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'conversation_name' => $this->message->conversation->getDisplayName(),
            'sender_id' => $this->message->sender_id,
            'sender_name' => $this->message->sender?->name ?? 'Unknown',
            'sender_avatar' => $this->message->sender?->avatar,
            'content_preview' => str($this->message->content)->limit(100)->toString(),
            'url' => "/conversations/{$this->message->conversation_id}",
        ];
    }
}
