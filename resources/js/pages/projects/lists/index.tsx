import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { PROJECT_ICONS } from '@/pages/projects/lib/project-icons';
import { index as projectsIndex, show as projectShow } from '@/routes/projects';
import { index as listsIndex } from '@/actions/App/Http/Controllers/TaskLists/TaskListController';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    Clock,
    Columns3,
    FolderKanban,
    LayoutList,
    List,
    MoreHorizontal,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { CreateListDialog } from './components/create-list-dialog';
import { EditListDialog } from './components/edit-list-dialog';
import { DeleteListDialog } from './components/delete-list-dialog';

// View mode type
type ViewMode = 'board' | 'list';

// Helper component to render project icon
function ProjectIconDisplay({ iconName, color, className }: { iconName?: string | null; color: string; className?: string }) {
    const iconData = PROJECT_ICONS.find((i) => i.name === iconName);
    const Icon = iconData?.icon ?? FolderKanban;
    return <Icon className={className} style={{ color }} />;
}

// Types
interface Task {
    id: number;
    list_id: number;
    title: string;
    description: string | null;
    position: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date: string | null;
    due_time: string | null;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

interface TaskList {
    id: number;
    project_id: number;
    name: string;
    position: number;
    tasks_count: number;
    tasks: Task[];
    created_at: string;
    updated_at: string;
}

interface Project {
    id: number;
    user_id: number;
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
    is_archived: boolean;
    lists: TaskList[];
    created_at: string;
    updated_at: string;
}

interface Props {
    project: Project;
}

const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
        case 'urgent':
            return 'text-red-500';
        case 'high':
            return 'text-orange-500';
        case 'medium':
            return 'text-yellow-500';
        case 'low':
        default:
            return 'text-slate-400';
    }
};

const getTaskStatusIcon = (task: Task) => {
    if (task.completed_at) {
        return <CheckCircle2 className="size-4 text-green-500" />;
    }
    if (task.started_at) {
        return <Clock className="size-4 text-blue-500" />;
    }
    return <Circle className="size-4 text-muted-foreground" />;
};

