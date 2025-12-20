import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Notification } from '@/types/notifications.d';
import { NotificationItem } from './notification-item';

interface NotificationListProps {
    notifications: Notification[];
    isLoading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    onMarkAsRead?: (id: string) => void;
    onDelete?: (id: string) => void;
}

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
        <div className="space-y-3">
            {notifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={onMarkAsRead}
                    onDelete={onDelete}
                />
            ))}

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
