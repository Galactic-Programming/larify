import type { SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { useCallback, useEffect, useRef } from 'react';

interface TaskEventData {
    task: {
        id: number;
        list_id: number;
        title: string;
        priority: string;
        due_date: string;
        due_time: string;
        completed_at: string | null;
        updated_at: string;
    };
    action: 'created' | 'updated' | 'deleted' | 'moved' | 'completed';
}

interface ProjectEventData {
    project: {
        id: number;
        name: string;
        color: string;
        updated_at: string;
    };
    action: 'created' | 'updated' | 'deleted' | 'archived';
}

interface ActivityEventData {
    activity: {
        id: number;
        description: string;
        created_at: string;
    };
}

interface UseDashboardRealtimeOptions {
    onTaskUpdate?: (data: TaskEventData) => void;
    onProjectUpdate?: (data: ProjectEventData) => void;
    onActivityUpdate?: (data: ActivityEventData) => void;
    autoRefresh?: boolean;
}

/**
 * Hook to listen for real-time dashboard updates via Laravel Echo/Reverb
 * Listens on the user's private dashboard channel for tasks, projects, and activities
 */
export function useDashboardRealtime({
    onTaskUpdate,
    onProjectUpdate,
    onActivityUpdate,
    autoRefresh = true,
}: UseDashboardRealtimeOptions = {}) {
    const { auth } = usePage<SharedData>().props;
    const userId = auth?.user?.id;
    const channelName = `user.${userId}.dashboard`;

    const lastTaskEventRef = useRef<string | null>(null);
    const lastProjectEventRef = useRef<string | null>(null);
    const lastActivityEventRef = useRef<string | null>(null);
    const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );

    // Debounced refresh to avoid multiple rapid reloads
    const debouncedRefresh = useCallback((only: string[]) => {
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }
        refreshTimeoutRef.current = setTimeout(() => {
            router.reload({ only });
        }, 300);
    }, []);

    // Handle task updates
    const handleTaskUpdate = useCallback(
        (data: TaskEventData) => {
            const eventKey = `task-${data.task.id}-${data.action}-${data.task.updated_at}`;
            if (lastTaskEventRef.current === eventKey) {
                return;
            }
            lastTaskEventRef.current = eventKey;

            onTaskUpdate?.(data);

            if (autoRefresh) {
                debouncedRefresh([
                    'stats',
                    'myTasks',
                    'upcomingDeadlines',
                    'recentActivities',
                ]);
            }
        },
        [onTaskUpdate, autoRefresh, debouncedRefresh],
    );

    // Handle project updates
    const handleProjectUpdate = useCallback(
        (data: ProjectEventData) => {
            const eventKey = `project-${data.project.id}-${data.action}-${data.project.updated_at}`;
            if (lastProjectEventRef.current === eventKey) {
                return;
            }
            lastProjectEventRef.current = eventKey;

            onProjectUpdate?.(data);

            if (autoRefresh) {
                debouncedRefresh([
                    'stats',
                    'recentProjects',
                    'recentActivities',
                ]);
            }
        },
        [onProjectUpdate, autoRefresh, debouncedRefresh],
    );

    // Handle activity updates
    const handleActivityUpdate = useCallback(
        (data: ActivityEventData) => {
            const eventKey = `activity-${data.activity.id}-${data.activity.created_at}`;
            if (lastActivityEventRef.current === eventKey) {
                return;
            }
            lastActivityEventRef.current = eventKey;

            onActivityUpdate?.(data);

            if (autoRefresh) {
                debouncedRefresh(['recentActivities']);
            }
        },
        [onActivityUpdate, autoRefresh, debouncedRefresh],
    );

    // Subscribe to task events
    const { channel: taskChannel, leaveChannel: leaveTaskChannel } =
        useEcho<TaskEventData>(
            channelName,
            '.dashboard.task.updated',
            handleTaskUpdate,
            [handleTaskUpdate],
            'private',
        );

    // Subscribe to project events
    const { channel: projectChannel, leaveChannel: leaveProjectChannel } =
        useEcho<ProjectEventData>(
            channelName,
            '.dashboard.project.updated',
            handleProjectUpdate,
            [handleProjectUpdate],
            'private',
        );

    // Subscribe to activity events
    const { channel: activityChannel, leaveChannel: leaveActivityChannel } =
        useEcho<ActivityEventData>(
            channelName,
            '.dashboard.activity.created',
            handleActivityUpdate,
            [handleActivityUpdate],
            'private',
        );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            lastTaskEventRef.current = null;
            lastProjectEventRef.current = null;
            lastActivityEventRef.current = null;
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, []);

    return {
        taskChannel,
        projectChannel,
        activityChannel,
        leaveTaskChannel,
        leaveProjectChannel,
        leaveActivityChannel,
        channelName,
        isConnected: !!taskChannel,
    };
}
