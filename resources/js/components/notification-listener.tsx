import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { useCallback } from 'react';
import { toast } from 'sonner';

interface MentionNotificationEvent {
    id: string;
    type: string;
    data: {
        message_id: number;
        conversation_id: number;
        conversation_name: string;
        sender_id: number;
        sender_name: string;
        sender_avatar?: string;
        content_preview: string;
        url: string;
        message: string;
    };
    read_at: string | null;
    is_read: boolean;
    created_at: string;
    created_at_human: string;
}

interface MessageSentEvent {
    conversation_id: number;
    conversation_name: string;
    message: {
        id: number;
        conversation_id: number;
        content: string;
        sender: {
            id: number;
            name: string;
            avatar?: string;
        };
        mentions: Array<{ user_id: number; name: string; email: string }>;
    };
}

export function NotificationListener() {
    const { auth } = usePage<SharedData>().props;
    const getInitials = useInitials();

    const handleMessageSent = useCallback(
        (event: MessageSentEvent) => {
            // Skip if user is on conversations page (they can see messages directly)
            if (window.location.pathname.startsWith('/conversations')) {
                return;
            }

            // Skip if this message has mentions for current user (will be handled by mention notification)
            const hasMentionForMe = event.message.mentions.some(
                (m) => m.user_id === auth?.user?.id,
            );
            if (hasMentionForMe) {
                return;
            }

            // Show toast notification
            toast(
                <div className="flex items-center gap-3">
                    <Avatar className="size-8 shrink-0">
                        <AvatarImage
                            src={event.message.sender.avatar}
                            alt={event.message.sender.name}
                        />
                        <AvatarFallback className="text-xs">
                            {getInitials(event.message.sender.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                            {event.message.sender.name}
                        </div>
                        <div className="text-muted-foreground text-sm truncate">
                            {event.conversation_name}
                        </div>
                    </div>
                </div>,
                {
                    duration: 4000,
                    action: {
                        label: 'View',
                        onClick: () =>
                            router.visit(`/conversations/${event.conversation_id}`),
                    },
                },
            );
        },
        [auth?.user?.id, getInitials],
    );

    const handleMentionNotification = useCallback(
        (event: MentionNotificationEvent) => {
            // Skip toast if user is on conversations page (they can see messages directly)
            if (window.location.pathname.startsWith('/conversations')) {
                return;
            }

            // Show toast notification with avatar
            toast(
                <div className="flex items-center gap-3">
                    <Avatar className="size-8 shrink-0">
                        <AvatarImage
                            src={event.data.sender_avatar}
                            alt={event.data.sender_name}
                        />
                        <AvatarFallback className="text-xs">
                            {getInitials(event.data.sender_name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <span className="font-medium">{event.data.sender_name}</span>
                        {' mentioned you in '}
                        <span className="font-medium">{event.data.conversation_name}</span>
                    </div>
                </div>,
                {
                    duration: 5000,
                    action: {
                        label: 'View',
                        onClick: () => router.visit(event.data.url),
                    },
                },
            );
        },
        [getInitials],
    );

    // Only subscribe if user is authenticated
    const userId = auth?.user?.id;
    const mentionChannelName = userId ? `App.Models.User.${userId}` : '';
    const messageChannelName = userId ? `user.${userId}.conversations` : '';

    // Listen for mention notifications
    useEcho(
        mentionChannelName,
        '.mention.notification',
        handleMentionNotification,
        [],
        'private',
    );

    // Listen for new messages (for popup notifications)
    useEcho(
        messageChannelName,
        '.message.sent',
        handleMessageSent,
        [],
        'private',
    );

    // Don't render anything if no user
    if (!userId) {
        return null;
    }

    return null;
}
