import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle } from 'lucide-react';
import { CommentItem } from './comment-item';
import type { CommentPermissions, TaskComment } from './types';

interface CommentListProps {
    comments: TaskComment[];
    permissions: CommentPermissions;
    isLoading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    onEdit?: (comment: TaskComment) => void;
    onDelete?: (comment: TaskComment) => void;
    onReply?: (comment: TaskComment) => void;
    onToggleReaction?: (commentId: number, emoji: string) => void;
}

export function CommentList({
    comments,
    permissions,
    isLoading = false,
    hasMore = false,
    onLoadMore,
    onEdit,
    onDelete,
    onReply,
    onToggleReaction,
}: CommentListProps) {
    if (isLoading && comments.length === 0) {
        return <CommentListSkeleton />;
    }

    if (comments.length === 0) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="rounded-full bg-muted/50 p-4">
                    <MessageCircle className="size-8 text-muted-foreground" />
                </div>
                <h4 className="mt-4 text-sm font-medium">No comments yet</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                    {permissions.can_create
                        ? 'Be the first to add a comment'
                        : 'Upgrade to Pro to add comments'}
                </p>
            </div>
        );
    }

    return (
        <ScrollArea className="flex-1">
            <div className="space-y-4 p-4">
                {hasMore && (
                    <button
                        onClick={onLoadMore}
                        className="w-full text-center text-xs font-medium text-primary hover:underline"
                    >
                        Load earlier comments
                    </button>
                )}

                {comments.map((comment) => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        permissions={permissions}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onReply={onReply}
                        onToggleReaction={onToggleReaction}
                    />
                ))}

                {isLoading && <CommentItemSkeleton />}
            </div>
        </ScrollArea>
    );
}

function CommentListSkeleton() {
    return (
        <div className="space-y-4 p-4">
            {[1, 2, 3].map((i) => (
                <CommentItemSkeleton key={i} />
            ))}
        </div>
    );
}

function CommentItemSkeleton() {
    return (
        <div className="flex gap-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        </div>
    );
}
