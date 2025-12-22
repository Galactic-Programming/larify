import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, CheckCheck, MoreHorizontal, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface NotificationHeaderProps {
    unreadCount: number;
    totalCount: number;
    onMarkAllAsRead: () => void;
    onDeleteRead: () => void;
    hasReadNotifications: boolean;
}

export function NotificationHeader({
    unreadCount,
    totalCount,
    onMarkAllAsRead,
    onDeleteRead,
    hasReadNotifications,
}: NotificationHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="flex items-center gap-4">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                    className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/25 sm:size-14"
                >
                    <Bell className="size-6 sm:size-7" />
                    {unreadCount > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring' }}
                            className="absolute -right-1 -top-1"
                        >
                            <Badge variant="destructive" className="size-5 justify-center p-0 text-xs">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                        </motion.div>
                    )}
                </motion.div>
                <div className="min-w-0">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-2xl font-bold tracking-tight sm:text-3xl"
                    >
                        Notifications
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm text-muted-foreground"
                    >
                        {totalCount > 0 ? (
                            <>
                                {totalCount} notification{totalCount !== 1 ? 's' : ''}
                                {unreadCount > 0 && ` • ${unreadCount} unread`}
                            </>
                        ) : (
                            'Stay updated with your projects and tasks'
                        )}
                    </motion.p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
            >
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <MoreHorizontal className="mr-2 size-4" />
                            Actions
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onMarkAllAsRead} disabled={unreadCount === 0}>
                            <CheckCheck className="mr-2 size-4" />
                            Mark all as read
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={onDeleteRead}
                            className="text-destructive"
                            disabled={!hasReadNotifications}
                        >
                            <Trash2 className="mr-2 size-4" />
                            Delete read notifications
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </motion.div>
        </motion.div>
    );
}
