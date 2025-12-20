import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Activity } from '@/types/notifications.d';
import { ActivityItem } from './activity-item';

interface ActivityListProps {
    activities: Activity[];
    isLoading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
}

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
        <div className="relative overflow-visible">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-1">
                {activities.map((activity, index) => (
                    <div key={activity.id} className="relative">
                        <ActivityItem activity={activity} />
                        {/* Hide line for last item */}
                        {index === activities.length - 1 && (
                            <div className="absolute left-4 top-8 bottom-0 w-px bg-background" />
                        )}
                    </div>
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center pt-4">
                    <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
                        {isLoading ? 'Loading...' : 'Load more'}
                    </Button>
                </div>
            )}
        </div>
    );
}
