import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { index as conversationsIndex } from '@/routes/conversations';
import type { SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, MessageSquare } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface MessageBellProps {
    className?: string;
}

interface UnreadConversation {
    id: number;
    name: string;
    color: string;
    unread_count: number;
    last_message?: {
        content: string;
        sender_name: string;
        created_at: string;
    };
}

interface MessageEventData {
    conversation_id: number;
    message: {
        id: number;
        content: string;
        sender: {
            id: number;
            name: string;
            avatar: string | null;
        };
        created_at: string;
        mentions?: Array<{
            user_id: number;
            name: string;
            email: string;
        }>;
    };
}

export function MessageBell({ className }: MessageBellProps) {
    const { auth } = usePage<SharedData>().props;
    const userId = auth?.user?.id;
    const getInitials = useInitials();

    const [unreadConversations, setUnreadConversations] = useState<
        UnreadConversation[]
    >([]);
    const [totalUnread, setTotalUnread] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const lastEventRef = useRef<number | null>(null);

    // Fetch unread conversations
    const fetchUnreadConversations = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/conversations/unread', {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (response.ok) {
                const data = await response.json();
                setUnreadConversations(data.conversations);
                setTotalUnread(data.total_unread);
            }
        } catch {
            // Silently fail
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchUnreadConversations();
    }, [fetchUnreadConversations]);

    // Handle new message from WebSocket
    const handleNewMessage = useCallback(
        (data: MessageEventData) => {
            // Prevent duplicate events
            if (lastEventRef.current === data.message.id) {
                return;
            }
            lastEventRef.current = data.message.id;

            // Don't notify for own messages
            if (data.message.sender.id === userId) {
                return;
            }

            // Skip toast if user is on conversations page (they can see messages directly)
            if (window.location.pathname.startsWith('/conversations')) {
                fetchUnreadConversations();
                return;
            }

            // Skip toast if user is mentioned (notification-listener will handle it)
            const isMentioned = data.message.mentions?.some(
                (mention) => mention.user_id === userId,
            );
            if (isMentioned) {
                // Still refetch to update counts, but don't show toast
                fetchUnreadConversations();
                return;
            }

            // Show toast notification with avatar (same style as mention)
            toast(
                <div className="flex items-center gap-3">
                    <Avatar className="size-8 shrink-0">
                        <AvatarImage
                            src={data.message.sender.avatar ?? undefined}
                            alt={data.message.sender.name}
                        />
                        <AvatarFallback className="text-xs">
                            {getInitials(data.message.sender.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <span className="font-medium">{data.message.sender.name}</span>
                        {': '}
                        <span className="text-muted-foreground">
                            {data.message.content.length > 40
                                ? `${data.message.content.substring(0, 40)}...`
                                : data.message.content}
                        </span>
                    </div>
                </div>,
                {
                    duration: 5000,
                    action: {
                        label: 'View',
                        onClick: () =>
                            router.visit(`/conversations/${data.conversation_id}`),
                    },
                },
            );

            // Refetch to update counts
            fetchUnreadConversations();
        },
        [userId, fetchUnreadConversations, getInitials],
    );

    // Subscribe to user's conversations channel for real-time updates
    const channelName = `user.${userId}.conversations`;
    useEcho<MessageEventData>(
        channelName,
        '.message.sent',
        handleNewMessage,
        [handleNewMessage],
        'private',
    );

    // Handle dropdown open
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            fetchUnreadConversations();
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <button
                    className={cn(
                        'relative w-fit cursor-pointer focus:outline-none',
                        className,
                    )}
                >
                    <Avatar className="size-9 rounded-sm">
                        <AvatarFallback className="rounded-sm bg-secondary hover:bg-secondary/80 transition-colors">
                            <Bell className="size-5" />
                        </AvatarFallback>
                    </Avatar>
                    {totalUnread > 0 && (
                        <Badge className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] tabular-nums">
                            {totalUnread > 99 ? '99+' : totalUnread}
                        </Badge>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-3 py-2">
                    <span className="font-semibold">Messages</span>
                    {totalUnread > 0 && (
                        <Badge variant="secondary">
                            {totalUnread} unread
                        </Badge>
                    )}
                </div>
                <DropdownMenuSeparator />

                {isLoading ? (
                    <div className="space-y-2 p-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-start gap-2 p-2">
                                <Skeleton className="size-8 rounded-full" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : unreadConversations.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 p-6 text-center">
                        <MessageSquare className="size-8 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                            No unread messages
                        </p>
                    </div>
                ) : (
                    <div className="max-h-80 overflow-y-auto">
                        {unreadConversations.slice(0, 10).map((conversation) => (
                            <DropdownMenuItem
                                key={conversation.id}
                                asChild
                                className="cursor-pointer"
                            >
                                <Link
                                    href={`/conversations/${conversation.id}`}
                                    className="flex items-start gap-3 p-3"
                                >
                                    <Avatar className="size-9 shrink-0">
                                        <AvatarFallback
                                            className="text-xs text-white"
                                            style={{
                                                backgroundColor:
                                                    conversation.color,
                                            }}
                                        >
                                            {getInitials(conversation.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="truncate text-sm font-medium">
                                                {conversation.name}
                                            </p>
                                            <Badge
                                                variant="default"
                                                className="h-5 shrink-0 rounded-full px-1.5 text-[10px]"
                                            >
                                                {conversation.unread_count > 9
                                                    ? '9+'
                                                    : conversation.unread_count}
                                            </Badge>
                                        </div>
                                        {conversation.last_message && (
                                            <>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    <span className="font-medium">
                                                        {
                                                            conversation
                                                                .last_message
                                                                .sender_name
                                                        }
                                                        :{' '}
                                                    </span>
                                                    {
                                                        conversation
                                                            .last_message
                                                            .content
                                                    }
                                                </p>
                                                <p className="text-[10px] text-muted-foreground/70">
                                                    {formatDistanceToNow(
                                                        new Date(
                                                            conversation
                                                                .last_message
                                                                .created_at,
                                                        ),
                                                        { addSuffix: true },
                                                    )}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link
                        href={conversationsIndex().url}
                        className="w-full cursor-pointer justify-center font-medium"
                    >
                        View all conversations
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
