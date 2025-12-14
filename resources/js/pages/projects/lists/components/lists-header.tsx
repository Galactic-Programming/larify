import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PROJECT_ICONS } from '@/pages/projects/lib/project-icons';
import { index as projectsIndex } from '@/routes/projects';
import { Link } from '@inertiajs/react';
import { ArrowLeft, Columns3, FolderKanban, LayoutList, List, Table2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { Project, ViewMode } from '../lib/types';
import { CreateListDialog } from './create-list-dialog';

interface ListsHeaderProps {
    project: Project;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    totalTasks: number;
    completedTasks: number;
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
    viewMode,
    onViewModeChange,
    totalTasks,
    completedTasks,
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
                className="flex items-center gap-2"
            >
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
                <CreateListDialog project={project} />
            </motion.div>
        </motion.div>
    );
}
