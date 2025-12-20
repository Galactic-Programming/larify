import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Activity } from '@/types/notifications.d';
import { motion, type Variants } from 'motion/react';
import { ActivityItem } from './activity-item';

interface ActivityListProps {
    activities: Activity[];
    isLoading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
}

// Animation variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.2,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, x: -15 },
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

const timelineVariants: Variants = {
    hidden: { scaleY: 0 },
    visible: {
        scaleY: 1,
        transition: {
            duration: 0.6,
            ease: 'easeOut',
        },
    },
};

function ActivitySkeleton() {
    return (
        <div className="flex items-start gap-3 py-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-2 pb-4">
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
}: ActivityListProps) {
    if (isLoading && activities.length === 0) {
        return (
            <div className="space-y-1">
                {[...Array(5)].map((_, i) => (
                    <ActivitySkeleton key={i} />
                ))}
            </div>
        );
    }

    return (
        <motion.div
            className="relative overflow-visible"
            initial="hidden"
            animate="visible"
        >
            {/* Animated Timeline line - grows from top to bottom */}
            <motion.div
                className="absolute left-4 top-0 bottom-0 w-px origin-top bg-border"
                variants={timelineVariants}
            />

            <motion.div className="space-y-1" variants={containerVariants}>
                {activities.map((activity, index) => (
                    <motion.div
                        key={activity.id}
                        className="relative"
                        variants={itemVariants}
                    >
                        <ActivityItem activity={activity} index={index} />
                        {/* Hide line for last item */}
                        {index === activities.length - 1 && (
                            <div className="absolute left-4 top-8 bottom-0 w-px bg-background" />
                        )}
                    </motion.div>
                ))}
            </motion.div>

            {hasMore && (
                <motion.div
                    className="flex justify-center pt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
                            {isLoading ? 'Loading...' : 'Load more'}
                        </Button>
                    </motion.div>
                </motion.div>
            )}
        </motion.div>
    );
}
