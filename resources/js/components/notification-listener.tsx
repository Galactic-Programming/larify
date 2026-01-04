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

export function NotificationListener() {
    const { auth } = usePage<SharedData>().props;
    const getInitials = useInitials();

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
    const channelName = userId ? `App.Models.User.${userId}` : '';

    useEcho(
        channelName,
        '.mention.notification',
        handleMentionNotification,
        [],
        'private',
    );

    // Don't render anything if no user
    if (!userId) {
        return null;
    }

    return null;
}
