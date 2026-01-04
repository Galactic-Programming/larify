import { useEcho } from '@laravel/echo-react';
import { useCallback, useRef } from 'react';
import type { CommentReaction, TaskComment } from './types';

interface CommentCreatedData {
    comment: TaskComment;
}

interface CommentUpdatedData {
    comment: {
        id: number;
        task_id: number;
        content: string;
        is_edited: boolean;
        edited_at: string | null;
    };
}

interface CommentDeletedData {
    comment_id: number;
    task_id: number;
}

interface ReactionToggledData {
    comment_id: number;
    task_id: number;
    reactions: CommentReaction[];
    user_id: number;
}

interface UseTaskCommentsRealtimeOptions {
    projectId: number;
    taskId: number;
    currentUserId: number;
    onCommentCreated?: (comment: TaskComment) => void;
    onCommentUpdated?: (data: CommentUpdatedData['comment']) => void;
    onCommentDeleted?: (commentId: number) => void;
    onReactionToggled?: (
        commentId: number,
        reactions: CommentReaction[],
    ) => void;
}

/**
 * Hook to listen for real-time task comment updates via Laravel Echo/Reverb
 */
export function useTaskCommentsRealtime({
    projectId,
    taskId,
    currentUserId,
    onCommentCreated,
    onCommentUpdated,
    onCommentDeleted,
    onReactionToggled,
}: UseTaskCommentsRealtimeOptions) {
    const channelName = `project.${projectId}.task.${taskId}.comments`;
    const lastCreatedEventRef = useRef<string | null>(null);
    const lastUpdatedEventRef = useRef<string | null>(null);

    // Handle comment created
    const handleCommentCreated = useCallback(
        (data: CommentCreatedData) => {
            // Prevent duplicate events (debounce)
            const eventKey = `${data.comment.id}-${data.comment.created_at}`;
            if (lastCreatedEventRef.current === eventKey) {
                return;
            }
            lastCreatedEventRef.current = eventKey;

            // Don't add own comments (already added optimistically)
            if (data.comment.user?.id === currentUserId) {
                return;
            }

            onCommentCreated?.(data.comment);
        },
        [currentUserId, onCommentCreated],
    );

    // Handle comment updated
    const handleCommentUpdated = useCallback(
        (data: CommentUpdatedData) => {
            // Prevent duplicate events
            const eventKey = `${data.comment.id}-${data.comment.content}-${data.comment.edited_at}`;
            if (lastUpdatedEventRef.current === eventKey) {
                return;
            }
            lastUpdatedEventRef.current = eventKey;

            onCommentUpdated?.(data.comment);
        },
        [onCommentUpdated],
    );

    // Handle comment deleted
    const handleCommentDeleted = useCallback(
        (data: CommentDeletedData) => {
            onCommentDeleted?.(data.comment_id);
        },
        [onCommentDeleted],
    );

    // Handle reaction toggled
    const handleReactionToggled = useCallback(
        (data: ReactionToggledData) => {
            // Don't update own reactions (already updated optimistically)
            if (data.user_id === currentUserId) {
                return;
            }

            onReactionToggled?.(data.comment_id, data.reactions);
        },
        [currentUserId, onReactionToggled],
    );

    // Listen for comment created events
    useEcho(
        channelName,
        '.TaskCommentCreated',
        handleCommentCreated,
        [handleCommentCreated],
        'private',
    );

    // Listen for comment updated events
    useEcho(
        channelName,
        '.TaskCommentUpdated',
        handleCommentUpdated,
        [handleCommentUpdated],
        'private',
    );

    // Listen for comment deleted events
    useEcho(
        channelName,
        '.TaskCommentDeleted',
        handleCommentDeleted,
        [handleCommentDeleted],
        'private',
    );

    // Listen for reaction toggled events
    useEcho(
        channelName,
        '.TaskCommentReactionToggled',
        handleReactionToggled,
        [handleReactionToggled],
        'private',
    );
}
