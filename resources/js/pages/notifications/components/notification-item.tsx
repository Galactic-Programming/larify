import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types/notifications.d';
import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    Bell,
    Check,
    CheckCircle,
    Clock,
    FolderPlus,
    Shield,
    Trash2,
    UserMinus,
    UserPlus,
} from 'lucide-react';
import { motion } from 'motion/react';

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead?: (id: string) => void;
    onDelete?: (id: string) => void;
}

// Get notification icon and color based on type
function getNotificationStyle(type: string): {
    icon: React.ReactNode;
    bgColor: string;
    textColor: string;
} {
    switch (type) {
        case 'task.assigned':
            return {
                icon: <UserPlus className="size-4" />,
                bgColor: 'bg-blue-500/10',
                textColor: 'text-blue-500',
            };
        case 'task.completed':
            return {
                icon: <CheckCircle className="size-4" />,
                bgColor: 'bg-green-500/10',
                textColor: 'text-green-500',
            };
        case 'task.due_soon':
            return {
                icon: <Clock className="size-4" />,
                bgColor: 'bg-yellow-500/10',
                textColor: 'text-yellow-500',
            };
        case 'task.overdue':
            return {
                icon: <AlertTriangle className="size-4" />,
                bgColor: 'bg-red-500/10',
                textColor: 'text-red-500',
            };
        case 'project.invitation':
            return {
                icon: <FolderPlus className="size-4" />,
                bgColor: 'bg-purple-500/10',
                textColor: 'text-purple-500',
            };
        case 'project.removed':
            return {
                icon: <UserMinus className="size-4" />,
                bgColor: 'bg-orange-500/10',
                textColor: 'text-orange-500',
            };
        case 'member.role_changed':
            return {
                icon: <Shield className="size-4" />,
                bgColor: 'bg-indigo-500/10',
                textColor: 'text-indigo-500',
            };
        default:
            return {
                icon: <Bell className="size-4" />,
                bgColor: 'bg-muted',
                textColor: 'text-muted-foreground',
            };
    }
}

// Get actor info (who triggered the notification)
function getActorInfo(
    notification: Notification,
): { name: string; avatar?: string } | null {
    const data = notification.data;

    if (data.assigned_by_name) {
        return { name: data.assigned_by_name, avatar: data.assigned_by_avatar };
    }
    if (data.completed_by_name) {
        return {
            name: data.completed_by_name,
            avatar: data.completed_by_avatar,
        };
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

// Get type label for badge
function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        'task.assigned': 'Task Assigned',
        'task.completed': 'Task Completed',
        'task.due_soon': 'Due Soon',
        'task.overdue': 'Overdue',
        'project.invitation': 'Invitation',
        'project.removed': 'Removed',
        'member.role_changed': 'Role Changed',
    };
    return labels[type] || 'Notification';
}

export function NotificationItem({
    notification,
    onMarkAsRead,
    onDelete,
}: NotificationItemProps) {
    const actor = getActorInfo(notification);
    const url = getNotificationUrl(notification);
    const style = getNotificationStyle(notification.type);
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

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className={cn(
                'group relative flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50',
                !notification.is_read &&
                    'border-primary/30 bg-primary/5 dark:bg-primary/10',
                url && 'cursor-pointer',
            )}
            onClick={handleClick}
        >
            {/* Unread indicator bar */}
            {!notification.is_read && (
                <div className="absolute top-0 left-0 h-full w-1 rounded-l-lg bg-primary" />
            )}

            {/* Icon or Avatar */}
            <div className="shrink-0">
                {actor?.avatar ? (
                    <Avatar className="size-10 border-2 border-background shadow-sm">
                        <AvatarImage src={actor.avatar} alt={actor.name} />
                        <AvatarFallback>
                            {getInitials(actor.name)}
                        </AvatarFallback>
                    </Avatar>
                ) : actor ? (
                    <Avatar className="size-10 border-2 border-background shadow-sm">
                        <AvatarFallback>
                            {getInitials(actor.name)}
                        </AvatarFallback>
                    </Avatar>
                ) : (
                    <div
                        className={cn(
                            'flex size-10 items-center justify-center rounded-full',
                            style.bgColor,
                            style.textColor,
                        )}
                    >
                        {style.icon}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug font-medium">
                            {message}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {notification.data.project_name && (
                                <span className="inline-flex items-center gap-1.5">
                                    {notification.data.project_color && (
                                        <span
                                            className="size-2 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    notification.data
                                                        .project_color,
                                            }}
                                        />
                                    )}
                                    {notification.data.project_name}
                                </span>
                            )}
                            <span>•</span>
                            <span>{notification.created_at_human}</span>
                        </div>
                    </div>
                </div>

                {/* Type Badge */}
                <div className="mt-2">
                    <Badge
                        variant="secondary"
                        className={cn('text-xs', style.textColor)}
                    >
                        <span className={style.textColor}>{style.icon}</span>
                        <span className="ml-1">
                            {getTypeLabel(notification.type)}
                        </span>
                    </Badge>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
                {!notification.is_read && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
                                onClick={handleMarkAsRead}
                            >
                                <Check className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mark as read</TooltipContent>
                    </Tooltip>
                )}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                            onClick={handleDelete}
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                </Tooltip>
            </div>
        </motion.div>
    );
}
