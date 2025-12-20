import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
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

interface ActivityItemProps {
    activity: Activity;
}

// Map activity type icons
const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
    'task.created': <PlusCircle className="size-4 text-green-500" />,
    'task.updated': <Pencil className="size-4 text-blue-500" />,
    'task.completed': <CheckCircle className="size-4 text-green-500" />,
    'task.reopened': <RotateCcw className="size-4 text-yellow-500" />,
    'task.deleted': <Trash className="size-4 text-red-500" />,
    'task.assigned': <UserPlus className="size-4 text-blue-500" />,
    'task.moved': <Move className="size-4 text-purple-500" />,
    'project.created': <FolderPlus className="size-4 text-green-500" />,
    'project.updated': <FolderEdit className="size-4 text-blue-500" />,
    'project.archived': <Archive className="size-4 text-orange-500" />,
    'project.restored': <ArchiveRestore className="size-4 text-green-500" />,
    'member.added': <UserPlus className="size-4 text-green-500" />,
    'member.removed': <UserMinus className="size-4 text-red-500" />,
    'member.role_changed': <Shield className="size-4 text-indigo-500" />,
    'list.created': <ListPlus className="size-4 text-green-500" />,
    'list.updated': <List className="size-4 text-blue-500" />,
    'list.deleted': <Trash className="size-4 text-red-500" />,
    'list.reordered': <Move className="size-4 text-purple-500" />,
};

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function ActivityItem({ activity }: ActivityItemProps) {
    const icon = ACTIVITY_ICONS[activity.type] || <PlusCircle className="size-4 text-muted-foreground" />;

    return (
        <div className="flex items-start gap-3 py-3">
            {/* Timeline indicator */}
            <div className="relative flex flex-col items-center">
                <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                    {icon}
                </div>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pb-4">
                <div className="flex items-center gap-2">
                    {activity.user && (
                        <Avatar className="size-6">
                            {activity.user.avatar && (
                                <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
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

                {/* Description with subject */}
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {activity.description}
                </p>

                {/* Project badge and timestamp */}
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    {activity.project && (
                        <Link
                            href={`/projects/${activity.project.id}/lists`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 hover:bg-accent"
                        >
                            <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: activity.project.color }}
                            />
                            {activity.project.name}
                        </Link>
                    )}
                    <span>{activity.created_at_human}</span>
                </div>
            </div>
        </div>
    );
}
