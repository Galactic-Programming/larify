<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\MessageAttachment
 */
class MessageAttachmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'original_name' => $this->original_name,
            'mime_type' => $this->mime_type,
            'size' => $this->size,
            'human_size' => $this->human_size,
            'url' => $this->url,
            'download_url' => $this->download_url,
            'type' => $this->type,
        ];
    }
}
