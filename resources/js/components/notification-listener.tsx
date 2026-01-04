import { type SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { AtSign } from 'lucide-react';
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

    const handleMentionNotification = useCallback(
        (event: MentionNotificationEvent) => {
            // Show toast notification with custom styling
            toast.custom(
                (t) => (
                    <div
                        className="flex w-full max-w-md cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 shadow-lg transition-all hover:bg-accent/50"
                        onClick={() => {
                            toast.dismiss(t);
                            router.visit(event.data.url);
                        }}
                    >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                            <AtSign className="size-5 text-violet-500" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">
                                {event.data.sender_name} mentioned you
                            </p>
                            <p className="text-xs text-muted-foreground">
                                in {event.data.conversation_name}
                            </p>
                            {event.data.content_preview && (
                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                    "{event.data.content_preview}"
                                </p>
                            )}
                        </div>
                    </div>
                ),
                {
                    duration: 5000,
                    position: 'top-right',
                },
            );
        },
        [],
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
