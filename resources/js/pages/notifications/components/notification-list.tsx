import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Notification } from '@/types/notifications.d';
import { motion, type Variants } from 'motion/react';
import { NotificationItem } from './notification-item';

interface NotificationListProps {
    notifications: Notification[];
    isLoading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    onMarkAsRead?: (id: string) => void;
    onDelete?: (id: string) => void;
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

const itemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 15,
        },
    },
};

function NotificationSkeleton() {
    return (
        <div className="flex items-start gap-3 rounded-lg border p-4">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-3 w-1/3" />
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
}: NotificationListProps) {
    if (isLoading && notifications.length === 0) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <NotificationSkeleton key={i} />
                ))}
            </div>
        );
    }

    return (
        <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {notifications.map((notification) => (
                <motion.div key={notification.id} variants={itemVariants}>
                    <NotificationItem
                        notification={notification}
                        onMarkAsRead={onMarkAsRead}
                        onDelete={onDelete}
                    />
                </motion.div>
            ))}

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
