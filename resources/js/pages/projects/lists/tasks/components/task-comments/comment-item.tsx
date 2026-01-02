import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { MessageCircle, MoreHorizontal, Pencil, Smile, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { CommentPermissions, TaskComment } from './types';

interface CommentItemProps {
    comment: TaskComment;
    permissions: CommentPermissions;
    onEdit?: (comment: TaskComment) => void;
    onDelete?: (comment: TaskComment) => void;
    onReply?: (comment: TaskComment) => void;
    onToggleReaction?: (commentId: number, emoji: string) => void;
    isReply?: boolean;
}

const QUICK_REACTIONS = ['👍', '❤️', '😄', '🎉', '🚀', '👀'];

export function CommentItem({
    comment,
    permissions,
    onEdit,
    onDelete,
    onReply,
    onToggleReaction,
    isReply = false,
}: CommentItemProps) {
    const [showReactionPicker, setShowReactionPicker] = useState(false);

    return (
        <div className={cn('group flex gap-3', isReply && 'ml-10')}>
            <Avatar className="size-8 shrink-0 border">
                <AvatarImage src={comment.user.avatar || undefined} />
                <AvatarFallback className="text-xs font-medium">
                    {comment.user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
                {/* Header */}
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{comment.user.name}</span>
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(parseISO(comment.created_at), {
                            addSuffix: true,
                        })}
                    </span>
                    {comment.is_edited && (
                        <span className="text-xs text-muted-foreground">(edited)</span>
                    )}
                </div>

                {/* Reply indicator */}
                {comment.parent && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                        Replying to{' '}
                        <span className="font-medium">{comment.parent.user.name}</span>
                    </div>
                )}

                {/* Content */}
                <div className="mt-1 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word text-foreground/90">
                    {comment.content}
                </div>

                {/* Reactions display */}
                {comment.reactions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
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
                                        : 'border-border bg-muted/50 hover:bg-muted',
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

                {/* Actions */}
                <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {/* Add reaction */}
                    {permissions.can_use_reactions && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenu
                                        open={showReactionPicker}
                                        onOpenChange={setShowReactionPicker}
                                    >
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                            >
                                                <Smile className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="start"
                                            className="flex gap-1 p-2"
                                        >
                                            {QUICK_REACTIONS.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => {
                                                        onToggleReaction?.(
                                                            comment.id,
                                                            emoji,
                                                        );
                                                        setShowReactionPicker(false);
                                                    }}
                                                    className="rounded p-1.5 text-lg transition-colors hover:bg-muted"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TooltipTrigger>
                                <TooltipContent>Add reaction</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {/* Reply */}
                    {permissions.can_create && !isReply && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => onReply?.(comment)}
                                    >
                                        <MessageCircle className="size-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reply</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {/* Edit/Delete menu */}
                    {(comment.can_edit || comment.can_delete) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                {comment.can_edit && (
                                    <DropdownMenuItem onClick={() => onEdit?.(comment)}>
                                        <Pencil className="mr-2 size-4" />
                                        Edit
                                    </DropdownMenuItem>
                                )}
                                {comment.can_delete && (
                                    <DropdownMenuItem
                                        onClick={() => onDelete?.(comment)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="mr-2 size-4" />
                                        Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Replies count */}
                {comment.replies_count > 0 && !isReply && (
                    <button className="mt-2 text-xs font-medium text-primary hover:underline">
                        {comment.replies_count} repl{comment.replies_count === 1 ? 'y' : 'ies'}
                    </button>
                )}
            </div>
        </div>
    );
}
