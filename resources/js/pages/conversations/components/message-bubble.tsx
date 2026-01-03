import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Message, MessageMention } from '@/types/chat';
import { format } from 'date-fns';
import {
    Check,
    CheckCheck,
    MoreVertical,
    Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { memo } from 'react';
import { AttachmentsSection } from './attachment-renderer';

function formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    return format(date, 'HH:mm');
}

/**
 * Parse message content and render mentions with highlighting
 */
function renderContentWithMentions(
    content: string,
    mentions: MessageMention[],
    isMine: boolean,
): React.ReactNode {
    if (!content || mentions.length === 0) {
        return content;
    }

    // Build a set of mention names for quick lookup
    const mentionNames = new Set(mentions.map((m) => m.name.toLowerCase()));

    // Match @mentions in content
    const mentionRegex = /@([\w\s.+-]+(?:@[\w.-]+)?)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
        // Add text before mention
        if (match.index > lastIndex) {
            parts.push(content.slice(lastIndex, match.index));
        }

        const mentionText = match[1];
        // Check if this is an actual mention (exists in mentions array)
        const isMentioned = mentionNames.has(mentionText.toLowerCase());

        if (isMentioned) {
            parts.push(
                <span
                    key={match.index}
                    className={cn(
                        'font-medium',
                        isMine
                            ? 'text-primary-foreground'
                            : 'text-blue-600 dark:text-blue-400',
                    )}
                >
                    @{mentionText}
                </span>,
            );
        } else {
            // Not a valid mention, keep as-is
            parts.push(`@${mentionText}`);
        }

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex));
    }

    return parts.length > 0 ? parts : content;
}

interface MessageBubbleProps {
    message: Message;
    showAvatar: boolean;
    onDelete?: () => void;
    canDelete?: boolean;
}

/**
 * Memoized MessageBubble component to prevent unnecessary re-renders
 * when other messages in the list change.
 */
export const MessageBubble = memo(function MessageBubble({
    message,
    showAvatar,
    onDelete,
    canDelete,
}: MessageBubbleProps) {
    const isMine = message.is_mine;

    // For own messages, use a regular div to avoid animation glitches from optimistic updates
    // When server response replaces the optimistic message, the key changes causing re-mount
    // Using motion.div would trigger animation again, causing the "flicker" effect
    const Wrapper = isMine ? 'div' : motion.div;

    // Animation props only for other people's messages
    const motionProps = isMine
        ? {}
        : {
            initial: { opacity: 0, y: 20, scale: 0.95 },
            animate: { opacity: 1, y: 0, scale: 1 },
            exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
            transition: {
                type: 'spring' as const,
                stiffness: 400,
                damping: 25,
                mass: 0.5,
            },
        };

    return (
        <Wrapper
            data-message-id={message.id}
            {...motionProps}
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
                    {canDelete && (
                        <div
                            className={cn(
                                'flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100',
                                isMine ? 'order-first' : 'order-last',
                            )}
                        >
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
                                    <DropdownMenuItem
                                        onClick={onDelete}
                                        className="text-destructive"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}

                    <div
                        className={cn(
                            'min-w-0 overflow-hidden rounded-2xl px-3 py-2',
                            isMine
                                ? 'rounded-br-md bg-primary text-primary-foreground'
                                : 'rounded-bl-md bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100',
                        )}
                    >
                        <p className="whitespace-pre-wrap break-all text-sm">
                            {renderContentWithMentions(
                                message.content,
                                message.mentions,
                                isMine,
                            )}
                        </p>

                        {/* Attachments */}
                        {message.attachments.length > 0 && (
                            <AttachmentsSection
                                attachments={message.attachments}
                                isMine={isMine}
                            />
                        )}

                        {/* Footer: Time & Status */}
                        <div
                            className={cn(
                                'mt-1 flex items-end justify-end gap-2 text-xs',
                                isMine
                                    ? 'text-primary-foreground/70'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {/* Time & Status */}
                            <div className="flex shrink-0 items-center gap-1">
                                <span>{formatMessageTime(message.created_at)}</span>
                                {/* Read status checkmarks (only for own messages) */}
                                {isMine &&
                                    (message.is_read ? (
                                        <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
                                    ) : (
                                        <Check className="h-3.5 w-3.5 opacity-70" />
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Wrapper>
    );
});
