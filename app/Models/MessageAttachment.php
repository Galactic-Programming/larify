<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class MessageAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'message_id',
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
        ];
    }

    /**
     * Get the message.
     */
    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    /**
     * Get the secure URL of the attachment.
     * This URL requires authentication and authorization to access.
     */
    public function getUrlAttribute(): string
    {
        return route('attachments.show', $this);
    }

    /**
     * Get the download URL of the attachment.
     */
    public function getDownloadUrlAttribute(): string
    {
        return route('attachments.download', $this);
    }

    /**
     * Get human-readable file size.
     */
    public function getHumanSizeAttribute(): string
    {
        $bytes = $this->size;

        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2).' GB';
        }

        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2).' MB';
        }

        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 2).' KB';
        }

        return $bytes.' bytes';
    }

    /**
     * Check if the attachment is an image.
     */
    public function isImage(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    /**
     * Check if the attachment is a video.
     */
    public function isVideo(): bool
    {
        return str_starts_with($this->mime_type, 'video/');
    }

    /**
     * Check if the attachment is an audio file.
     */
    public function isAudio(): bool
    {
        return str_starts_with($this->mime_type, 'audio/');
    }

    /**
     * Check if the attachment is a document (PDF, Word, etc.).
     */
    public function isDocument(): bool
    {
        $documentTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv',
        ];

        return in_array($this->mime_type, $documentTypes);
    }

    /**
     * Get the file type category.
     */
    public function getTypeAttribute(): string
    {
        if ($this->isImage()) {
            return 'image';
        }

        if ($this->isVideo()) {
            return 'video';
        }

        if ($this->isAudio()) {
            return 'audio';
        }

        if ($this->isDocument()) {
            return 'document';
        }

        return 'file';
    }

    /**
     * Delete the file from storage when the model is deleted.
     */
    protected static function booted(): void
    {
        static::deleting(function (MessageAttachment $attachment) {
            Storage::disk($attachment->disk)->delete($attachment->path);
        });
    }
}
