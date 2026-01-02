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
use App\Notifications\TaskCommentNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        // Simple query - no nested replies, just flat comments
        $query = $task->comments()
            ->whereNull('parent_id') // Only root comments (flat structure like Trello)
            ->with([
                'user:id,name,avatar',
                'reactions.user:id,name',
            ])
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

        // Create the comment (flat structure - no parent_id)
        $comment = $task->comments()->create([
            'user_id' => $user->id,
            'content' => $validated['content'],
        ]);

        // Load relationships
        $comment->load(['user:id,name,avatar', 'reactions.user:id,name']);

        // Broadcast to other users
        broadcast(new TaskCommentCreated($comment))->toOthers();

        // Notify task assignee
        $this->notifyUsers($comment, $project, $task);

        return response()->json([
            'comment' => new TaskCommentResource($comment),
        ], 201);
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

        // Update the comment
        $comment->edit($validated['content']);

        // Reload
        $comment->load(['user:id,name,avatar', 'reactions.user:id,name']);

        // Broadcast
        broadcast(new TaskCommentUpdated($comment))->toOthers();

        return response()->json([
            'comment' => new TaskCommentResource($comment),
        ]);
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
     * Notify relevant users about a new comment.
     */
    private function notifyUsers(TaskComment $comment, Project $project, Task $task): void
    {
        $notifiedUserIds = [$comment->user_id]; // Don't notify the commenter

        // Notify task assignee
        if ($task->assigned_to && ! in_array($task->assigned_to, $notifiedUserIds)) {
            $task->assignee->notify(new TaskCommentNotification($comment, 'task_assignee'));
        }
    }
}
