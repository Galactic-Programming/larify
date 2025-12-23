import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { getProjectIcon } from '@/pages/projects/lib/project-icons';
import type { NormalizedTrashItem } from '@/types/trash.d';
import { formatDistanceToNow } from 'date-fns';
import {
    AlertTriangle,
    CheckSquare,
    Clock,
    FolderKanban,
    LayoutList,
    MoreHorizontal,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { createElement, memo, useMemo } from 'react';

// Memoized icon component
const ItemIcon = memo(function ItemIcon({
    type,
    iconName,
    color,
    className,
}: {
    type: 'project' | 'list' | 'task';
    iconName?: string | null;
    color: string;
    className?: string;
}) {
    if (type === 'project') {
        const Icon = getProjectIcon(iconName ?? null);
        return createElement(Icon, { className, style: { color } });
    }
    if (type === 'list') {
        return <LayoutList className={className} style={{ color }} />;
    }
    return <CheckSquare className={className} style={{ color }} />;
});

interface TrashItemCardProps {
    item: NormalizedTrashItem;
    index: number;
    onRestore: (item: NormalizedTrashItem) => void;
    onForceDelete: (item: NormalizedTrashItem) => void;
    isRestoring?: boolean;
    isDeleting?: boolean;
}

export function TrashItemCard({
    item,
    index,
    onRestore,
    onForceDelete,
    isRestoring,
    isDeleting,
}: TrashItemCardProps) {
    const isUrgent = item.daysRemaining <= 2;
    const isProcessing = isRestoring || isDeleting;

    const getTypeLabel = () => {
        switch (item.type) {
            case 'project':
                return 'Project';
            case 'list':
                return 'List';
            case 'task':
                return 'Task';
        }
    };

    const TypeIcon = useMemo(() => {
        switch (item.type) {
            case 'project':
                return FolderKanban;
            case 'list':
                return LayoutList;
            case 'task':
                return CheckSquare;
        }
    }, [item.type]);

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'critical':
                return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
            case 'high':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300';
            case 'medium':
                return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            layout
        >
            <Card
                className={`group relative overflow-hidden transition-all duration-300 hover:shadow-md ${
                    isProcessing ? 'pointer-events-none opacity-50' : ''
                }`}
            >
                {/* Color accent bar */}
                <div
                    className="absolute inset-y-0 left-0 w-1 transition-all duration-300 group-hover:w-1.5"
                    style={{ backgroundColor: item.color }}
                />

                <CardContent className="flex items-center gap-4 p-4 pl-5">
                    {/* Icon */}
                    <div
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110"
                        style={{ backgroundColor: `${item.color}15` }}
                    >
                        <ItemIcon
                            type={item.type}
                            iconName={item.icon}
                            color={item.color}
                            className="size-5"
                        />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="truncate font-medium">
                                {item.title}
                            </h3>
                            <Badge
                                variant="outline"
                                className="shrink-0 gap-1 text-xs"
                            >
                                {createElement(TypeIcon, {
                                    className: 'size-3',
                                })}
                                {getTypeLabel()}
                            </Badge>
                            {item.type === 'task' && item.metadata.priority && (
                                <Badge
                                    className={`shrink-0 text-xs ${getPriorityColor(item.metadata.priority)}`}
                                >
                                    {item.metadata.priority}
                                </Badge>
                            )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            {item.subtitle && (
                                <span className="truncate">
                                    From:{' '}
                                    <span className="font-medium">
                                        {item.subtitle}
                                    </span>
                                </span>
                            )}

                            {item.metadata.listDeleted && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge
                                            variant="destructive"
                                            className="gap-1 text-xs"
                                        >
                                            <AlertTriangle className="size-3" />
                                            List deleted
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Cannot restore until the list is
                                        restored first
                                    </TooltipContent>
                                </Tooltip>
                            )}

                            {item.type === 'project' && (
                                <span className="text-xs">
                                    {item.metadata.listsCount} lists •{' '}
                                    {item.metadata.tasksCount} tasks
                                </span>
                            )}
                            {item.type === 'list' && (
                                <span className="text-xs">
                                    {item.metadata.tasksCount} tasks
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Time remaining */}
                    <div className="hidden flex-col items-end gap-1 sm:flex">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            Deleted{' '}
                            {formatDistanceToNow(new Date(item.deletedAt), {
                                addSuffix: true,
                            })}
                        </div>
                        <Badge
                            variant={isUrgent ? 'destructive' : 'secondary'}
                            className={`gap-1 text-xs ${isUrgent ? 'animate-pulse' : ''}`}
                        >
                            {isUrgent && <AlertTriangle className="size-3" />}
                            {item.daysRemaining} day
                            {item.daysRemaining !== 1 ? 's' : ''} remaining
                        </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onRestore(item)}
                                    disabled={
                                        isProcessing ||
                                        item.metadata.listDeleted
                                    }
                                    className="gap-1.5"
                                >
                                    <RotateCcw className="size-4" />
                                    <span className="hidden sm:inline">
                                        Restore
                                    </span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {item.metadata.listDeleted
                                    ? 'Cannot restore - list is deleted'
                                    : 'Restore this item'}
                            </TooltipContent>
                        </Tooltip>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    disabled={isProcessing}
                                >
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => onRestore(item)}
                                    disabled={item.metadata.listDeleted}
                                >
                                    <RotateCcw className="mr-2 size-4" />
                                    Restore
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => onForceDelete(item)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 size-4" />
                                    Delete Forever
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
