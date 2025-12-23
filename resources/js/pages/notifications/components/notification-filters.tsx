import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type {
    NotificationFilter,
    NotificationSortBy,
} from '@/types/notifications.d';
import { Activity, Bell, Clock, Search, Tag } from 'lucide-react';
import { motion } from 'motion/react';

interface NotificationFiltersProps {
    activeTab: 'notifications' | 'activities';
    onTabChange: (tab: 'notifications' | 'activities') => void;
    filter: NotificationFilter;
    onFilterChange: (filter: NotificationFilter) => void;
    sortBy: NotificationSortBy;
    onSortChange: (sort: NotificationSortBy) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    counts: {
        notifications: number;
        activities: number;
        unread: number;
        read: number;
    };
}

export function NotificationFilters({
    activeTab,
    onTabChange,
    filter,
    onFilterChange,
    sortBy,
    onSortChange,
    searchQuery,
    onSearchChange,
    counts,
}: NotificationFiltersProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4"
        >
            {/* Tab & Filter Buttons */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                {/* Tab Buttons - Notifications vs Activities */}
                <div className="flex w-full gap-1 rounded-lg border bg-muted/30 p-1 sm:w-auto">
                    <Button
                        variant={
                            activeTab === 'notifications' ? 'default' : 'ghost'
                        }
                        size="sm"
                        onClick={() => onTabChange('notifications')}
                        className="flex-1 gap-1 text-xs sm:flex-initial sm:gap-1.5 sm:text-sm"
                    >
                        <Bell className="size-4" />
                        Notifications
                        {counts.notifications > 0 && (
                            <Badge
                                variant={
                                    activeTab === 'notifications'
                                        ? 'secondary'
                                        : 'outline'
                                }
                                className="ml-0.5 sm:ml-1"
                            >
                                {counts.notifications}
                            </Badge>
                        )}
                    </Button>
                    <Button
                        variant={
                            activeTab === 'activities' ? 'default' : 'ghost'
                        }
                        size="sm"
                        onClick={() => onTabChange('activities')}
                        className="flex-1 gap-1 text-xs sm:flex-initial sm:gap-1.5 sm:text-sm"
                    >
                        <Activity className="size-4" />
                        Activities
                        {counts.activities > 0 && (
                            <Badge
                                variant={
                                    activeTab === 'activities'
                                        ? 'secondary'
                                        : 'outline'
                                }
                                className="ml-0.5 sm:ml-1"
                            >
                                {counts.activities}
                            </Badge>
                        )}
                    </Button>
                </div>

                {/* Secondary Filter - Only for Notifications tab */}
                {activeTab === 'notifications' && (
                    <div className="flex w-full gap-1 rounded-lg border bg-muted/30 p-1 sm:w-auto">
                        <Button
                            variant={filter === 'all' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => onFilterChange('all')}
                            className="flex-1 gap-1 text-xs sm:flex-initial sm:gap-1.5 sm:text-sm"
                        >
                            All
                            <Badge
                                variant={
                                    filter === 'all' ? 'secondary' : 'outline'
                                }
                                className="ml-0.5 sm:ml-1"
                            >
                                {counts.notifications}
                            </Badge>
                        </Button>
                        <Button
                            variant={filter === 'unread' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => onFilterChange('unread')}
                            className="flex-1 gap-1 text-xs sm:flex-initial sm:gap-1.5 sm:text-sm"
                        >
                            Unread
                            <Badge
                                variant={
                                    filter === 'unread'
                                        ? 'secondary'
                                        : 'outline'
                                }
                                className="ml-0.5 sm:ml-1"
                            >
                                {counts.unread}
                            </Badge>
                        </Button>
                        <Button
                            variant={filter === 'read' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => onFilterChange('read')}
                            className="flex-1 gap-1 text-xs sm:flex-initial sm:gap-1.5 sm:text-sm"
                        >
                            Read
                            <Badge
                                variant={
                                    filter === 'read' ? 'secondary' : 'outline'
                                }
                                className="ml-0.5 sm:ml-1"
                            >
                                {counts.read}
                            </Badge>
                        </Button>
                    </div>
                )}
            </div>

            {/* Sort & Search */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                {activeTab === 'notifications' && (
                    <Select
                        value={sortBy}
                        onValueChange={(v) =>
                            onSortChange(v as NotificationSortBy)
                        }
                    >
                        <SelectTrigger className="h-9 w-full sm:w-36">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="recent">
                                <span className="flex items-center gap-2">
                                    <Clock className="size-4" />
                                    Recent
                                </span>
                            </SelectItem>
                            <SelectItem value="oldest">
                                <span className="flex items-center gap-2">
                                    <Clock className="size-4" />
                                    Oldest
                                </span>
                            </SelectItem>
                            <SelectItem value="type">
                                <span className="flex items-center gap-2">
                                    <Tag className="size-4" />
                                    Type
                                </span>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                )}

                <div className="group relative">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                        type="text"
                        placeholder={
                            activeTab === 'notifications'
                                ? 'Search notifications...'
                                : 'Search activities...'
                        }
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="h-9 w-full pl-9 transition-all duration-200 sm:w-50 sm:focus:w-65"
                    />
                </div>
            </div>
        </motion.div>
    );
}
