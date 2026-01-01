<?php

namespace App\Http\Controllers\Conversations;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\MessageReaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ReactionController extends Controller
{
    /**
     * Toggle a reaction on a message.
     * If the user already has this reaction, remove it.
     * If they have a different reaction, replace it.
     * Each user can only have ONE reaction per message.
     */
    public function toggle(Request $request, Message $message): JsonResponse
    {
        // Check if user can view the conversation (is a participant)
        Gate::authorize('view', $message->conversation);

        $request->validate([
            'emoji' => ['required', 'string', 'max:32'],
        ]);

        $user = $request->user();
        $emoji = $request->input('emoji');

        // Find any existing reaction from this user on this message
        $existingReaction = MessageReaction::where('message_id', $message->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingReaction) {
            if ($existingReaction->emoji === $emoji) {
                // Same emoji - toggle off (remove)
                $existingReaction->delete();
                $added = false;
            } else {
                // Different emoji - replace the reaction
                $existingReaction->update(['emoji' => $emoji]);
                $added = true;
            }
        } else {
            // No existing reaction - create new one
            MessageReaction::create([
                'message_id' => $message->id,
                'user_id' => $user->id,
                'emoji' => $emoji,
            ]);
            $added = true;
        }

        // Return updated reactions for this message
        $reactions = $this->getGroupedReactions($message, $user->id);

        return response()->json([
            'added' => $added,
            'emoji' => $emoji,
            'reactions' => $reactions,
        ]);
    }

    /**
     * Get reactions grouped by emoji with counts and user info.
     */
    private function getGroupedReactions(Message $message, int $currentUserId): array
    {
        $reactions = MessageReaction::with('user:id,name')
            ->where('message_id', $message->id)
            ->get();

        $grouped = [];
        foreach ($reactions as $reaction) {
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
                'name' => $reaction->user->name,
            ];
            if ($reaction->user_id === $currentUserId) {
                $grouped[$emoji]['reacted_by_me'] = true;
            }
        }

        return array_values($grouped);
    }
}
