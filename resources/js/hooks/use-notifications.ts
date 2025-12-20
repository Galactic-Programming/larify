import type { SharedData } from '@/types';
import type {
    Notification,
    NotificationEventData,
} from '@/types/notifications.d';
import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseNotificationRealtimeOptions {
    onNotificationReceived?: (notification: Notification) => void;
    autoRefresh?: boolean;
}

/**
 * Hook to listen for real-time notifications via Laravel Echo/Reverb
 * Listens on the user's private notifications channel
 */
export function useNotificationRealtime({
    onNotificationReceived,
    autoRefresh = false,
}: UseNotificationRealtimeOptions = {}) {
    const { auth } = usePage<SharedData>().props;
    const userId = auth?.user?.id;
    const channelName = `App.Models.User.${userId}`;
    const lastEventRef = useRef<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // Handle new notification
    const handleNotification = useCallback(
        (data: NotificationEventData) => {
            // Prevent duplicate events
            const eventKey = data.notification.id;
            if (lastEventRef.current === eventKey) {
                return;
            }
            lastEventRef.current = eventKey;

            // Update unread count
            setUnreadCount(data.unread_count);

            // Call custom handler if provided
            onNotificationReceived?.(data.notification);

            // Auto-refresh page data if enabled
            if (autoRefresh) {
                router.reload({
                    only: ['notifications', 'unreadCount'],
                });
            }
        },
        [onNotificationReceived, autoRefresh],
    );

    // Subscribe to private user notifications channel
    const { channel, leaveChannel } = useEcho<NotificationEventData>(
        channelName,
        '.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated',
        handleNotification,
        [handleNotification],
        'private',
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            lastEventRef.current = null;
        };
    }, []);

    return {
        channel,
        leaveChannel,
        channelName,
        isConnected: !!channel,
        unreadCount,
        setUnreadCount,
    };
}

/**
 * Hook to fetch and manage unread notification count
 * Uses polling as fallback when WebSocket is not available
 */
export function useUnreadCount(
    initialCount: number = 0,
    pollingInterval: number = 30000,
) {
    const [count, setCount] = useState(initialCount);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCount = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/notifications/unread-count', {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (response.ok) {
                const data = await response.json();
                setCount(data.count);
            }
        } catch {
            // Silently fail - will retry on next poll
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Poll for updates
    useEffect(() => {
        const interval = setInterval(fetchCount, pollingInterval);
        return () => clearInterval(interval);
    }, [fetchCount, pollingInterval]);

    // Initial fetch
    useEffect(() => {
        fetchCount();
    }, [fetchCount]);

    return { count, setCount, isLoading, refetch: fetchCount };
}
