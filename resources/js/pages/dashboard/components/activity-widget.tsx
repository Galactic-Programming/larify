import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import {
    Activity as ActivityIcon,
    Archive,
    ArchiveRestore,
    CheckCircle,
    FolderEdit,
    FolderPlus,
    List,
    ListPlus,
    Move,
    Pencil,
    PlusCircle,
    RotateCcw,
    Shield,
    Trash,
    UserMinus,
    UserPlus,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { Activity } from './types';

interface ActivityWidgetProps {
    activities: Activity[];
}

const ACTIVITY_STYLES: Record<
    string,
    { icon: React.ReactNode; bgColor: string; textColor: string }
> = {
    'task.created': {
        icon: <PlusCircle className="size-3.5" />,
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-500',
    },
    'task.updated': {
        icon: <Pencil className="size-3.5" />,
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-500',
    },
    'task.completed': {
        icon: <CheckCircle className="size-3.5" />,
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-500',
    },
    'task.reopened': {
        icon: <RotateCcw className="size-3.5" />,
        bgColor: 'bg-yellow-500/10',
        textColor: 'text-yellow-500',
    },
    'task.deleted': {
        icon: <Trash className="size-3.5" />,
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-500',
    },
    'task.assigned': {
        icon: <UserPlus className="size-3.5" />,
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-500',
    },
    'task.moved': {
        icon: <Move className="size-3.5" />,
        bgColor: 'bg-purple-500/10',
        textColor: 'text-purple-500',
    },
    'project.created': {
        icon: <FolderPlus className="size-3.5" />,
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-500',
    },
    'project.updated': {
        icon: <FolderEdit className="size-3.5" />,
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-500',
    },
    'project.archived': {
        icon: <Archive className="size-3.5" />,
        bgColor: 'bg-orange-500/10',
        textColor: 'text-orange-500',
    },
    'project.restored': {
        icon: <ArchiveRestore className="size-3.5" />,
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-500',
    },
    'member.added': {
        icon: <UserPlus className="size-3.5" />,
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-500',
    },
    'member.removed': {
        icon: <UserMinus className="size-3.5" />,
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-500',
    },
    'member.role_changed': {
        icon: <Shield className="size-3.5" />,
        bgColor: 'bg-indigo-500/10',
        textColor: 'text-indigo-500',
    },
    'list.created': {
        icon: <ListPlus className="size-3.5" />,
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-500',
    },
    'list.updated': {
        icon: <List className="size-3.5" />,
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-500',
    },
    'list.deleted': {
        icon: <Trash className="size-3.5" />,
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-500',
    },
    'list.reordered': {
        icon: <Move className="size-3.5" />,
        bgColor: 'bg-purple-500/10',
        textColor: 'text-purple-500',
    },
};

const DEFAULT_STYLE = {
    icon: <PlusCircle className="size-3.5" />,
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
};

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ActivityWidget({ activities }: ActivityWidgetProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
        >
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ActivityIcon className="size-4 text-primary" />
                            Recent Activity
                        </CardTitle>
                        <Link
                            href="/notifications"
                            className="text-xs text-primary hover:underline"
                        >
                            View all
                        </Link>
                    </div>
                    <CardDescription>Latest actions in your projects</CardDescription>
                </CardHeader>

                <CardContent>
                    {activities.length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                            No recent activity
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activities.map((activity, index) => {
                                const style =
                                    ACTIVITY_STYLES[activity.data.event] ||
                                    DEFAULT_STYLE;

                                return (
                                    <motion.div
                                        key={activity.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.2,
                                            delay: index * 0.05,
                                        }}
                                        className="flex items-start gap-2.5"
                                    >
                                        {/* Icon */}
                                        <div
                                            className={cn(
                                                'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full',
                                                style.bgColor,
                                                style.textColor,
                                            )}
                                        >
                                            {style.icon}
                                        </div>

                                        {/* Content */}
                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-2 text-xs text-foreground">
                                                <span className="font-medium">
                                                    {activity.user?.name ||
                                                        'Someone'}
                                                </span>{' '}
                                                {activity.description}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {formatTimeAgo(
                                                    activity.created_at,
                                                )}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
