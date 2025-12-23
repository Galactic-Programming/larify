<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'content',
        'parent_id',
        'is_edited',
        'edited_at',
    ];

    protected function casts(): array
    {
        return [
            'is_edited' => 'boolean',
            'edited_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function booted(): void
    {
        // Update conversation's last_message_at when a message is created
        static::created(function (Message $message) {
            $message->conversation->update([
                'last_message_at' => $message->created_at,
            ]);
        });
    }

    /**
     * Get the conversation.
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Get the sender.
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Get the parent message (for replies).
     * Include soft-deleted messages so we can show "Deleted message" placeholder.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'parent_id')->withTrashed();
    }

    /**
     * Get the replies to this message.
     */
    public function replies(): HasMany
    {
        return $this->hasMany(Message::class, 'parent_id');
    }

    /**
     * Get the attachments.
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(MessageAttachment::class);
    }

    /**
     * Check if the message has attachments.
     */
    public function hasAttachments(): bool
    {
        return $this->attachments()->exists();
    }

    /**
     * Check if the message is a reply.
     */
    public function isReply(): bool
    {
        return $this->parent_id !== null;
    }

    /**
     * Check if the message was sent by a specific user.
     */
    public function isSentBy(User $user): bool
    {
        return $this->sender_id === $user->id;
    }

    /**
     * Edit the message content.
     */
    public function edit(string $content): void
    {
        $this->update([
            'content' => $content,
            'is_edited' => true,
            'edited_at' => now(),
        ]);
    }
}
