import { router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { useCallback, useEffect, useRef } from 'react';

interface TaskEventData {
    task: {
        id: number;
        list_id: number;
        title: string;
        description: string | null;
        priority: string;
        due_date: string;
        due_time: string;
        completed_at: string | null;
        assigned_to: number | null;
        assignee: {
            id: number;
            name: string;
            email: string;
            avatar: string | null;
        } | null;
        position: number;
        created_at: string;
        updated_at: string;
    };
    action: 'created' | 'updated' | 'deleted' | 'moved' | 'completed';
}

interface ListEventData {
    list: {
        id: number;
        project_id: number;
        name: string;
        position: number;
        is_done_list: boolean;
        created_at: string;
        updated_at: string;
    };
    action: 'created' | 'updated' | 'deleted' | 'reordered';
}

interface UseTaskRealtimeOptions {
    projectId: number;
    onTaskUpdate?: (data: TaskEventData) => void;
    onListUpdate?: (data: ListEventData) => void;
    onTaskDeleted?: (taskId: number) => void;
    autoRefresh?: boolean;
}

/**
 * Hook to listen for real-time task and list updates via Laravel Echo/Reverb
 */
export function useTaskRealtime({
    projectId,
    onTaskUpdate,
    onListUpdate,
    onTaskDeleted,
    autoRefresh = true,
}: UseTaskRealtimeOptions) {
    const channelName = `project.${projectId}`;
    const lastTaskEventRef = useRef<string | null>(null);
    const lastListEventRef = useRef<string | null>(null);

    // Handle task updates
    const handleTaskUpdate = useCallback(
        (data: TaskEventData) => {
            // Prevent duplicate events (debounce)
            const eventKey = `${data.task.id}-${data.action}-${data.task.updated_at}`;
            if (lastTaskEventRef.current === eventKey) {
                return;
            }
            lastTaskEventRef.current = eventKey;

            // Call custom handler if provided
            onTaskUpdate?.(data);

            // Notify if task was deleted (for closing detail sheets, etc.)
            if (data.action === 'deleted') {
                onTaskDeleted?.(data.task.id);
            }

            // Auto-refresh page data using Inertia
            if (autoRefresh) {
                router.reload({
                    only: ['project'],
                });
            }
        },
        [onTaskUpdate, onTaskDeleted, autoRefresh],
    );

    // Handle list updates
    const handleListUpdate = useCallback(
        (data: ListEventData) => {
            // Prevent duplicate events (debounce)
            const eventKey = `${data.list.id}-${data.action}-${data.list.updated_at}`;
            if (lastListEventRef.current === eventKey) {
                return;
            }
            lastListEventRef.current = eventKey;

            // Call custom handler if provided
            onListUpdate?.(data);

            // Auto-refresh page data using Inertia
            if (autoRefresh) {
                router.reload({
                    only: ['project'],
                });
            }
        },
        [onListUpdate, autoRefresh],
    );

    // Subscribe to private project channel and listen for task.updated events
    const { channel: taskChannel, leaveChannel: leaveTaskChannel } =
        useEcho<TaskEventData>(
            channelName,
            '.task.updated', // Event name (note the leading dot for broadcastAs)
            handleTaskUpdate,
            [handleTaskUpdate],
            'private', // Channel visibility
        );

    // Subscribe to list.updated events on the same channel
    const { channel: listChannel, leaveChannel: leaveListChannel } =
        useEcho<ListEventData>(
            channelName,
            '.list.updated', // Event name for list updates
            handleListUpdate,
            [handleListUpdate],
            'private',
        );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            lastTaskEventRef.current = null;
            lastListEventRef.current = null;
        };
    }, []);

    return {
        taskChannel,
        listChannel,
        leaveTaskChannel,
        leaveListChannel,
        isConnected: !!taskChannel,
    };
}
