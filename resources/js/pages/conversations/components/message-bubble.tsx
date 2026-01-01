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
    Paperclip,
    Reply,
    Trash2,
} from 'lucide-react';

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
    canEdit?: boolean;
    canDelete?: boolean;
}

export function MessageBubble({
    message,
    showAvatar,
    onReply,
    onEdit,
    onDelete,
    canEdit,
    canDelete,
}: MessageBubbleProps) {
    const isMine = message.is_mine;

    return (
        <div
            className={cn(
                'group flex items-end gap-2',
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
                    'flex max-w-[70%] flex-col gap-1',
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
                            'rounded-2xl px-3 py-2',
                            isMine
                                ? 'rounded-br-md bg-primary text-primary-foreground'
                                : 'rounded-bl-md bg-muted',
                        )}
                    >
                        {/* Reply reference - Telegram style (inside bubble) */}
                        {message.parent && (
                            <div
                                className={cn(
                                    'mb-2 rounded-md border-l-2 py-1 pl-2 pr-3',
                                    isMine
                                        ? 'border-white/50 bg-white/10'
                                        : 'border-primary/50 bg-primary/5',
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
                                                    ? 'text-white/90'
                                                    : 'text-primary',
                                            )}
                                        >
                                            {message.parent.sender_name}
                                        </span>
                                        <p
                                            className={cn(
                                                'truncate text-xs',
                                                isMine
                                                    ? 'text-white/70'
                                                    : 'text-foreground/70',
                                            )}
                                        >
                                            {message.parent.content}
                                        </p>
                                    </>
                                )}
                            </div>
                        )}

                        <p className="wrap-break-word whitespace-pre-wrap text-sm">
                            {message.content}
                        </p>

                        {/* Attachments */}
                        {message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {message.attachments.map((attachment) => (
                                    <a
                                        key={attachment.id}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                            'flex items-center gap-2 rounded p-2 text-xs hover:underline',
                                            isMine
                                                ? 'bg-primary-foreground/10'
                                                : 'bg-background/50',
                                        )}
                                    >
                                        <Paperclip className="h-3 w-3 shrink-0" />
                                        <span className="truncate">
                                            {attachment.original_name}
                                        </span>
                                        <span className="shrink-0 text-muted-foreground">
                                            ({attachment.human_size})
                                        </span>
                                    </a>
                                ))}
                            </div>
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
                                    <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
                                ) : (
                                    <Check className="h-3.5 w-3.5" />
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
