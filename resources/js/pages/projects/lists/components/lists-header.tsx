import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { PROJECT_ICONS } from '@/pages/projects/lib/project-icons';
import { index as projectsIndex } from '@/routes/projects';
import { index as membersIndex } from '@/routes/projects/members';
import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    CircleAlert,
    Clock,
    Columns3,
    FolderKanban,
    LayoutList,
    List,
    Table2,
    Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { Permissions, Project, TaskFilter, ViewMode } from '../lib/types';
import { CreateListDialog } from './create-list-dialog';
import { ProjectTrashSheet } from './project-trash-sheet';

interface ListsHeaderProps {
    project: Project;
    permissions: Permissions;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    taskFilter: TaskFilter;
    onTaskFilterChange: (filter: TaskFilter) => void;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    dueSoonTasks: number;
    completedLateTasks: number;
}

function ProjectIconDisplay({
    iconName,
    color,
    className,
}: {
    iconName?: string | null;
    color: string;
    className?: string;
}) {
    const iconData = PROJECT_ICONS.find((i) => i.name === iconName);
    const Icon = iconData?.icon ?? FolderKanban;
    return <Icon className={className} style={{ color }} />;
}

export function ListsHeader({
    project,
    permissions,
    viewMode,
    onViewModeChange,
    taskFilter,
    onTaskFilterChange,
    totalTasks,
    completedTasks,
    overdueTasks,
    dueSoonTasks,
    completedLateTasks,
}: ListsHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="flex items-center gap-3 sm:gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="shrink-0"
                >
                    <Link href={projectsIndex().url}>
                        <ArrowLeft className="size-4" />
                    </Link>
                </Button>
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                        duration: 0.5,
                        type: 'spring',
                        stiffness: 200,
                    }}
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg shadow-lg sm:size-14 sm:rounded-xl"
                    style={{ backgroundColor: `${project.color}20` }}
                >
                    <ProjectIconDisplay
                        iconName={project.icon}
                        color={project.color}
                        className="size-5 sm:size-7"
                    />
                </motion.div>
                <div className="min-w-0">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="truncate text-xl font-bold tracking-tight sm:text-2xl md:text-3xl"
                    >
                        {project.name}
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex items-center gap-2 text-sm text-muted-foreground sm:gap-3"
                    >
                        <span className="flex items-center gap-1">
                            <LayoutList className="size-3.5 sm:size-4" />
                            <span className="xs:inline hidden">
                                {project.lists.length} lists
                            </span>
                            <span className="xs:hidden">
                                {project.lists.length}
                            </span>
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">
                            {completedTasks}/{totalTasks} tasks completed
                        </span>
                    </motion.div>
                </div>
            </div>
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="flex flex-wrap items-center gap-2"
            >
                {/* Task Filters - Using Button group for better visual feedback */}
                <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onTaskFilterChange('all')}
                                className={cn(
                                    'px-2 text-xs sm:px-3 sm:text-sm',
                                    taskFilter === 'all' &&
                                    'bg-primary text-primary-foreground ring-2 ring-primary/30 hover:bg-primary/90 hover:text-primary-foreground',
                                )}
                            >
                                All
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>All Tasks</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onTaskFilterChange('overdue')}
                                className={cn(
                                    'gap-1 px-2 sm:gap-1.5 sm:px-3',
                                    taskFilter === 'overdue' &&
                                    'bg-destructive text-destructive-foreground ring-2 ring-destructive/30 hover:bg-destructive/90 hover:text-destructive-foreground',
                                )}
                            >
                                <AlertTriangle className="size-3 sm:size-3.5" />
                                {overdueTasks > 0 && (
                                    <Badge
                                        variant={
                                            taskFilter === 'overdue'
                                                ? 'secondary'
                                                : 'destructive'
                                        }
                                        className="h-5 min-w-5 px-1.5"
                                    >
                                        {overdueTasks}
                                    </Badge>
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Overdue Tasks</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onTaskFilterChange('due-soon')}
                                className={cn(
                                    'gap-1 px-2 sm:gap-1.5 sm:px-3',
                                    taskFilter === 'due-soon' &&
                                    'bg-amber-500 text-white ring-2 ring-amber-500/30 hover:bg-amber-600 hover:text-white dark:bg-amber-600 dark:hover:bg-amber-700',
                                )}
                            >
                                <Clock className="size-3 sm:size-3.5" />
                                {dueSoonTasks > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            'h-5 min-w-5 px-1.5',
                                            taskFilter === 'due-soon'
                                                ? 'bg-white/20 text-white'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                                        )}
                                    >
                                        {dueSoonTasks}
                                    </Badge>
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Due Within 24 Hours</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onTaskFilterChange('completed')}
                                className={cn(
                                    'gap-1 px-2 sm:gap-1.5 sm:px-3',
                                    taskFilter === 'completed' &&
                                    'bg-emerald-500 text-white ring-2 ring-emerald-500/30 hover:bg-emerald-600 hover:text-white dark:bg-emerald-600 dark:hover:bg-emerald-700',
                                )}
                            >
                                <CheckCircle2 className="size-3 sm:size-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Completed On Time</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    onTaskFilterChange('completed-late')
                                }
                                className={cn(
                                    'gap-1 px-2 sm:gap-1.5 sm:px-3',
                                    taskFilter === 'completed-late' &&
                                    'bg-orange-500 text-white ring-2 ring-orange-500/30 hover:bg-orange-600 hover:text-white dark:bg-orange-600 dark:hover:bg-orange-700',
                                )}
                            >
                                <CircleAlert className="size-3 sm:size-3.5" />
                                {completedLateTasks > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            'h-5 min-w-5 px-1.5',
                                            taskFilter === 'completed-late'
                                                ? 'bg-white/20 text-white'
                                                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                                        )}
                                    >
                                        {completedLateTasks}
                                    </Badge>
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Completed Late</TooltipContent>
                    </Tooltip>
                </div>

                {/* View Mode - Using Button group for better visual feedback */}
                <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewModeChange('board')}
                                className={cn(
                                    'px-2 sm:px-3',
                                    viewMode === 'board' &&
                                    'bg-primary text-primary-foreground ring-2 ring-primary/30 hover:bg-primary/90 hover:text-primary-foreground',
                                )}
                            >
                                <Columns3 className="size-3.5 sm:size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Board View</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewModeChange('list')}
                                className={cn(
                                    'px-2 sm:px-3',
                                    viewMode === 'list' &&
                                    'bg-primary text-primary-foreground ring-2 ring-primary/30 hover:bg-primary/90 hover:text-primary-foreground',
                                )}
                            >
                                <List className="size-3.5 sm:size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>List View</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewModeChange('table')}
                                className={cn(
                                    'px-2 sm:px-3',
                                    viewMode === 'table' &&
                                    'bg-primary text-primary-foreground ring-2 ring-primary/30 hover:bg-primary/90 hover:text-primary-foreground',
                                )}
                            >
                                <Table2 className="size-3.5 sm:size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Table View</TooltipContent>
                    </Tooltip>
                </div>

                {/* Members Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button asChild>
                            <Link href={membersIndex(project).url}>
                                <Users className="size-4" />
                                Members
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {permissions.canManageMembers
                            ? 'Manage Members'
                            : 'View Members'}
                    </TooltipContent>
                </Tooltip>

                {/* Project Trash - Only for editors */}
                {permissions.canEdit && (
                    <ProjectTrashSheet projectId={project.id} />
                )}

                {/* Create List - Only for editors */}
                {permissions.canEdit && (
                    <CreateListDialog
                        project={project}
                        canCreateList={permissions.canCreateList}
                        maxLists={permissions.maxLists}
                        currentLists={permissions.currentLists}
                    />
                )}
            </motion.div>
        </motion.div>
    );
}
