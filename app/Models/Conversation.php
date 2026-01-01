<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Conversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'last_message_at',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }

    /**
     * Get the project that owns this conversation.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the participants of the conversation.
     */
    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conversation_participants')
            ->withPivot(['last_read_at', 'notifications_muted'])
            ->withTimestamps();
    }

    /**
     * Get the conversation participant records.
     */
    public function participantRecords(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    /**
     * Get the messages in the conversation.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Get the latest message in the conversation.
     */
    public function latestMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    /**
     * Check if a user is a participant.
     */
    public function hasParticipant(User $user): bool
    {
        return $this->participants()->where('users.id', $user->id)->exists();
    }

    /**
     * Get display name for the conversation (= project name).
     */
    public function getDisplayName(): string
    {
        return $this->project?->name ?? 'Unknown Project';
    }

    /**
     * Get display color for the conversation (= project color).
     */
    public function getDisplayColor(): string
    {
        return $this->project?->color ?? '#6366f1';
    }

    /**
     * Get display icon for the conversation (= project icon).
     */
    public function getDisplayIcon(): ?string
    {
        return $this->project?->icon;
    }

    /**
     * Get unread messages count for a user.
     */
    public function getUnreadCount(User $user): int
    {
        $participant = $this->participantRecords()
            ->where('user_id', $user->id)
            ->first();

        if (! $participant || ! $participant->last_read_at) {
            return $this->messages()->count();
        }

        return $this->messages()
            ->where('created_at', '>', $participant->last_read_at)
            ->where('sender_id', '!=', $user->id)
            ->count();
    }

    /**
     * Sync participants with project members.
     * This should be called whenever project members change.
     */
    public function syncWithProjectMembers(): void
    {
        if (! $this->project) {
            return;
        }

        // Get all project member IDs (including owner)
        $memberIds = $this->project->members()->pluck('users.id')->toArray();
        $memberIds[] = $this->project->user_id; // Add owner

        // Sync participants - this will add new members and remove old ones
        $this->participants()->sync($memberIds);
    }
}
