<?php

namespace App\Models;

use App\Enums\ConversationType;
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
        'type',
        'name',
        'avatar',
        'created_by',
        'last_message_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => ConversationType::class,
            'last_message_at' => 'datetime',
        ];
    }

    /**
     * Get the user who created the conversation.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the participants of the conversation.
     */
    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conversation_participants')
            ->withPivot(['role', 'nickname', 'last_read_at', 'notifications_muted', 'joined_at', 'left_at'])
            ->withTimestamps();
    }

    /**
     * Get active participants (not left).
     */
    public function activeParticipants(): BelongsToMany
    {
        return $this->participants()->whereNull('conversation_participants.left_at');
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
     * Check if the conversation is a direct message.
     */
    public function isDirect(): bool
    {
        return $this->type === ConversationType::Direct;
    }

    /**
     * Check if the conversation is a group.
     */
    public function isGroup(): bool
    {
        return $this->type === ConversationType::Group;
    }

    /**
     * Check if a user is a participant.
     */
    public function hasParticipant(User $user): bool
    {
        return $this->activeParticipants()->where('users.id', $user->id)->exists();
    }

    /**
     * Get the other participant in a direct conversation.
     */
    public function getOtherParticipant(User $user): ?User
    {
        if (! $this->isDirect()) {
            return null;
        }

        return $this->activeParticipants()
            ->where('users.id', '!=', $user->id)
            ->first();
    }

    /**
     * Get display name for the conversation.
     * For direct: other user's name
     * For group: group name
     */
    public function getDisplayName(User $forUser): string
    {
        if ($this->isGroup()) {
            return $this->name ?? 'Unnamed Group';
        }

        $otherParticipant = $this->getOtherParticipant($forUser);

        return $otherParticipant?->name ?? 'Unknown User';
    }

    /**
     * Get display avatar for the conversation.
     */
    public function getDisplayAvatar(User $forUser): ?string
    {
        if ($this->isGroup()) {
            return $this->avatar;
        }

        $otherParticipant = $this->getOtherParticipant($forUser);

        return $otherParticipant?->avatar;
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
     * Find or create a direct conversation between two users.
     */
    public static function findOrCreateDirect(User $user1, User $user2): self
    {
        // Find existing direct conversation
        $conversation = self::where('type', ConversationType::Direct)
            ->whereHas('activeParticipants', function ($query) use ($user1) {
                $query->where('users.id', $user1->id);
            })
            ->whereHas('activeParticipants', function ($query) use ($user2) {
                $query->where('users.id', $user2->id);
            })
            ->first();

        if ($conversation) {
            return $conversation;
        }

        // Create new direct conversation
        $conversation = self::create([
            'type' => ConversationType::Direct,
            'created_by' => $user1->id,
        ]);

        // Add both participants
        $conversation->participantRecords()->createMany([
            ['user_id' => $user1->id, 'role' => 'owner'],
            ['user_id' => $user2->id, 'role' => 'member'],
        ]);

        return $conversation;
    }
}
