import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Notification } from '@/types/notifications.d';
import { FolderOpen } from 'lucide-react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useMemo } from 'react';
import { NotificationItem } from './notification-item';

interface NotificationTimelineProps {
    notifications: Notification[];
    isLoading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    onMarkAsRead?: (id: string) => void;
    onDelete?: (id: string) => void;
}

// Animation variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
};

// Group notifications by project
interface ProjectGroup {
    projectId: number;
    projectName: string;
    projectColor: string;
    notifications: Notification[];
    latestTime: string;
    unreadCount: number;
}

/**
 * Group consecutive notifications by project in chronological order.
 */
function groupConsecutiveNotificationsByProject(notifications: Notification[]): ProjectGroup[] {
    if (notifications.length === 0) return [];

    const groups: ProjectGroup[] = [];
    let currentGroup: ProjectGroup | null = null;

    notifications.forEach((notification) => {
        const projectId = notification.data.project_id || 0;
        const projectName = notification.data.project_name || 'General';
        const projectColor = notification.data.project_color || '#6b7280';

        // If this notification belongs to a different project, start a new group
        if (!currentGroup || currentGroup.projectId !== projectId) {
            currentGroup = {
                projectId,
                projectName,
                projectColor,
                notifications: [],
                latestTime: notification.created_at_human,
                unreadCount: 0,
            };
            groups.push(currentGroup);
        }

        currentGroup.notifications.push(notification);
        if (!notification.is_read) {
            currentGroup.unreadCount++;
        }
    });

    return groups;
}

function NotificationSkeleton() {
    return (
        <div className="relative pl-6">
            {/* Timeline dot */}
            <div className="absolute left-0 top-5 -translate-x-1/2">
                <Skeleton className="size-2.5 rounded-full" />
            </div>
            {/* Card skeleton */}
            <div className="pb-4">
                <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                        <Skeleton className="h-5 w-24 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Project group with continuous timeline
function ProjectTimelineGroup({
    group,
    groupIndex,
    isLastGroup,
    onMarkAsRead,
    onDelete,
}: {
    group: ProjectGroup;
    groupIndex: number;
    isLastGroup: boolean;
    onMarkAsRead?: (id: string) => void;
    onDelete?: (id: string) => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="relative"
        >
            {/* Project header - with icon, no timeline connection */}
            <div className="flex items-center gap-3 pb-4">
                {/* Project icon */}
                <div
                    className="flex size-7 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${group.projectColor}20` }}
                >
                    <FolderOpen className="size-4" style={{ color: group.projectColor }} />
                </div>
                {/* Project info */}
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{group.projectName}</h3>
                    <span className="text-xs text-muted-foreground">
                        {group.notifications.length}{' '}
                        {group.notifications.length === 1 ? 'notification' : 'notifications'}
                    </span>
                    {group.unreadCount > 0 && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {group.unreadCount} unread
                        </span>
                    )}
                    <span className="text-xs text-muted-foreground">• {group.latestTime}</span>
                </div>
            </div>

            {/* Notifications with timeline */}
            <div className="relative ml-3">
                {/* Continuous timeline line - only for notifications */}
                <div
                    className="absolute left-0 top-0 w-0.5 rounded-full"
                    style={{
                        backgroundColor: group.projectColor,
                        opacity: 0.3,
                        top: '20px',
                        height: `calc(100% - ${isLastGroup ? '44px' : '24px'})`,
                    }}
                />

                {/* Notifications in this project */}
                {group.notifications.map((notification, index) => (
                    <div key={notification.id} className="relative pb-4 pl-6">
                        {/* Notification dot - centered on the timeline line */}
                        <div
                            className="absolute left-0 top-5 z-10 -translate-x-1/2 size-2.5 rounded-full ring-[3px] ring-background"
                            style={{
                                backgroundColor: notification.is_read ? group.projectColor : undefined,
                            }}
                        >
                            {/* Unread dot has primary color */}
                            {!notification.is_read && (
                                <div className="size-full rounded-full bg-primary animate-pulse" />
                            )}
                        </div>
                        {/* Notification card */}
                        <NotificationItem
                            notification={notification}
                            onMarkAsRead={onMarkAsRead}
                            onDelete={onDelete}
                        />
                    </div>
                ))}
            </div>

            {/* Spacer between project groups */}
            {!isLastGroup && <div className="h-6" />}
        </motion.div>
    );
}

export function NotificationTimeline({
    notifications,
    isLoading,
    hasMore,
    onLoadMore,
    onMarkAsRead,
    onDelete,
}: NotificationTimelineProps) {
    const projectGroups = useMemo(
        () => groupConsecutiveNotificationsByProject(notifications),
        [notifications],
    );

    if (isLoading && notifications.length === 0) {
        return (
            <div className="relative ml-3">
                {/* Skeleton timeline line */}
                <div className="absolute left-0 top-5 h-[calc(100%-44px)] w-0.5 rounded-full bg-muted opacity-30" />
                <div className="flex flex-col">
                    {[...Array(5)].map((_, i) => (
                        <NotificationSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col"
        >
            <AnimatePresence mode="popLayout">
                {projectGroups.map((group, groupIndex) => (
                    <ProjectTimelineGroup
                        key={`${group.projectId}-${groupIndex}`}
                        group={group}
                        groupIndex={groupIndex}
                        isLastGroup={groupIndex === projectGroups.length - 1}
                        onMarkAsRead={onMarkAsRead}
                        onDelete={onDelete}
                    />
                ))}
            </AnimatePresence>

            {hasMore && (
                <motion.div
                    className="flex justify-center pt-4 pl-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
                        {isLoading ? 'Loading...' : 'Load more'}
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
}
