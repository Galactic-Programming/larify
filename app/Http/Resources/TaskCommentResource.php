<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\TaskComment
 */
class TaskCommentResource extends JsonResource
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
            'task_id' => $this->task_id,
            'content' => $this->content,
            'is_edited' => $this->is_edited,
            'edited_at' => $this->edited_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'user' => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'avatar' => $this->user->avatar,
            ] : null,
            'is_mine' => $this->user_id === $request->user()?->id,
            'can_edit' => $this->canEdit($request->user()),
            'can_delete' => $this->canDelete($request->user()),
            'reactions' => $this->getGroupedReactions($request->user()?->id),
        ];
    }

    /**
     * Check if current user can edit this comment.
     */
    private function canEdit(?\App\Models\User $user): bool
    {
        if (! $user || $this->user_id !== $user->id) {
            return false;
        }

        $editTimeLimit = config('chat.edit_time_limit', 15);

        return $this->created_at->diffInMinutes(now()) <= $editTimeLimit;
    }

    /**
     * Check if current user can delete this comment.
     */
    private function canDelete(?\App\Models\User $user): bool
    {
        if (! $user) {
            return false;
        }

        // Comment owner can delete
        if ($this->user_id === $user->id) {
            return true;
        }

        // Project owner can delete
        return $this->task->project->user_id === $user->id;
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
}
