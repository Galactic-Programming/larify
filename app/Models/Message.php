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

    /**
     * Time window (in minutes) during which a message can be deleted by its sender.
     */
    public const DELETE_WINDOW_MINUTES = 5;

    protected $fillable = [
        'conversation_id',
        'sender_id',
        'content',
    ];

    protected function casts(): array
    {
        return [
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
     * Get the attachments.
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(MessageAttachment::class);
    }

    /**
     * Get the mentions in this message.
     */
    public function mentions(): HasMany
    {
        return $this->hasMany(MessageMention::class);
    }

    /**
     * Check if the message has attachments.
     */
    public function hasAttachments(): bool
    {
        return $this->attachments()->exists();
    }

    /**
     * Check if the message was sent by a specific user.
     */
    public function isSentBy(User $user): bool
    {
        return $this->sender_id === $user->id;
    }

    /**
     * Check if the message can still be deleted by its sender.
     * Messages can only be deleted within DELETE_WINDOW_MINUTES of being sent.
     */
    public function canBeDeletedBySender(): bool
    {
        return $this->created_at->diffInMinutes(now()) <= self::DELETE_WINDOW_MINUTES;
    }

    /**
     * Parse @mentions from message content and return user IDs.
     * Supports formats: @Full Name, @username, @email@domain.com
     *
     * @param  array<int>  $participantIds  List of valid participant IDs to match against
     * @return array<int> Array of mentioned user IDs
     */
    public function parseMentions(array $participantIds = []): array
    {
        if (empty($this->content)) {
            return [];
        }

        // Get all participants to check for mentions
        $query = User::query();
        if (! empty($participantIds)) {
            $query->whereIn('id', $participantIds);
        }
        $participants = $query->get(['id', 'name', 'email']);

        $mentionedUserIds = [];

        foreach ($participants as $participant) {
            // Check if @Name or @Email exists in content (case-insensitive)
            $namePattern = '@'.preg_quote($participant->name, '/');
            $emailPattern = '@'.preg_quote($participant->email, '/');

            if (preg_match('/'.$namePattern.'(?!\w)/iu', $this->content) ||
                preg_match('/'.$emailPattern.'(?!\w)/iu', $this->content)) {
                $mentionedUserIds[] = $participant->id;
            }
        }

        return array_unique($mentionedUserIds);
    }

    /**
     * Sync mentions for this message based on its content.
     *
     * @param  array<int>  $participantIds  List of valid participant IDs
     */
    public function syncMentions(array $participantIds = []): void
    {
        $mentionedUserIds = $this->parseMentions($participantIds);

        // Delete existing mentions
        $this->mentions()->delete();

        // Create new mentions
        foreach ($mentionedUserIds as $userId) {
            $this->mentions()->create(['user_id' => $userId]);
        }
    }
}
