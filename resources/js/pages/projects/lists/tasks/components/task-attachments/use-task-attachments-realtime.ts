import { useEcho } from '@laravel/echo-react';
import { useCallback, useRef } from 'react';
import type { TaskAttachment } from './types';

interface AttachmentUploadedData {
    attachment: TaskAttachment;
    task_id: number;
    uploader_id: number;
}

interface AttachmentDeletedData {
    attachment_id: number;
    task_id: number;
    deleter_id: number;
}

interface UseTaskAttachmentsRealtimeOptions {
    projectId: number;
    taskId: number;
    currentUserId: number;
    onAttachmentUploaded?: (attachment: TaskAttachment) => void;
    onAttachmentDeleted?: (attachmentId: number) => void;
}

/**
 * Hook to listen for real-time task attachment updates via Laravel Echo/Reverb
 */
export function useTaskAttachmentsRealtime({
    projectId,
    taskId,
    currentUserId,
    onAttachmentUploaded,
    onAttachmentDeleted,
}: UseTaskAttachmentsRealtimeOptions) {
    const channelName = `project.${projectId}.task.${taskId}.attachments`;
    const lastUploadedEventRef = useRef<string | null>(null);

    // Handle attachment uploaded
    const handleAttachmentUploaded = useCallback(
        (data: AttachmentUploadedData) => {
            // Prevent duplicate events
            const eventKey = `${data.attachment.id}-${data.attachment.created_at}`;
            if (lastUploadedEventRef.current === eventKey) {
                return;
            }
            lastUploadedEventRef.current = eventKey;

            // Don't add own uploads (already added locally)
            if (data.uploader_id === currentUserId) {
                return;
            }

            onAttachmentUploaded?.(data.attachment);
        },
        [currentUserId, onAttachmentUploaded],
    );

    // Handle attachment deleted
    const handleAttachmentDeleted = useCallback(
        (data: AttachmentDeletedData) => {
            // Don't process own deletions (already removed locally)
            if (data.deleter_id === currentUserId) {
                return;
            }

            onAttachmentDeleted?.(data.attachment_id);
        },
        [currentUserId, onAttachmentDeleted],
    );

    // Listen for attachment uploaded events
    useEcho(
        channelName,
        '.TaskAttachmentUploaded',
        handleAttachmentUploaded,
        [handleAttachmentUploaded],
        'private',
    );

    // Listen for attachment deleted events
    useEcho(
        channelName,
        '.TaskAttachmentDeleted',
        handleAttachmentDeleted,
        [handleAttachmentDeleted],
        'private',
    );
}
