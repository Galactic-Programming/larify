<?php

namespace App\Models;

use App\Enums\ParticipantRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConversationParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'conversation_id',
        'user_id',
        'role',
        'nickname',
        'last_read_at',
        'notifications_muted',
        'joined_at',
        'left_at',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'role' => ParticipantRole::class,
            'last_read_at' => 'datetime',
            'notifications_muted' => 'boolean',
            'joined_at' => 'datetime',
            'left_at' => 'datetime',
            'archived_at' => 'datetime',
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
     * Check if the participant is the owner.
     */
    public function isOwner(): bool
    {
        return $this->role === ParticipantRole::Owner;
    }

    /**
     * Check if the participant is a member.
     */
    public function isMember(): bool
    {
        return $this->role === ParticipantRole::Member;
    }

    /**
     * Check if the participant has left the conversation.
     */
    public function hasLeft(): bool
    {
        return $this->left_at !== null;
    }

    /**
     * Check if the participant is active (not left).
     */
    public function isActive(): bool
    {
        return ! $this->hasLeft();
    }

    /**
     * Check if the participant has archived the conversation.
     */
    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    /**
     * Archive the conversation for this participant.
     */
    public function archive(): void
    {
        $this->update(['archived_at' => now()]);
    }

    /**
     * Unarchive the conversation for this participant.
     */
    public function unarchive(): void
    {
        $this->update(['archived_at' => null]);
    }

    /**
     * Mark messages as read up to now.
     */
    public function markAsRead(): void
    {
        $this->update(['last_read_at' => now()]);
    }

    /**
     * Leave the conversation.
     */
    public function leave(): void
    {
        $this->update(['left_at' => now()]);
    }

    /**
     * Toggle notification mute.
     */
    public function toggleMute(): void
    {
        $this->update(['notifications_muted' => ! $this->notifications_muted]);
    }

    /**
     * Scope to get active participants only.
     */
    public function scopeActive($query)
    {
        return $query->whereNull('left_at');
    }

    /**
     * Scope to get non-archived participants only.
     */
    public function scopeNotArchived($query)
    {
        return $query->whereNull('archived_at');
    }

    /**
     * Scope to get owners only.
     */
    public function scopeOwners($query)
    {
        return $query->where('role', ParticipantRole::Owner);
    }
}
