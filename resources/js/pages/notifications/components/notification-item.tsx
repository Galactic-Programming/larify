import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Notification, NOTIFICATION_TYPES } from '@/types/notifications.d';
import { Link, router } from '@inertiajs/react';
import {
    Bell,
    Check,
    CheckCircle,
    Clock,
    FolderPlus,
    MoreHorizontal,
    Shield,
    Trash2,
    UserMinus,
    UserPlus,
    AlertTriangle,
} from 'lucide-react';
import { motion } from 'motion/react';

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead?: (id: string) => void;
    onDelete?: (id: string) => void;
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

// Get actor info (who triggered the notification)
function getActorInfo(notification: Notification): { name: string; avatar?: string } | null {
    const data = notification.data;

    if (data.assigned_by_name) {
        return { name: data.assigned_by_name, avatar: data.assigned_by_avatar };
    }
    if (data.completed_by_name) {
        return { name: data.completed_by_name, avatar: data.completed_by_avatar };
    }
    if (data.invited_by_name) {
        return { name: data.invited_by_name, avatar: data.invited_by_avatar };
    }
    if (data.changed_by_name) {
        return { name: data.changed_by_name, avatar: data.changed_by_avatar };
    }
    if (data.removed_by_name) {
        return { name: data.removed_by_name };
    }
    return null;
}

// Get click URL for notification
function getNotificationUrl(notification: Notification): string | null {
    const data = notification.data;

    if (data.project_id) {
        return `/projects/${data.project_id}/lists`;
    }
    return null;
}

// Get initials for avatar fallback
function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
    const actor = getActorInfo(notification);
    const url = getNotificationUrl(notification);
    const icon = getNotificationIcon(notification.type);
    const message = notification.data.message || 'You have a new notification';

    const handleClick = async () => {
        // Mark as read when clicking and wait for completion
        if (!notification.is_read && onMarkAsRead) {
            await onMarkAsRead(notification.id);
        }

        // Navigate to related resource after marking as read
        if (url) {
            router.visit(url);
        }
    };

    const handleMarkAsRead = (e: React.MouseEvent) => {
        e.stopPropagation();
        onMarkAsRead?.(notification.id);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.(notification.id);
    };

    const content = (
        <motion.div
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className={cn(
                'group flex items-start gap-3 rounded-lg border p-4 transition-colors',
                notification.is_read
                    ? 'bg-card border-border'
                    : 'bg-primary/5 border-primary/20 dark:bg-primary/10',
                url && 'cursor-pointer hover:bg-accent',
            )}
            onClick={handleClick}
        >
            {/* Actor avatar or icon */}
            <div className="shrink-0">
                {actor?.avatar ? (
                    <Avatar className="size-10">
                        <AvatarImage src={actor.avatar} alt={actor.name} />
                        <AvatarFallback>{getInitials(actor.name)}</AvatarFallback>
                    </Avatar>
                ) : actor ? (
                    <Avatar className="size-10">
                        <AvatarFallback>{getInitials(actor.name)}</AvatarFallback>
                    </Avatar>
                ) : (
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                        {icon}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug">{message}</p>
                        {notification.data.project_name && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                in {notification.data.project_name}
                            </p>
                        )}
                    </div>

                    {/* Unread indicator with pulse */}
                    {!notification.is_read && (
                        <div className="mt-1 size-2 shrink-0 animate-pulse rounded-full bg-primary" />
                    )}
                </div>

                <div className="mt-2 flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {icon}
                        <span>{notification.created_at_human}</span>
                    </span>
                </div>
            </div>

            {/* Actions dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                        <MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {!notification.is_read && (
                        <DropdownMenuItem onClick={handleMarkAsRead}>
                            <Check className="mr-2 size-4" />
                            Mark as read
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                        <Trash2 className="mr-2 size-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </motion.div>
    );

    return content;
}
