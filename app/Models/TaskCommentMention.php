<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskCommentMention extends Model
{
    protected $fillable = [
        'task_comment_id',
        'user_id',
    ];

    /**
     * Get the comment that owns the mention.
     */
    public function comment(): BelongsTo
    {
        return $this->belongsTo(TaskComment::class, 'task_comment_id');
    }

    /**
     * Get the user who was mentioned.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
