import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Activity } from '@/types/notifications.d';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { ActivityItem } from './activity-item';
import { ActivityTimeline } from './activity-timeline';

interface ActivityListProps {
    activities: Activity[];
    isLoading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    viewMode?: 'list' | 'timeline';
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

function ActivitySkeleton() {
    return (
        <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="size-6 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-24 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </div>
        </div>
    );
}

export function ActivityList({
    activities,
    isLoading,
    hasMore,
    onLoadMore,
    viewMode = 'timeline',
}: ActivityListProps) {
    // Use timeline view by default
    if (viewMode === 'timeline') {
        return (
            <ActivityTimeline
                activities={activities}
                isLoading={isLoading}
                hasMore={hasMore}
                onLoadMore={onLoadMore}
            />
        );
    }

    // Original list view
    if (isLoading && activities.length === 0) {
        return (
            <div className="flex flex-col gap-3">
                {[...Array(5)].map((_, i) => (
                    <ActivitySkeleton key={i} />
                ))}
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
        >
            <AnimatePresence mode="popLayout">
                {activities.map((activity, index) => (
                    <ActivityItem
                        key={activity.id}
                        activity={activity}
                        index={index}
                    />
                ))}
            </AnimatePresence>

            {hasMore && (
                <motion.div
                    className="flex justify-center pt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <Button
                        variant="outline"
                        onClick={onLoadMore}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'Load more'}
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
}