export default function ListsIndex({ project }: Props) {
    const [viewMode, setViewMode] = useState<ViewMode>('board');
    const [editingList, setEditingList] = useState<TaskList | null>(null);
    const [deletingList, setDeletingList] = useState<TaskList | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: projectsIndex().url },
        { title: project.name, href: projectShow(project).url },
        { title: 'Lists', href: listsIndex(project).url },
    ];

    const totalTasks = project.lists.reduce((sum, list) => sum + list.tasks.length, 0);
    const completedTasks = project.lists.reduce(
        (sum, list) => sum + list.tasks.filter((t) => t.completed_at).length,
        0,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${project.name} - Lists`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
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
                            onValueChange={(value) => value && setViewMode(value as ViewMode)}
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
                        </ToggleGroup>
                        <CreateListDialog project={project} />
                    </motion.div>
                </motion.div>

                {/* Content based on view mode */}
                {project.lists.length > 0 ? (
                    viewMode === 'board' ? (
                        // Board View (Kanban)
                        <ScrollArea className="flex-1 pb-4">
                            <div className="flex gap-4 pb-4">
                            {project.lists.map((list, listIdx) => (
                                <motion.div
                                    key={list.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: listIdx * 0.1 }}
                                    className="w-80 shrink-0"
                                >
                                    <Card className="flex h-fit max-h-[calc(100vh-280px)] flex-col bg-muted/30">
                                        {/* List Header */}
                                        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="size-3 rounded-full"
                                                    style={{ backgroundColor: project.color }}
                                                />
                                                <CardTitle className="text-base font-semibold">
                                                    {list.name}
                                                </CardTitle>
                                                <Badge variant="secondary" className="ml-1">
                                                    {list.tasks.length}
                                                </Badge>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon-sm">
                                                        <MoreHorizontal className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setEditingList(list)}>
                                                        <Pencil className="mr-2 size-4" />
                                                        Edit List
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setDeletingList(list)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 size-4" />
                                                        Delete List
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </CardHeader>

                                        {/* Tasks */}
                                        <CardContent className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
                                            {list.tasks.length > 0 ? (
                                                list.tasks.map((task, taskIdx) => (
                                                    <motion.div
                                                        key={task.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.2, delay: taskIdx * 0.05 }}
                                                    >
                                                        <Card className="group cursor-pointer bg-card transition-all hover:shadow-md">
                                                            <CardContent className="p-3">
                                                                <div className="flex items-start gap-2">
                                                                    <div className="mt-0.5 shrink-0">
                                                                        {getTaskStatusIcon(task)}
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p
                                                                            className={`text-sm font-medium ${task.completed_at ? 'text-muted-foreground line-through' : ''}`}
                                                                        >
                                                                            {task.title}
                                                                        </p>
                                                                        {task.description && (
                                                                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                                                {task.description}
                                                                            </p>
                                                                        )}
                                                                        <div className="mt-2 flex items-center gap-2">
                                                                            {task.due_date && (
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className="text-xs"
                                                                                >
                                                                                    {new Date(
                                                                                        task.due_date,
                                                                                    ).toLocaleDateString()}
                                                                                </Badge>
                                                                            )}
                                                                            <span
                                                                                className={`text-xs font-medium ${getPriorityColor(task.priority)}`}
                                                                            >
                                                                                {task.priority}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                                                    <Circle className="mb-2 size-8 text-muted-foreground/50" />
                                                    <p className="text-sm text-muted-foreground">No tasks yet</p>
                                                    <Button variant="ghost" size="sm" className="mt-2 gap-1">
                                                        <Plus className="size-3" />
                                                        Add task
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Add Task Button */}
                                            {list.tasks.length > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                                                >
                                                    <Plus className="size-4" />
                                                    Add task
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}

                            {/* Add List Card */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: project.lists.length * 0.1 }}
                                className="w-80 shrink-0"
                            >
                                <CreateListDialog
                                    project={project}
                                    trigger={
                                        <Card className="flex h-32 cursor-pointer items-center justify-center border-dashed bg-muted/20 transition-all hover:border-primary hover:bg-muted/40">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Plus className="size-8" />
                                                <span className="font-medium">Add new list</span>
                                            </div>
                                        </Card>
                                    }
                                />
                            </motion.div>
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                    ) : (
                        // List View (Accordion)
                        <ScrollArea className="flex-1">
                            <div className="mx-auto max-w-4xl space-y-4">
                                <Accordion
                                    type="multiple"
                                    defaultValue={project.lists.map((list) => `list-${list.id}`)}
                                    className="space-y-4"
                                >
                                    {project.lists.map((list, listIdx) => (
                                        <motion.div
                                            key={list.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: listIdx * 0.1 }}
                                        >
                                            <AccordionItem
                                                value={`list-${list.id}`}
                                                className="rounded-lg border bg-card px-0"
                                            >
                                                <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]>div>.chevron]:rotate-180">
                                                    <div className="flex flex-1 items-center justify-between pr-2">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="size-3 rounded-full"
                                                                style={{ backgroundColor: project.color }}
                                                            />
                                                            <span className="text-base font-semibold">{list.name}</span>
                                                            <Badge variant="secondary">{list.tasks.length}</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="text-xs">
                                                                {list.tasks.filter((t) => t.completed_at).length}/
                                                                {list.tasks.length} done
                                                            </Badge>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon-sm"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <MoreHorizontal className="size-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => setEditingList(list)}>
                                                                        <Pencil className="mr-2 size-4" />
                                                                        Edit List
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => setDeletingList(list)}
                                                                        className="text-destructive focus:text-destructive"
                                                                    >
                                                                        <Trash2 className="mr-2 size-4" />
                                                                        Delete List
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="px-4 pb-4 pt-0">
                                                    {list.tasks.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {list.tasks.map((task, taskIdx) => (
                                                                <motion.div
                                                                    key={task.id}
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    transition={{ duration: 0.2, delay: taskIdx * 0.03 }}
                                                                    className="group flex items-center gap-3 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                                                                >
                                                                    <div className="shrink-0">{getTaskStatusIcon(task)}</div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p
                                                                            className={`text-sm font-medium ${task.completed_at ? 'text-muted-foreground line-through' : ''}`}
                                                                        >
                                                                            {task.title}
                                                                        </p>
                                                                        {task.description && (
                                                                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                                                                {task.description}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex shrink-0 items-center gap-2">
                                                                        {task.due_date && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                {new Date(task.due_date).toLocaleDateString()}
                                                                            </Badge>
                                                                        )}
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className={`text-xs ${getPriorityColor(task.priority)}`}
                                                                        >
                                                                            {task.priority}
                                                                        </Badge>
                                                                    </div>
                                                                </motion.div>
                                                            ))}
                                                            <Button
                                                                variant="ghost"
                                                                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                                                            >
                                                                <Plus className="size-4" />
                                                                Add task
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-6 text-center">
                                                            <Circle className="mb-2 size-6 text-muted-foreground/50" />
                                                            <p className="text-sm text-muted-foreground">No tasks in this list</p>
                                                            <Button variant="ghost" size="sm" className="mt-2 gap-1">
                                                                <Plus className="size-3" />
                                                                Add task
                                                            </Button>
                                                        </div>
                                                    )}
                                                </AccordionContent>
                                            </AccordionItem>
                                        </motion.div>
                                    ))}
                                </Accordion>

                                {/* Add new list button at bottom */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: project.lists.length * 0.1 }}
                                >
                                    <CreateListDialog
                                        project={project}
                                        trigger={
                                            <Card className="flex cursor-pointer items-center justify-center border-dashed bg-muted/20 py-6 transition-all hover:border-primary hover:bg-muted/40">
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Plus className="size-5" />
                                                    <span className="font-medium">Add new list</span>
                                                </div>
                                            </Card>
                                        }
                                    />
                                </motion.div>
                            </div>
                        </ScrollArea>
                    )
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="flex flex-1 items-center justify-center"
                    >
                        <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-20 px-8">
                            <div className="relative mb-6">
                                <div
                                    className="flex size-24 items-center justify-center rounded-2xl shadow-xl"
                                    style={{ backgroundColor: `${project.color}20` }}
                                >
                                    <LayoutList className="size-12" style={{ color: project.color }} />
                                </div>
                                <div
                                    className="absolute -top-2 -right-2 flex size-8 animate-bounce items-center justify-center rounded-full text-white shadow-lg"
                                    style={{ backgroundColor: project.color }}
                                >
                                    <Plus className="size-4" />
                                </div>
                            </div>
                            <h3 className="mb-2 text-xl font-semibold">No lists yet</h3>
                            <p className="mb-6 max-w-sm text-center text-muted-foreground">
                                Create your first list to start organizing tasks in this project.
                            </p>
                            <CreateListDialog
                                project={project}
                                trigger={
                                    <Button
                                        size="lg"
                                        className="gap-2 shadow-lg transition-all duration-300 hover:shadow-xl"
                                        style={{
                                            backgroundColor: project.color,
                                            boxShadow: `0 10px 15px -3px ${project.color}40`,
                                        }}
                                    >
                                        <Plus className="size-4" />
                                        Create your first list
                                    </Button>
                                }
                            />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Edit List Dialog */}
            {editingList && (
                <EditListDialog
                    project={project}
                    list={editingList}
                    open={!!editingList}
                    onOpenChange={(open: boolean) => !open && setEditingList(null)}
                />
            )}

            {/* Delete List Dialog */}
            {deletingList && (
                <DeleteListDialog
                    project={project}
                    list={deletingList}
                    open={!!deletingList}
                    onOpenChange={(open: boolean) => !open && setDeletingList(null)}
                />
            )}
        </AppLayout>
    );
}
