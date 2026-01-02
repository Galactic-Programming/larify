<?php

namespace App\Http\Controllers\TaskComments;

use App\Enums\UserPlan;
use App\Events\TaskCommentCreated;
use App\Events\TaskCommentDeleted;
use App\Events\TaskCommentUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\TaskComments\StoreTaskCommentRequest;
use App\Http\Requests\TaskComments\UpdateTaskCommentRequest;
use App\Http\Resources\TaskCommentResource;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\TaskCommentMention;
use App\Notifications\TaskCommentNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class TaskCommentController extends Controller
{
    /**
     * List comments for a task.
     */
    public function index(Request $request, Project $project, Task $task): JsonResponse
    {
        Gate::authorize('view', $project);

        // Verify task belongs to project
        if ($task->project_id !== $project->id) {
            abort(404);
        }

        $limit = min((int) $request->query('limit', 50), 100);
        $cursor = $request->query('cursor');

        $query = $task->comments()
            ->with([
                'user:id,name,avatar',
                'parent.user:id,name',
                'reactions.user:id,name',
                'replies' => fn ($q) => $q->with(['user:id,name,avatar', 'reactions.user:id,name'])->latest()->limit(3),
            ])
            ->withCount('replies')
            ->orderBy('created_at', 'desc');

        if ($cursor) {
            $cursorComment = TaskComment::find($cursor);
            if ($cursorComment) {
                $query->where('created_at', '<', $cursorComment->created_at);
            }
        }

        $comments = $query->limit($limit + 1)->get();
        $hasMore = $comments->count() > $limit;

        if ($hasMore) {
            $comments = $comments->take($limit);
        }

        // Get user plan for permission check
        $user = $request->user();
        $plan = $user->plan ?? UserPlan::Free;

        return response()->json([
            'comments' => TaskCommentResource::collection($comments->reverse()->values()),
            'has_more' => $hasMore,
            'next_cursor' => $hasMore ? $comments->last()?->id : null,
            'permissions' => [
                'can_create' => $plan->canCreateComments(),
                'can_use_mentions' => $plan->canUseMentions(),
                'can_use_reactions' => $plan->canUseCommentReactions(),
            ],
        ]);
    }

    /**
     * Store a new comment.
     */
    public function store(StoreTaskCommentRequest $request, Project $project, Task $task): JsonResponse
    {
        // Verify task belongs to project
        if ($task->project_id !== $project->id) {
            abort(404);
        }

        $validated = $request->validated();
        $user = $request->user();
        $plan = $user->plan ?? UserPlan::Free;

        DB::beginTransaction();

        try {
            // Create the comment
            $comment = $task->allComments()->create([
                'user_id' => $user->id,
                'content' => $validated['content'],
                'parent_id' => $validated['parent_id'] ?? null,
            ]);

            // Process mentions if allowed
            if ($plan->canUseMentions() && ! empty($validated['mentions'])) {
                $mentions = [];
                foreach ($validated['mentions'] as $userId) {
                    // Only allow mentioning project members
                    if ($project->hasMember(\App\Models\User::find($userId))) {
                        $mentions[] = [
                            'task_comment_id' => $comment->id,
                            'user_id' => $userId,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                }
                if (! empty($mentions)) {
                    TaskCommentMention::insert($mentions);
                }
            }

            DB::commit();

            // Load relationships
            $comment->load(['user:id,name,avatar', 'parent.user:id,name', 'mentions.user:id,name']);

            // Broadcast to other users
            broadcast(new TaskCommentCreated($comment))->toOthers();

            // Notify mentioned users and task assignee
            $this->notifyUsers($comment, $project, $task);

            return response()->json([
                'comment' => new TaskCommentResource($comment),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update an existing comment.
     */
    public function update(UpdateTaskCommentRequest $request, Project $project, Task $task, TaskComment $comment): JsonResponse
    {
        // Verify task belongs to project
        if ($task->project_id !== $project->id || $comment->task_id !== $task->id) {
            abort(404);
        }

        // Check authorization (owner and time limit)
        Gate::authorize('update', $comment);

        $validated = $request->validated();
        $user = $request->user();
        $plan = $user->plan ?? UserPlan::Free;

        DB::beginTransaction();

        try {
            // Update the comment
            $comment->edit($validated['content']);

            // Update mentions if allowed
            if ($plan->canUseMentions() && isset($validated['mentions'])) {
                // Remove old mentions
                $comment->mentions()->delete();

                // Add new mentions
                $mentions = [];
                foreach ($validated['mentions'] as $userId) {
                    if ($project->hasMember(\App\Models\User::find($userId))) {
                        $mentions[] = [
                            'task_comment_id' => $comment->id,
                            'user_id' => $userId,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                }
                if (! empty($mentions)) {
                    TaskCommentMention::insert($mentions);
                }
            }

            DB::commit();

            // Reload
            $comment->load(['user:id,name,avatar', 'parent.user:id,name', 'reactions.user:id,name', 'mentions.user:id,name']);

            // Broadcast
            broadcast(new TaskCommentUpdated($comment))->toOthers();

            return response()->json([
                'comment' => new TaskCommentResource($comment),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Delete a comment.
     */
    public function destroy(Request $request, Project $project, Task $task, TaskComment $comment): JsonResponse
    {
        // Verify task belongs to project
        if ($task->project_id !== $project->id || $comment->task_id !== $task->id) {
            abort(404);
        }

        Gate::authorize('delete', $comment);

        $commentId = $comment->id;
        $taskId = $task->id;
        $projectId = $project->id;

        // Soft delete
        $comment->delete();

        // Broadcast
        broadcast(new TaskCommentDeleted($commentId, $taskId, $projectId))->toOthers();

        return response()->json([
            'message' => 'Comment deleted successfully.',
        ]);
    }

    /**
     * Get replies for a comment.
     */
    public function replies(Request $request, Project $project, Task $task, TaskComment $comment): JsonResponse
    {
        Gate::authorize('view', $project);

        // Verify
        if ($task->project_id !== $project->id || $comment->task_id !== $task->id) {
            abort(404);
        }

        $limit = min((int) $request->query('limit', 20), 50);
        $cursor = $request->query('cursor');

        $query = $comment->replies()
            ->with(['user:id,name,avatar', 'reactions.user:id,name'])
            ->orderBy('created_at', 'asc');

        if ($cursor) {
            $cursorReply = TaskComment::find($cursor);
            if ($cursorReply) {
                $query->where('created_at', '>', $cursorReply->created_at);
            }
        }

        $replies = $query->limit($limit + 1)->get();
        $hasMore = $replies->count() > $limit;

        if ($hasMore) {
            $replies = $replies->take($limit);
        }

        return response()->json([
            'replies' => TaskCommentResource::collection($replies),
            'has_more' => $hasMore,
            'next_cursor' => $hasMore ? $replies->last()?->id : null,
        ]);
    }

    /**
     * Notify relevant users about a new comment.
     */
    private function notifyUsers(TaskComment $comment, Project $project, Task $task): void
    {
        $notifiedUserIds = [$comment->user_id]; // Don't notify the commenter

        // Notify mentioned users
        foreach ($comment->mentions as $mention) {
            if (! in_array($mention->user_id, $notifiedUserIds)) {
                $mention->user->notify(new TaskCommentNotification($comment, 'mention'));
                $notifiedUserIds[] = $mention->user_id;
            }
        }

        // Notify task assignee
        if ($task->assigned_to && ! in_array($task->assigned_to, $notifiedUserIds)) {
            $task->assignee->notify(new TaskCommentNotification($comment, 'task_assignee'));
            $notifiedUserIds[] = $task->assigned_to;
        }

        // If replying, notify the parent comment author
        if ($comment->parent_id && $comment->parent && ! in_array($comment->parent->user_id, $notifiedUserIds)) {
            $comment->parent->user?->notify(new TaskCommentNotification($comment, 'reply'));
        }
    }
}
