import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Notification } from '@/types/notifications.d';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { NotificationItem } from './notification-item';
import { NotificationTimeline } from './notification-timeline';

interface NotificationListProps {
    notifications: Notification[];
    isLoading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    onMarkAsRead?: (id: string) => void;
    onDelete?: (id: string) => void;
    viewMode?: 'list' | 'timeline';
}

// Animation variants for staggered list
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

function NotificationSkeleton() {
    return (
        <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-5 w-24 rounded-full" />
            </div>
        </div>
    );
}

export function NotificationList({
    notifications,
    isLoading,
    hasMore,
    onLoadMore,
    onMarkAsRead,
    onDelete,
    viewMode = 'timeline',
}: NotificationListProps) {
    // Use timeline view by default
    if (viewMode === 'timeline') {
        return (
            <NotificationTimeline
                notifications={notifications}
                isLoading={isLoading}
                hasMore={hasMore}
                onLoadMore={onLoadMore}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
            />
        );
    }

    // Original list view
    if (isLoading && notifications.length === 0) {
        return (
            <div className="flex flex-col gap-3">
                {[...Array(5)].map((_, i) => (
                    <NotificationSkeleton key={i} />
                ))}
            </div>
        );
    }

    return (
        <motion.div
            className="flex flex-col gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <AnimatePresence mode="popLayout">
                {notifications.map((notification) => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={onMarkAsRead}
                        onDelete={onDelete}
                    />
                ))}
            </AnimatePresence>

            {hasMore && (
                <motion.div
                    className="flex justify-center pt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
                        {isLoading ? 'Loading...' : 'Load more'}
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
}
