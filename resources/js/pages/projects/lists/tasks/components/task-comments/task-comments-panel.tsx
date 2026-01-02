import { toast } from 'sonner';
import { useCallback, useEffect, useState } from 'react';
import { CommentInput } from './comment-input';
import { CommentList } from './comment-list';
import { DeleteCommentDialog } from './delete-comment-dialog';
import type { CommentPermissions, CommentsResponse, TaskComment } from './types';

interface TaskCommentsPanelProps {
    projectId: number;
    taskId: number;
}

export function TaskCommentsPanel({ projectId, taskId }: TaskCommentsPanelProps) {
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [permissions, setPermissions] = useState<CommentPermissions>({
        can_create: false,
        can_use_reactions: false,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const [editingComment, setEditingComment] = useState<TaskComment | null>(null);
    const [deletingComment, setDeletingComment] = useState<TaskComment | null>(null);

    // Fetch comments
    const fetchComments = useCallback(
        async (cursor?: number) => {
            try {
                const params = new URLSearchParams();
                if (cursor) params.append('cursor', cursor.toString());

                const response = await fetch(
                    `/api/projects/${projectId}/tasks/${taskId}/comments?${params}`,
                );
                if (!response.ok) throw new Error('Failed to fetch comments');

                const data: CommentsResponse = await response.json();

                if (cursor) {
                    // Prepend older comments
                    setComments((prev) => [...data.comments, ...prev]);
                } else {
                    setComments(data.comments);
                }

                setPermissions(data.permissions);
                setHasMore(data.has_more);
                setNextCursor(data.next_cursor);
            } catch {
                toast.error('Failed to load comments');
            } finally {
                setIsLoading(false);
            }
        },
        [projectId, taskId],
    );

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    // Create/Edit comment
    const handleSubmitComment = async (content: string) => {
        const url = editingComment
            ? `/projects/${projectId}/tasks/${taskId}/comments/${editingComment.id}`
            : `/projects/${projectId}/tasks/${taskId}/comments`;

        const method = editingComment ? 'PATCH' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN':
                    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                        ?.content || '',
                Accept: 'application/json',
            },
            body: JSON.stringify({ content }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save comment');
        }

        const data = await response.json();

        if (editingComment) {
            // Update existing comment
            setComments((prev) =>
                prev.map((c) => (c.id === editingComment.id ? data.comment : c)),
            );
            setEditingComment(null);
            toast.success('Comment updated');
        } else {
            // Add new comment
            setComments((prev) => [...prev, data.comment]);
            toast.success('Comment added');
        }
    };

    // Delete comment
    const handleDeleteComment = async () => {
        if (!deletingComment) return;

        const response = await fetch(
            `/projects/${projectId}/tasks/${taskId}/comments/${deletingComment.id}`,
            {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                            ?.content || '',
                    Accept: 'application/json',
                },
            },
        );

        if (!response.ok) {
            throw new Error('Failed to delete comment');
        }

        setComments((prev) => prev.filter((c) => c.id !== deletingComment.id));
        setDeletingComment(null);
        toast.success('Comment deleted');
    };

    // Toggle reaction
    const handleToggleReaction = async (commentId: number, emoji: string) => {
        try {
            const response = await fetch(
                `/projects/${projectId}/tasks/${taskId}/comments/${commentId}/reactions`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                                ?.content || '',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({ emoji }),
                },
            );

            if (!response.ok) throw new Error('Failed to toggle reaction');

            const data = await response.json();

            // Update comment reactions
            setComments((prev) =>
                prev.map((c) =>
                    c.id === commentId ? { ...c, reactions: data.reactions } : c,
                ),
            );
        } catch {
            toast.error('Failed to update reaction');
        }
    };

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="border-b bg-muted/30 px-4 py-3">
                <h3 className="text-sm font-semibold">
                    Comments
                    {comments.length > 0 && (
                        <span className="ml-2 text-muted-foreground">({comments.length})</span>
                    )}
                </h3>
            </div>

            {/* Input at top - Trello style */}
            <CommentInput
                permissions={permissions}
                editingComment={editingComment}
                onSubmit={handleSubmitComment}
                onCancelEdit={() => setEditingComment(null)}
            />

            {/* Comments list */}
            <CommentList
                comments={comments}
                permissions={permissions}
                isLoading={isLoading}
                hasMore={hasMore}
                onLoadMore={() => nextCursor && fetchComments(nextCursor)}
                onEdit={setEditingComment}
                onDelete={setDeletingComment}
                onToggleReaction={handleToggleReaction}
            />

            {/* Delete dialog */}
            <DeleteCommentDialog
                open={!!deletingComment}
                onOpenChange={(open) => !open && setDeletingComment(null)}
                onConfirm={handleDeleteComment}
            />
        </div>
    );
}
