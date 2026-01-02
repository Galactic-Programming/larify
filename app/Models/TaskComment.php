<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaskComment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'task_id',
        'user_id',
        'parent_id',
        'content',
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
     * Get the task that owns the comment.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Get the user who created the comment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the parent comment (for nested replies).
     * Include soft-deleted to show "Deleted comment" placeholder.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(TaskComment::class, 'parent_id')->withTrashed();
    }

    /**
     * Get the replies to this comment.
     */
    public function replies(): HasMany
    {
        return $this->hasMany(TaskComment::class, 'parent_id');
    }

    /**
     * Get the reactions on this comment.
     */
    public function reactions(): HasMany
    {
        return $this->hasMany(TaskCommentReaction::class);
    }

    /**
     * Get the mentions in this comment.
     */
    public function mentions(): HasMany
    {
        return $this->hasMany(TaskCommentMention::class);
    }

    /**
     * Check if the comment is a reply.
     */
    public function isReply(): bool
    {
        return $this->parent_id !== null;
    }

    /**
     * Check if the comment was created by a specific user.
     */
    public function isCreatedBy(User $user): bool
    {
        return $this->user_id === $user->id;
    }

    /**
     * Edit the comment content.
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
