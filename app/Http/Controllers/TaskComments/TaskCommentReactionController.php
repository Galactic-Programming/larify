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

        // Check if user already reacted with this emoji
        $existingReaction = TaskCommentReaction::where('task_comment_id', $comment->id)
            ->where('user_id', $user->id)
            ->where('emoji', $emoji)
            ->first();

        if ($existingReaction) {
            // Remove reaction
            $existingReaction->delete();
            $action = 'removed';
        } else {
            // Add reaction
            TaskCommentReaction::create([
                'task_comment_id' => $comment->id,
                'user_id' => $user->id,
                'emoji' => $emoji,
            ]);
            $action = 'added';
        }

        // Broadcast to other users
        broadcast(new TaskCommentReactionToggled(
            $comment->id,
            $task->id,
            $project->id,
            $emoji,
            $action,
            $user->id,
            $user->name
        ))->toOthers();

        // Return updated reactions
        $comment->load('reactions.user:id,name');

        return response()->json([
            'action' => $action,
            'reactions' => $this->getGroupedReactions($comment, $user->id),
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
