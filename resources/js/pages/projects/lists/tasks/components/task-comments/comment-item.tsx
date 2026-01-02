import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Smile } from 'lucide-react';
import { useState } from 'react';
import type { CommentPermissions, TaskComment } from './types';

interface CommentItemProps {
    comment: TaskComment;
    permissions: CommentPermissions;
    onEdit?: (comment: TaskComment) => void;
    onDelete?: (comment: TaskComment) => void;
    onToggleReaction?: (commentId: number, emoji: string) => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😄', '🎉', '🚀', '👀'];

export function CommentItem({
    comment,
    permissions,
    onEdit,
    onDelete,
    onToggleReaction,
}: CommentItemProps) {
    const [showReactionPicker, setShowReactionPicker] = useState(false);

    return (
        <div className="group">
            {/* Author info */}
            <div className="flex items-center gap-2">
                <Avatar className="size-8 border">
                    <AvatarImage src={comment.user.avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                        {comment.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold">{comment.user.name}</span>
                <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(parseISO(comment.created_at), {
                        addSuffix: false,
                    })}
                </span>
                {comment.is_edited && (
                    <span className="text-xs text-muted-foreground">(edited)</span>
                )}
            </div>

            {/* Content */}
            <div className="ml-10 mt-2 rounded-lg bg-muted/50 px-3 py-2">
                <p className="whitespace-pre-wrap wrap-break-word text-sm">{comment.content}</p>
            </div>

            {/* Reactions display */}
            {comment.reactions.length > 0 && (
                <div className="ml-10 mt-2 flex flex-wrap gap-1">
                    {comment.reactions.map((reaction) => (
                        <button
                            key={reaction.emoji}
                            onClick={() =>
                                permissions.can_use_reactions &&
                                onToggleReaction?.(comment.id, reaction.emoji)
                            }
                            disabled={!permissions.can_use_reactions}
                            className={cn(
                                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
                                reaction.reacted_by_me
                                    ? 'border-primary/50 bg-primary/10'
                                    : 'border-border bg-background hover:bg-muted',
                                !permissions.can_use_reactions &&
                                    'cursor-not-allowed opacity-50',
                            )}
                        >
                            <span>{reaction.emoji}</span>
                            <span className="font-medium">{reaction.count}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Actions - Trello style inline links */}
            <div className="ml-10 mt-1.5 flex items-center gap-1 text-xs">
                {/* Add reaction */}
                {permissions.can_use_reactions && (
                    <DropdownMenu
                        open={showReactionPicker}
                        onOpenChange={setShowReactionPicker}
                    >
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline">
                                <Smile className="size-3.5" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="flex gap-1 p-2">
                            {QUICK_REACTIONS.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => {
                                        onToggleReaction?.(comment.id, emoji);
                                        setShowReactionPicker(false);
                                    }}
                                    className="rounded p-1.5 text-lg transition-colors hover:bg-muted"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {/* Edit link */}
                {comment.can_edit && (
                    <>
                        <span className="text-muted-foreground">•</span>
                        <button
                            onClick={() => onEdit?.(comment)}
                            className="text-muted-foreground hover:text-foreground hover:underline"
                        >
                            Edit
                        </button>
                    </>
                )}

                {/* Delete link */}
                {comment.can_delete && (
                    <>
                        <span className="text-muted-foreground">•</span>
                        <button
                            onClick={() => onDelete?.(comment)}
                            className="text-muted-foreground hover:text-destructive hover:underline"
                        >
                            Delete
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
