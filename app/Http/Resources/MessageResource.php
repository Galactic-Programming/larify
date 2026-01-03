<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Message
 */
class MessageResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $isMine = $this->sender_id === $request->user()?->id;

        return [
            'id' => $this->id,
            'content' => $this->content,
            'created_at' => $this->created_at->toISOString(),
            'sender' => $this->sender ? [
                'id' => $this->sender->id,
                'name' => $this->sender->name,
                'avatar' => $this->sender->avatar,
            ] : null,
            'is_mine' => $isMine,
            'can_delete' => $isMine && $this->canBeDeletedBySender(),
            'is_read' => $this->when(
                $isMine,
                fn () => $this->isReadBy($this->additional['other_participants_read_at'] ?? null)
            ),
            'mentions' => $this->getMentions(),
            'attachments' => MessageAttachmentResource::collection($this->attachments),
        ];
    }

    /**
     * Get mentions from this message.
     *
     * @return array<int, array{user_id: int, name: string, email: string}>
     */
    private function getMentions(): array
    {
        if (! $this->relationLoaded('mentions')) {
            return [];
        }

        return $this->mentions->map(fn ($m) => [
            'user_id' => $m->user_id,
            'name' => $m->user?->name,
            'email' => $m->user?->email,
        ])->values()->toArray();
    }

    /**
     * Check if message is read by other participants.
     */
    private function isReadBy(?string $otherParticipantsReadAt): bool
    {
        if (! $otherParticipantsReadAt) {
            return false;
        }

        return $this->created_at <= new \DateTime($otherParticipantsReadAt);
    }
}
