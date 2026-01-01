<?php

namespace App\Http\Controllers\Attachments;

use App\Http\Controllers\Controller;
use App\Models\MessageAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttachmentController extends Controller
{
    /**
     * Show/download an attachment with authorization check.
     * Only conversation participants can access the attachment.
     */
    public function show(Request $request, MessageAttachment $attachment): StreamedResponse
    {
        // Check if user can view the message this attachment belongs to
        $message = $attachment->message;
        $conversation = $message->conversation;

        Gate::authorize('view', $conversation);

        $disk = Storage::disk($attachment->disk);

        // Check if file exists
        if (! $disk->exists($attachment->path)) {
            abort(404, 'File not found');
        }

        // Stream the file with proper headers
        return $disk->response($attachment->path, $attachment->original_name, [
            'Content-Type' => $attachment->mime_type,
            'Content-Disposition' => 'inline; filename="'.$attachment->original_name.'"',
        ]);
    }

    /**
     * Download an attachment with authorization check.
     */
    public function download(Request $request, MessageAttachment $attachment): StreamedResponse
    {
        // Check if user can view the message this attachment belongs to
        $message = $attachment->message;
        $conversation = $message->conversation;

        Gate::authorize('view', $conversation);

        $disk = Storage::disk($attachment->disk);

        // Check if file exists
        if (! $disk->exists($attachment->path)) {
            abort(404, 'File not found');
        }

        // Force download with original filename
        return $disk->download($attachment->path, $attachment->original_name);
    }
}
