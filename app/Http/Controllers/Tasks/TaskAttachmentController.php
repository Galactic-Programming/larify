<?php

namespace App\Http\Controllers\Tasks;

use App\Events\TaskAttachmentDeleted;
use App\Events\TaskAttachmentUploaded;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tasks\StoreTaskAttachmentRequest;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskAttachment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TaskAttachmentController extends Controller
{
    /**
     * List attachments for a task.
     */
    public function index(Request $request, Project $project, Task $task): JsonResponse
    {
        Gate::authorize('view', $project);
        abort_if($task->project_id !== $project->id, 404);

        $attachments = $task->attachments()
            ->with('uploader:id,name,avatar')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (TaskAttachment $attachment) => [
                'id' => $attachment->id,
                'original_name' => $attachment->original_name,
                'mime_type' => $attachment->mime_type,
                'size' => $attachment->size,
                'human_size' => $attachment->human_size,
                'type' => $attachment->type,
                'extension' => $attachment->extension,
                'url' => $attachment->url,
                'download_url' => $attachment->download_url,
                'uploaded_by' => $attachment->uploader ? [
                    'id' => $attachment->uploader->id,
                    'name' => $attachment->uploader->name,
                    'avatar' => $attachment->uploader->avatar,
                ] : null,
                'created_at' => $attachment->created_at->toISOString(),
            ]);

        return response()->json([
            'attachments' => $attachments,
        ]);
    }

    /**
     * Upload attachments to a task.
     */
    public function store(StoreTaskAttachmentRequest $request, Project $project, Task $task): JsonResponse
    {
        abort_if($task->project_id !== $project->id, 404);
        Gate::authorize('update', [$task, $project]);

        $user = $request->user();
        $attachments = [];

        $disk = config('filesystems.default');

        foreach ($request->file('files') as $file) {
            $path = $file->store("task-attachments/{$project->id}/{$task->id}", $disk);

            $attachment = $task->attachments()->create([
                'uploaded_by' => $user->id,
                'disk' => $disk,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
            ]);

            // Update user's storage used
            $user->increment('storage_used', $file->getSize());

            $attachment->load('uploader:id,name,avatar');

            $attachmentData = [
                'id' => $attachment->id,
                'original_name' => $attachment->original_name,
                'mime_type' => $attachment->mime_type,
                'size' => $attachment->size,
                'human_size' => $attachment->human_size,
                'type' => $attachment->type,
                'extension' => $attachment->extension,
                'url' => $attachment->url,
                'download_url' => $attachment->download_url,
                'uploaded_by' => $attachment->uploader ? [
                    'id' => $attachment->uploader->id,
                    'name' => $attachment->uploader->name,
                    'avatar' => $attachment->uploader->avatar,
                ] : null,
                'created_at' => $attachment->created_at->toISOString(),
            ];

            $attachments[] = $attachmentData;

            // Broadcast to other users
            broadcast(new TaskAttachmentUploaded(
                $task->id,
                $project->id,
                $attachmentData,
                $user->id
            ))->toOthers();
        }

        return response()->json([
            'attachments' => $attachments,
            'storage_used' => $user->fresh()->storage_used,
        ], 201);
    }

    /**
     * Show/preview an attachment.
     */
    public function show(Request $request, TaskAttachment $taskAttachment): StreamedResponse
    {
        $task = $taskAttachment->task;
        Gate::authorize('view', $task->project);

        $disk = Storage::disk($taskAttachment->disk);

        if (! $disk->exists($taskAttachment->path)) {
            abort(404, 'File not found');
        }

        return $disk->response($taskAttachment->path, $taskAttachment->original_name, [
            'Content-Type' => $taskAttachment->mime_type,
            'Content-Disposition' => 'inline; filename="'.$taskAttachment->original_name.'"',
        ]);
    }

    /**
     * Download an attachment.
     */
    public function download(Request $request, TaskAttachment $taskAttachment): StreamedResponse
    {
        $task = $taskAttachment->task;
        Gate::authorize('view', $task->project);

        $disk = Storage::disk($taskAttachment->disk);

        if (! $disk->exists($taskAttachment->path)) {
            abort(404, 'File not found');
        }

        return $disk->download($taskAttachment->path, $taskAttachment->original_name);
    }

    /**
     * Delete an attachment.
     */
    public function destroy(Request $request, Project $project, Task $task, TaskAttachment $taskAttachment): JsonResponse
    {
        abort_if($task->project_id !== $project->id, 404);
        abort_if($taskAttachment->task_id !== $task->id, 404);
        Gate::authorize('update', [$task, $project]);

        $user = $request->user();

        // Only uploader or project owner can delete
        if ($taskAttachment->uploaded_by !== $user->id && $project->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $attachmentId = $taskAttachment->id;
        $taskAttachment->delete();

        // Broadcast to other users
        broadcast(new TaskAttachmentDeleted(
            $attachmentId,
            $task->id,
            $project->id,
            $user->id
        ))->toOthers();

        return response()->json([
            'message' => 'Attachment deleted',
            'storage_used' => $user->fresh()->storage_used,
        ]);
    }
}
