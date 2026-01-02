<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskCommentReaction extends Model
{
    protected $fillable = [
        'task_comment_id',
        'user_id',
        'emoji',
    ];

    /**
     * Get the comment that owns the reaction.
     */
    public function comment(): BelongsTo
    {
        return $this->belongsTo(TaskComment::class, 'task_comment_id');
    }

    /**
     * Get the user who created the reaction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
