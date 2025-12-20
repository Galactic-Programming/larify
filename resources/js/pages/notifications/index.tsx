import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { index as notificationsIndex } from '@/routes/notifications';
import type { BreadcrumbItem } from '@/types';
import type { Activity, Notification, NotificationFilter, PaginationMeta } from '@/types/notifications.d';
import { Head, router } from '@inertiajs/react';
import { Activity as ActivityIcon, Bell, Check, CheckCheck, Filter, MoreHorizontal, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { ActivityEmpty } from './components/activity-empty';
import { ActivityList } from './components/activity-list';
import { NotificationEmpty } from './components/notification-empty';
import { NotificationList } from './components/notification-list';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Notifications', href: notificationsIndex().url },
];

interface Props {
    notifications: {
        data: Notification[];
        meta?: PaginationMeta;
    };
    activities?: {
        data: Activity[];
        meta?: PaginationMeta;
    };
    unreadCount: number;
    tab?: 'notifications' | 'activities';
}

export default function NotificationsIndex({
    notifications: initialNotifications,
    activities: initialActivities,
    unreadCount: initialUnreadCount,
    tab = 'notifications',
}: Props) {
    const [activeTab, setActiveTab] = useState(tab);
    const [filter, setFilter] = useState<NotificationFilter>('all');
    const [notifications, setNotifications] = useState(initialNotifications.data);
    const [activities, setActivities] = useState(initialActivities?.data || []);
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
    const [isLoading, setIsLoading] = useState(false);

    // Filter notifications
    const filteredNotifications = notifications.filter((n) => {
        if (filter === 'unread') return !n.is_read;
        if (filter === 'read') return n.is_read;
        return true;
    });

    // Mark single notification as read
    const handleMarkAsRead = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/notifications/${id}/read`, {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie
                            .split('; ')
                            .find((row) => row.startsWith('XSRF-TOKEN='))
                            ?.split('=')[1] || ''
                    ),
                },
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
                );
                setUnreadCount(data.unread_count);
            }
        } catch {
            toast.error('Failed to mark notification as read');
        }
    }, []);

    // Mark all notifications as read
    const handleMarkAllAsRead = useCallback(async () => {
        try {
            const response = await fetch('/api/notifications/read-all', {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie
                            .split('; ')
                            .find((row) => row.startsWith('XSRF-TOKEN='))
                            ?.split('=')[1] || ''
                    ),
                },
            });

            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
                );
                setUnreadCount(0);
                toast.success('All notifications marked as read');
            }
        } catch {
            toast.error('Failed to mark all as read');
        }
    }, []);

    // Delete single notification
    const handleDelete = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie
                            .split('; ')
                            .find((row) => row.startsWith('XSRF-TOKEN='))
                            ?.split('=')[1] || ''
                    ),
                },
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications((prev) => prev.filter((n) => n.id !== id));
                setUnreadCount(data.unread_count);
                toast.success('Notification deleted');
            }
        } catch {
            toast.error('Failed to delete notification');
        }
    }, []);

    // Delete all read notifications
    const handleDeleteRead = useCallback(async () => {
        try {
            const response = await fetch('/api/notifications/read', {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie
                            .split('; ')
                            .find((row) => row.startsWith('XSRF-TOKEN='))
                            ?.split('=')[1] || ''
                    ),
                },
            });

            if (response.ok) {
                setNotifications((prev) => prev.filter((n) => !n.is_read));
                toast.success('Read notifications deleted');
            }
        } catch {
            toast.error('Failed to delete read notifications');
        }
    }, []);

    // Load more activities
    const handleLoadMoreActivities = useCallback(async () => {
        setIsLoading(true);
        try {
            const page = Math.ceil(activities.length / 30) + 1;
            const response = await fetch(`/api/activities?page=${page}`, {
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setActivities((prev) => [...prev, ...data.activities.data]);
            }
        } catch {
            toast.error('Failed to load more activities');
        } finally {
            setIsLoading(false);
        }
    }, [activities.length]);

    const unreadFilteredCount = notifications.filter((n) => !n.is_read).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />
            <div className="mx-auto flex h-full w-full max-w-4xl flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                        <p className="text-sm text-muted-foreground">
                            Stay updated with your projects and tasks
                        </p>
                    </div>

                    {activeTab === 'notifications' && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <MoreHorizontal className="mr-2 size-4" />
                                    Actions
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={handleMarkAllAsRead}
                                    disabled={unreadFilteredCount === 0}
                                >
                                    <CheckCheck className="mr-2 size-4" />
                                    Mark all as read
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleDeleteRead}
                                    className="text-destructive"
                                    disabled={notifications.every((n) => !n.is_read)}
                                >
                                    <Trash2 className="mr-2 size-4" />
                                    Delete read notifications
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <TabsList>
                            <TabsTrigger value="notifications" className="gap-2">
                                <Bell className="size-4" />
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                                        {unreadCount}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="activities" className="gap-2">
                                <ActivityIcon className="size-4" />
                                Activity Feed
                            </TabsTrigger>
                        </TabsList>

                        {/* Filter (only for notifications) */}
                        {activeTab === 'notifications' && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Filter:</span>
                                <div className="flex gap-1">
                                    {(['all', 'unread', 'read'] as const).map((f) => (
                                        <Button
                                            key={f}
                                            variant={filter === f ? 'secondary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setFilter(f)}
                                            className="capitalize"
                                        >
                                            {f}
                                            {f === 'unread' && unreadFilteredCount > 0 && (
                                                <span className="ml-1 text-xs">({unreadFilteredCount})</span>
                                            )}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="mt-6">
                        {filteredNotifications.length === 0 ? (
                            <NotificationEmpty filter={filter} />
                        ) : (
                            <NotificationList
                                notifications={filteredNotifications}
                                onMarkAsRead={handleMarkAsRead}
                                onDelete={handleDelete}
                            />
                        )}
                    </TabsContent>

                    {/* Activities Tab */}
                    <TabsContent value="activities" className="mt-6">
                        {activities.length === 0 ? (
                            <ActivityEmpty />
                        ) : (
                            <ActivityList
                                activities={activities}
                                isLoading={isLoading}
                                hasMore={(initialActivities?.meta?.current_page || 1) < (initialActivities?.meta?.last_page || 1)}
                                onLoadMore={handleLoadMoreActivities}
                            />
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
