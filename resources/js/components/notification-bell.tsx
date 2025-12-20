import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificationRealtime, useUnreadCount } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';
import { index as notificationsIndex } from '@/routes/notifications';
import type { Notification } from '@/types/notifications.d';
import { Link, router } from '@inertiajs/react';
import { Bell, CheckCircle, Clock, FolderPlus, Shield, UserMinus, UserPlus, AlertTriangle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface NotificationBellProps {
    initialCount?: number;
    variant?: 'icon' | 'sidebar';
    className?: string;
}

// Get notification icon based on type
function getNotificationIcon(type: string) {
    switch (type) {
        case 'task.assigned':
            return <UserPlus className="size-4 text-blue-500" />;
        case 'task.completed':
            return <CheckCircle className="size-4 text-green-500" />;
        case 'task.due_soon':
            return <Clock className="size-4 text-yellow-500" />;
        case 'task.overdue':
            return <AlertTriangle className="size-4 text-red-500" />;
        case 'project.invitation':
            return <FolderPlus className="size-4 text-purple-500" />;
        case 'project.removed':
            return <UserMinus className="size-4 text-orange-500" />;
        case 'member.role_changed':
            return <Shield className="size-4 text-indigo-500" />;
        default:
            return <Bell className="size-4 text-muted-foreground" />;
    }
}

interface PreviewNotification {
    id: string;
    type: string;
    message: string;
    created_at_human: string;
    is_read: boolean;
}

export function NotificationBell({
    initialCount = 0,
    variant = 'icon',
    className,
}: NotificationBellProps) {
    const [previewNotifications, setPreviewNotifications] = useState<PreviewNotification[]>([]);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const { count, setCount, refetch } = useUnreadCount(initialCount);

    // Real-time updates
    const handleNewNotification = useCallback((notification: Notification) => {
        toast.info(notification.data.message || 'New notification', {
            description: notification.data.project_name || undefined,
            action: {
                label: 'View',
                onClick: () => router.visit(notificationsIndex().url),
            },
        });
        refetch();
    }, [refetch]);

    useNotificationRealtime({
        onNotificationReceived: handleNewNotification,
    });

    // Fetch preview notifications when dropdown opens
    const handleOpenChange = async (open: boolean) => {
        if (open && previewNotifications.length === 0) {
            setIsLoadingPreview(true);
            try {
                const response = await fetch('/api/notifications?filter=unread', {
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setPreviewNotifications(
                        data.notifications.data.slice(0, 5).map((n: Notification) => ({
                            id: n.id,
                            type: n.type,
                            message: n.data.message || 'New notification',
                            created_at_human: n.created_at_human,
                            is_read: n.is_read,
                        }))
                    );
                }
            } catch {
                // Silently fail
            } finally {
                setIsLoadingPreview(false);
            }
        }
    };

    // Sidebar variant - just a link
    if (variant === 'sidebar') {
        return (
            <Link
                href={notificationsIndex().url}
                className={cn(
                    'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent',
                    className
                )}
            >
                <div className="relative">
                    <Bell className="size-4" />
                    {count > 0 && (
                        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                            {count > 9 ? '9+' : count}
                        </span>
                    )}
                </div>
                <span className="flex-1">Notifications</span>
                {count > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                        {count}
                    </Badge>
                )}
            </Link>
        );
    }

    // Icon variant with dropdown
    return (
        <DropdownMenu onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={cn('relative', className)}>
                    <Bell className="size-5" />
                    {count > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                            {count > 99 ? '99+' : count}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-3 py-2">
                    <span className="font-semibold">Notifications</span>
                    {count > 0 && (
                        <Badge variant="secondary">{count} unread</Badge>
                    )}
                </div>
                <DropdownMenuSeparator />

                {isLoadingPreview ? (
                    <div className="space-y-2 p-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-start gap-2 p-2">
                                <Skeleton className="size-8 rounded-full" />
                                <div className="flex-1 space-y-1">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : previewNotifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No unread notifications
                    </div>
                ) : (
                    <div className="max-h-80 overflow-y-auto">
                        {previewNotifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                asChild
                                className="cursor-pointer"
                            >
                                <Link
                                    href={notificationsIndex().url}
                                    className="flex items-start gap-2 p-2"
                                >
                                    <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {notification.created_at_human}
                                        </p>
                                    </div>
                                    {!notification.is_read && (
                                        <div className="size-2 rounded-full bg-primary" />
                                    )}
                                </Link>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link
                        href={notificationsIndex().url}
                        className="w-full cursor-pointer justify-center font-medium"
                    >
                        View all notifications
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
