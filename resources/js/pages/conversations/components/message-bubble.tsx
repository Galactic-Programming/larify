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
import type { Message } from '@/types/chat';
import { format } from 'date-fns';
import {
    Check,
    CheckCheck,
    Edit2,
    MoreVertical,
    Reply,
    Trash2,
} from 'lucide-react';
import { memo } from 'react';
import { AttachmentsSection } from './attachment-renderer';
import { MessageReactions, ReactionPicker } from './message-reactions';

function formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    return format(date, 'HH:mm');
}

interface MessageBubbleProps {
    message: Message;
    showAvatar: boolean;
    onReply?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onReaction?: (emoji: string) => void;
    canEdit?: boolean;
    canDelete?: boolean;
}

/**
 * Memoized MessageBubble component to prevent unnecessary re-renders
 * when other messages in the list change.
 */
export const MessageBubble = memo(function MessageBubble({
    message,
    showAvatar,
    onReply,
    onEdit,
    onDelete,
    onReaction,
    canEdit,
    canDelete,
}: MessageBubbleProps) {
    const isMine = message.is_mine;

    return (
        <div
            data-message-id={message.id}
            className={cn(
                'group flex items-end gap-2 transition-colors duration-500',
                isMine && 'flex-row-reverse',
            )}
        >
            {/* Avatar */}
            {!isMine && showAvatar ? (
                <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage
                        src={message.sender?.avatar}
                        alt={message.sender?.name ?? 'User'}
                    />
                    <AvatarFallback className="text-xs">
                        {message.sender?.name?.charAt(0).toUpperCase() ?? 'U'}
                    </AvatarFallback>
                </Avatar>
            ) : !isMine ? (
                <div className="w-8" />
            ) : null}

            {/* Message Content */}
            <div
                className={cn(
                    'flex max-w-[70%] min-w-0 flex-col gap-1',
                    isMine && 'items-end',
                )}
            >
                {/* Sender name */}
                {!isMine && showAvatar && message.sender && (
                    <span className="text-xs text-muted-foreground">
                        {message.sender.name}
                    </span>
                )}

                {/* Bubble */}
                <div className="relative flex items-center gap-1">
                    {/* Actions (visible on hover) */}
                    <div
                        className={cn(
                            'flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100',
                            isMine ? 'order-first' : 'order-last',
                        )}
                    >
                        <TooltipProvider>
                            {onReaction && (
                                <ReactionPicker onSelect={onReaction} />
                            )}

                            {onReply && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={onReply}
                                        >
                                            <Reply className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Reply</TooltipContent>
                                </Tooltip>
                            )}

                            {(canEdit || canDelete) && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                        >
                                            <MoreVertical className="h-3.5 w-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align={isMine ? 'end' : 'start'}
                                    >
                                        {canEdit && (
                                            <DropdownMenuItem onClick={onEdit}>
                                                <Edit2 className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                        )}
                                        {canDelete && (
                                            <DropdownMenuItem
                                                onClick={onDelete}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </TooltipProvider>
                    </div>

                    <div
                        className={cn(
                            'min-w-0 overflow-hidden rounded-2xl px-3 py-2',
                            isMine
                                ? 'rounded-br-md bg-primary text-primary-foreground'
                                : 'rounded-bl-md bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100',
                        )}
                    >
                        {/* Reply reference - Telegram style (inside bubble) */}
                        {message.parent && (
                            <div
                                className={cn(
                                    'mb-2 rounded-md border-l-2 py-1 pl-2 pr-3',
                                    isMine
                                        ? 'border-white/70 bg-black/20'
                                        : 'border-primary bg-primary/10 dark:border-primary/70 dark:bg-primary/20',
                                )}
                            >
                                {message.parent.is_deleted ? (
                                    <p className="text-xs italic opacity-70">
                                        Deleted message
                                    </p>
                                ) : (
                                    <>
                                        <span
                                            className={cn(
                                                'text-xs font-semibold',
                                                isMine
                                                    ? 'text-white'
                                                    : 'text-primary dark:text-primary',
                                            )}
                                        >
                                            {message.parent.sender_name}
                                        </span>
                                        <p
                                            className={cn(
                                                'truncate text-xs',
                                                isMine
                                                    ? 'text-white/80'
                                                    : 'text-slate-600 dark:text-slate-300',
                                            )}
                                        >
                                            {message.parent.content}
                                        </p>
                                    </>
                                )}
                            </div>
                        )}

                        <p className="whitespace-pre-wrap break-all text-sm">
                            {message.content}
                        </p>

                        {/* Attachments */}
                        {message.attachments.length > 0 && (
                            <AttachmentsSection
                                attachments={message.attachments}
                                isMine={isMine}
                            />
                        )}

                        {/* Time & Status */}
                        <div
                            className={cn(
                                'mt-1 flex items-center gap-1 text-xs',
                                isMine
                                    ? 'text-primary-foreground/70'
                                    : 'text-muted-foreground',
                            )}
                        >
                            <span>{formatMessageTime(message.created_at)}</span>
                            {message.is_edited && <span>(edited)</span>}
                            {/* Read status checkmarks (only for own messages) */}
                            {isMine &&
                                (message.is_read ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                                ) : (
                                    <Check className="h-3.5 w-3.5 text-slate-400 dark:text-slate-300" />
                                ))}
                        </div>
                    </div>
                </div>

                {/* Reactions */}
                {onReaction && message.reactions && (
                    <MessageReactions
                        reactions={message.reactions}
                        onToggle={onReaction}
                        isMine={isMine}
                    />
                )}
            </div>
        </div>
    );
});
