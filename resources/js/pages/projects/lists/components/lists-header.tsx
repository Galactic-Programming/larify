import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { PROJECT_ICONS } from '@/pages/projects/lib/project-icons';
import { index as projectsIndex } from '@/routes/projects';
import { index as membersIndex } from '@/routes/projects/members';
import { Link } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, CheckCircle2, CircleAlert, Clock, Columns3, FolderKanban, LayoutList, List, Table2, Users } from 'lucide-react';
import { motion } from 'motion/react';
import type { Permissions, Project, TaskFilter, ViewMode } from '../lib/types';
import { CreateListDialog } from './create-list-dialog';

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
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={projectsIndex().url}>
                        <ArrowLeft className="size-4" />
                    </Link>
                </Button>
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                    className="flex size-14 items-center justify-center rounded-xl shadow-lg"
                    style={{ backgroundColor: `${project.color}20` }}
                >
                    <ProjectIconDisplay iconName={project.icon} color={project.color} className="size-7" />
                </motion.div>
                <div>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-2xl font-bold tracking-tight md:text-3xl"
                    >
                        {project.name}
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex items-center gap-3 text-muted-foreground"
                    >
                        <span className="flex items-center gap-1">
                            <LayoutList className="size-4" />
                            {project.lists.length} lists
                        </span>
                        <span>•</span>
                        <span>
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
                {/* Task Filters */}
                <ToggleGroup
                    type="single"
                    value={taskFilter}
                    onValueChange={(value) => value && onTaskFilterChange(value as TaskFilter)}
                    className="bg-muted rounded-lg p-1"
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem value="all" aria-label="All tasks" className="px-3">
                                All
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>All Tasks</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem value="overdue" aria-label="Overdue tasks" className="gap-1.5 px-3">
                                <AlertTriangle className="size-3.5" />
                                {overdueTasks > 0 && (
                                    <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
                                        {overdueTasks}
                                    </Badge>
                                )}
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>Overdue Tasks</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem value="due-soon" aria-label="Due soon" className="gap-1.5 px-3">
                                <Clock className="size-3.5" />
                                {dueSoonTasks > 0 && (
                                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 h-5 min-w-5 px-1.5">
                                        {dueSoonTasks}
                                    </Badge>
                                )}
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>Due Within 24 Hours</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem value="completed" aria-label="Completed tasks" className="gap-1.5 px-3">
                                <CheckCircle2 className="size-3.5" />
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>Completed On Time</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem value="completed-late" aria-label="Completed late tasks" className="gap-1.5 px-3">
                                <CircleAlert className="size-3.5" />
                                {completedLateTasks > 0 && (
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 h-5 min-w-5 px-1.5">
                                        {completedLateTasks}
                                    </Badge>
                                )}
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>Completed Late</TooltipContent>
                    </Tooltip>
                </ToggleGroup>

                {/* View Mode */}
                <ToggleGroup
                    type="single"
                    value={viewMode}
                    onValueChange={(value) => value && onViewModeChange(value as ViewMode)}
                    className="bg-muted rounded-lg p-1"
                >
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem value="board" aria-label="Board view" className="px-3">
                                <Columns3 className="size-4" />
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>Board View</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem value="list" aria-label="List view" className="px-3">
                                <List className="size-4" />
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>List View</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <ToggleGroupItem value="table" aria-label="Table view" className="px-3">
                                <Table2 className="size-4" />
                            </ToggleGroupItem>
                        </TooltipTrigger>
                        <TooltipContent>Table View</TooltipContent>
                    </Tooltip>
                </ToggleGroup>

                {/* Members Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" asChild className="gap-2">
                            <Link href={membersIndex(project).url}>
                                <Users className="size-4" />
                                <span className="hidden sm:inline">Members</span>
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Manage Members</TooltipContent>
                </Tooltip>

                {/* Create List - Only for editors */}
                {permissions.canEdit && <CreateListDialog project={project} />}
            </motion.div>
        </motion.div>
    );
}
