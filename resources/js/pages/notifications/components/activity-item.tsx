import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Activity } from '@/types/notifications.d';
import { Link } from '@inertiajs/react';
import {
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

interface ActivityItemProps {
    activity: Activity;
    index?: number;
}

// Map activity type icons and colors
const ACTIVITY_STYLES: Record<
    string,
    { icon: React.ReactNode; bgColor: string; textColor: string }
> = {
    'task.created': {
        icon: <PlusCircle className="size-4" />,
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-500',
    },
    'task.updated': {
        icon: <Pencil className="size-4" />,
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-500',
    },
    'task.completed': {
        icon: <CheckCircle className="size-4" />,
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-500',
    },
    'task.reopened': {
        icon: <RotateCcw className="size-4" />,
        bgColor: 'bg-yellow-500/10',
        textColor: 'text-yellow-500',
    },
    'task.deleted': {
        icon: <Trash className="size-4" />,
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-500',
    },
    'task.assigned': {
        icon: <UserPlus className="size-4" />,
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-500',
    },
    'task.moved': {
        icon: <Move className="size-4" />,
        bgColor: 'bg-purple-500/10',
        textColor: 'text-purple-500',
    },
    'project.created': {
        icon: <FolderPlus className="size-4" />,
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-500',
    },
    'project.updated': {
        icon: <FolderEdit className="size-4" />,
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-500',
    },
    'project.archived': {
        icon: <Archive className="size-4" />,
        bgColor: 'bg-orange-500/10',
        textColor: 'text-orange-500',
    },
    'project.restored': {
        icon: <ArchiveRestore className="size-4" />,
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-500',
    },
    'member.added': {
        icon: <UserPlus className="size-4" />,
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-500',
    },
    'member.removed': {
        icon: <UserMinus className="size-4" />,
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-500',
    },
    'member.role_changed': {
        icon: <Shield className="size-4" />,
        bgColor: 'bg-indigo-500/10',
        textColor: 'text-indigo-500',
    },
    'list.created': {
        icon: <ListPlus className="size-4" />,
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-500',
    },
    'list.updated': {
        icon: <List className="size-4" />,
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-500',
    },
    'list.deleted': {
        icon: <Trash className="size-4" />,
        bgColor: 'bg-red-500/10',
        textColor: 'text-red-500',
    },
    'list.reordered': {
        icon: <Move className="size-4" />,
        bgColor: 'bg-purple-500/10',
        textColor: 'text-purple-500',
    },
};

const DEFAULT_STYLE = {
    icon: <PlusCircle className="size-4" />,
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
};

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function ActivityItem({ activity, index = 0 }: ActivityItemProps) {
    const style = ACTIVITY_STYLES[activity.type] || DEFAULT_STYLE;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: index * 0.05 }}
            className="group relative flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
        >
            {/* Icon */}
            <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${style.bgColor} ${style.textColor}`}
            >
                {style.icon}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    {activity.user && (
                        <Avatar className="size-6 border border-background">
                            {activity.user.avatar && (
                                <AvatarImage
                                    src={activity.user.avatar}
                                    alt={activity.user.name}
                                />
                            )}
                            <AvatarFallback className="text-xs">
                                {getInitials(activity.user.name)}
                            </AvatarFallback>
                        </Avatar>
                    )}
                    <span className="text-sm font-medium">
                        {activity.user?.name || 'Someone'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        {activity.type_label}
                    </span>
                </div>

                {/* Description */}
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {activity.description}
                </p>

                {/* Project badge and timestamp */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                    {activity.project && (
                        <Link
                            href={`/projects/${activity.project.id}/lists`}
                            className="inline-flex items-center gap-1.5"
                        >
                            <Badge
                                variant="secondary"
                                className="text-xs hover:bg-accent"
                            >
                                <span
                                    className="mr-1 size-2 rounded-full"
                                    style={{
                                        backgroundColor: activity.project.color,
                                    }}
                                />
                                {activity.project.name}
                            </Badge>
                        </Link>
                    )}
                    <span className="text-xs text-muted-foreground">
                        {activity.created_at_human}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
