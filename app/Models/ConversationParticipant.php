<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConversationParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'user_id',
        'last_read_at',
        'notifications_muted',
    ];

    protected function casts(): array
    {
        return [
            'last_read_at' => 'datetime',
            'notifications_muted' => 'boolean',
        ];
    }

    /**
     * Get the conversation.
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Get the user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Mark messages as read up to now.
     */
    public function markAsRead(): void
    {
        $this->update(['last_read_at' => now()]);
    }

    /**
     * Toggle notification mute.
     */
    public function toggleMute(): void
    {
        $this->update(['notifications_muted' => ! $this->notifications_muted]);
    }
}
