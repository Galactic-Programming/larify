<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageMention extends Model
{
    protected $fillable = [
        'message_id',
        'user_id',
    ];

    /**
     * Get the message that contains this mention.
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    /**
     * Get the user who was mentioned.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
