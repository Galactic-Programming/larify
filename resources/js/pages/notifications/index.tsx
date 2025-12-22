import AppLayout from '@/layouts/app-layout';
import { index as notificationsIndex } from '@/routes/notifications';
import type { BreadcrumbItem } from '@/types';
import type { Activity, Notification, NotificationFilter, NotificationSortBy, PaginationMeta } from '@/types/notifications.d';
import { Head } from '@inertiajs/react';
import { motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ActivityEmpty } from './components/activity-empty';
import { ActivityList } from './components/activity-list';
import { NotificationEmpty } from './components/notification-empty';
import { NotificationFilters } from './components/notification-filters';
import { NotificationHeader } from './components/notification-header';
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
    const [activeTab, setActiveTab] = useState<'notifications' | 'activities'>(tab);
    const [filter, setFilter] = useState<NotificationFilter>('all');
    const [sortBy, setSortBy] = useState<NotificationSortBy>('recent');
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState(initialNotifications.data);
    const [activities, setActivities] = useState(initialActivities?.data || []);
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
    const [isLoading, setIsLoading] = useState(false);

    // Filter and sort notifications
    const filteredNotifications = useMemo(() => {
        let items = notifications;

        // Filter by read status
        if (filter === 'unread') {
            items = items.filter((n) => !n.is_read);
        } else if (filter === 'read') {
            items = items.filter((n) => n.is_read);
        }

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter((n) =>
                n.data.message?.toLowerCase().includes(query) ||
                n.data.project_name?.toLowerCase().includes(query) ||
                n.type.toLowerCase().includes(query)
            );
        }

        // Sort
        items = [...items].sort((a, b) => {
            switch (sortBy) {
                case 'recent':
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'oldest':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'type':
                    return a.type.localeCompare(b.type);
                default:
                    return 0;
            }
        });

        return items;
    }, [notifications, filter, sortBy, searchQuery]);

    // Filter activities by search
    const filteredActivities = useMemo(() => {
        if (!searchQuery) return activities;

        const query = searchQuery.toLowerCase();
        return activities.filter((a) =>
            a.description?.toLowerCase().includes(query) ||
            a.project?.name?.toLowerCase().includes(query) ||
            a.user?.name?.toLowerCase().includes(query) ||
            a.type_label?.toLowerCase().includes(query)
        );
    }, [activities, searchQuery]);

    // Counts
    const counts = useMemo(() => ({
        notifications: notifications.length,
        activities: activities.length,
        unread: notifications.filter((n) => !n.is_read).length,
        read: notifications.filter((n) => n.is_read).length,
    }), [notifications, activities]);

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
            } else {
                const errorData = await response.json().catch(() => ({}));
                toast.error(errorData.message || 'Failed to delete read notifications');
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
                // API returns { activities: [...], pagination: {...} }
                const newActivities = Array.isArray(data.activities)
                    ? data.activities
                    : data.activities?.data || [];
                setActivities((prev) => [...prev, ...newActivities]);
            }
        } catch {
            toast.error('Failed to load more activities');
        } finally {
            setIsLoading(false);
        }
    }, [activities.length]);

    // Clear search when switching tabs
    const handleTabChange = useCallback((newTab: 'notifications' | 'activities') => {
        setActiveTab(newTab);
        setSearchQuery('');
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                {/* Header */}
                <NotificationHeader
                    unreadCount={unreadCount}
                    totalCount={notifications.length}
                    onMarkAllAsRead={handleMarkAllAsRead}
                    onDeleteRead={handleDeleteRead}
                    hasReadNotifications={counts.read > 0}
                />

                {/* Filters */}
                <NotificationFilters
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    filter={filter}
                    onFilterChange={setFilter}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    counts={counts}
                />

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="flex-1"
                >
                    {activeTab === 'notifications' ? (
                        filteredNotifications.length === 0 ? (
                            <NotificationEmpty filter={filter} />
                        ) : (
                            <NotificationList
                                notifications={filteredNotifications}
                                onMarkAsRead={handleMarkAsRead}
                                onDelete={handleDelete}
                            />
                        )
                    ) : (
                        filteredActivities.length === 0 ? (
                            <ActivityEmpty />
                        ) : (
                            <ActivityList
                                activities={filteredActivities}
                                isLoading={isLoading}
                                hasMore={(initialActivities?.meta?.current_page || 1) < (initialActivities?.meta?.last_page || 1)}
                                onLoadMore={handleLoadMoreActivities}
                            />
                        )
                    )}
                </motion.div>
            </div>
        </AppLayout>
    );
}
