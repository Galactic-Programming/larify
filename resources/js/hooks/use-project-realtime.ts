import type { SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { useCallback, useEffect, useRef } from 'react';

interface ProjectEventData {
    project: {
        id: number;
        user_id: number;
        name: string;
        description: string | null;
        color: string;
        icon: string | null;
        is_archived: boolean;
        lists_count: number;
        tasks_count: number;
        members_count: number;
        created_at: string;
        updated_at: string;
    };
    action: 'created' | 'updated' | 'deleted' | 'archived';
}

interface UseProjectRealtimeOptions {
    onProjectUpdate?: (data: ProjectEventData) => void;
    onProjectDeleted?: (projectId: number) => void;
    autoRefresh?: boolean;
}

/**
 * Hook to listen for real-time project updates via Laravel Echo/Reverb
 * Listens on the user's private projects channel
 */
export function useProjectRealtime({
    onProjectUpdate,
    onProjectDeleted,
    autoRefresh = true,
}: UseProjectRealtimeOptions = {}) {
    const { auth } = usePage<SharedData>().props;
    const userId = auth?.user?.id;
    const channelName = `user.${userId}.projects`;
    const lastEventRef = useRef<string | null>(null);

    // Handle project updates
    const handleProjectUpdate = useCallback(
        (data: ProjectEventData) => {
            // Prevent duplicate events (debounce)
            const eventKey = `${data.project.id}-${data.action}-${data.project.updated_at}`;
            if (lastEventRef.current === eventKey) {
                return;
            }
            lastEventRef.current = eventKey;

            // Call custom handler if provided
            onProjectUpdate?.(data);

            // Notify if project was deleted
            if (data.action === 'deleted') {
                onProjectDeleted?.(data.project.id);
            }

            // Auto-refresh page data using Inertia
            if (autoRefresh) {
                router.reload({
                    only: ['projects'],
                });
            }
        },
        [onProjectUpdate, onProjectDeleted, autoRefresh],
    );

    // Subscribe to private user projects channel
    const { channel, leaveChannel } = useEcho<ProjectEventData>(
        channelName,
        '.project.updated', // Event name (note the leading dot for broadcastAs)
        handleProjectUpdate,
        [handleProjectUpdate],
        'private', // Channel visibility
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
    };
}
