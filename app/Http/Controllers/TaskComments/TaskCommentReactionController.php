<?php

namespace App\Http\Controllers\TaskComments;

use App\Enums\UserPlan;
use App\Events\TaskCommentReactionToggled;
use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\TaskCommentReaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TaskCommentReactionController extends Controller
{
    /**
     * Toggle a reaction on a comment.
     */
    public function toggle(Request $request, Project $project, Task $task, TaskComment $comment): JsonResponse
    {
        Gate::authorize('view', $project);

        // Verify task belongs to project
        if ($task->project_id !== $project->id || $comment->task_id !== $task->id) {
            abort(404);
        }

        $user = $request->user();
        $plan = $user->plan ?? UserPlan::Free;

        // Check plan permission
        if (! $plan->canUseCommentReactions()) {
            return response()->json([
                'message' => 'Upgrade to Pro to use reactions.',
                'upgrade_required' => true,
            ], 403);
        }

        $request->validate([
            'emoji' => ['required', 'string', 'max:32'],
        ]);

        $emoji = $request->input('emoji');

        // Check if user already reacted with this exact emoji (for toggle off)
        $existingReaction = TaskCommentReaction::where('task_comment_id', $comment->id)
            ->where('user_id', $user->id)
            ->where('emoji', $emoji)
            ->first();

        if ($existingReaction) {
            // Same emoji - toggle off (remove)
            $existingReaction->delete();
            $action = 'removed';
        } else {
            // Different emoji or no reaction yet
            // First, remove any existing reaction from this user on this comment
            // (each user can only have 1 emoji per comment)
            TaskCommentReaction::where('task_comment_id', $comment->id)
                ->where('user_id', $user->id)
                ->delete();

            // Add the new reaction
            TaskCommentReaction::create([
                'task_comment_id' => $comment->id,
                'user_id' => $user->id,
                'emoji' => $emoji,
            ]);
            $action = 'added';
        }

        // Return updated reactions
        $comment->load('reactions.user:id,name');

        $reactions = $this->getGroupedReactions($comment, $user->id);

        // Broadcast to other users (include reactions for real-time update)
        // For broadcast, set reacted_by_me to false since it's for other users
        $broadcastReactions = array_map(function ($reaction) {
            return [
                'emoji' => $reaction['emoji'],
                'count' => $reaction['count'],
                'reacted_by_me' => false, // Other users haven't reacted
            ];
        }, $reactions);

        broadcast(new TaskCommentReactionToggled(
            $comment->id,
            $task->id,
            $project->id,
            $emoji,
            $action,
            $user->id,
            $user->name,
            $broadcastReactions
        ))->toOthers();

        return response()->json([
            'action' => $action,
            'reactions' => $reactions,
        ]);
    }

    /**
     * Get reactions grouped by emoji.
     *
     * @return array<int, array{emoji: string, count: int, users: array, reacted_by_me: bool}>
     */
    private function getGroupedReactions(TaskComment $comment, int $currentUserId): array
    {
        $grouped = [];
        foreach ($comment->reactions as $reaction) {
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
