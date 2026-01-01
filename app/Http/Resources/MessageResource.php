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
        return [
            'id' => $this->id,
            'content' => $this->content,
            'is_edited' => $this->is_edited,
            'edited_at' => $this->edited_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'sender' => $this->sender ? [
                'id' => $this->sender->id,
                'name' => $this->sender->name,
                'avatar' => $this->sender->avatar,
            ] : null,
            'is_mine' => $this->sender_id === $request->user()?->id,
            'is_read' => $this->when(
                $this->sender_id === $request->user()?->id,
                fn () => $this->isReadBy($this->additional['other_participants_read_at'] ?? null)
            ),
            'parent' => $this->when($this->parent, fn () => [
                'id' => $this->parent->id,
                'content' => $this->parent->trashed() ? null : $this->parent->content,
                'sender_name' => $this->parent->trashed() ? null : $this->parent->sender?->name,
                'is_deleted' => $this->parent->trashed(),
            ]),
            'attachments' => MessageAttachmentResource::collection($this->attachments),
            'reactions' => $this->getGroupedReactions($request->user()?->id),
        ];
    }

    /**
     * Get reactions grouped by emoji.
     *
     * @return array<int, array{emoji: string, count: int, users: array, reacted_by_me: bool}>
     */
    private function getGroupedReactions(?int $currentUserId): array
    {
        if (! $this->relationLoaded('reactions')) {
            return [];
        }

        $grouped = [];
        foreach ($this->reactions as $reaction) {
            $emoji = $reaction->emoji;
            if (! isset($grouped[$emoji])) {
                $grouped[$emoji] = [
                    'emoji' => $emoji,
                    'count' => 0,
                    'users' => [],
                    'reacted_by_me' => false,
                ];
            }
            $grouped[$emoji]['count']++;
            $grouped[$emoji]['users'][] = [
                'id' => $reaction->user_id,
                'name' => $reaction->user?->name,
            ];
            if ($reaction->user_id === $currentUserId) {
                $grouped[$emoji]['reacted_by_me'] = true;
            }
        }

        return array_values($grouped);
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
