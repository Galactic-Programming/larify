import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTaskRealtime } from '@/hooks/use-task-realtime';
import { Circle, Clock, MoreHorizontal, Pencil, Plus, Trash2, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useCallback } from 'react';
import type { Project, Task, TaskList } from '../../lib/types';
import { getPriorityColor, getTaskStatusIcon } from '../../lib/utils';
import { CreateTaskDialog } from '../../tasks/components/create-task-dialog';
import { DeleteTaskDialog } from '../../tasks/components/delete-task-dialog';
import { EditTaskDialog } from '../../tasks/components/edit-task-dialog';
import { TaskDetailSheet } from '../../tasks/components/task-detail-sheet';
import { CreateListDialog } from '../create-list-dialog';
import { ListDropdownMenu } from '../list-dropdown-menu';

interface TableViewProps {
    project: Project;
    onEditList: (list: TaskList) => void;
    onDeleteList: (list: TaskList) => void;
}

function TaskRowActions({ project, task }: { project: Project; task: Task }) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    return (
        // Stop propagation to prevent row click from opening task detail sheet
        <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Pencil className="mr-2 size-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteOpen(true)}
                    >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <EditTaskDialog project={project} task={task} open={editOpen} onOpenChange={setEditOpen} />
            <DeleteTaskDialog project={project} task={task} open={deleteOpen} onOpenChange={setDeleteOpen} />
        </div>
    );
}

export function TableView({ project, onEditList, onDeleteList }: TableViewProps) {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Handle task deletion from real-time updates - close sheet if viewing deleted task
    const handleTaskDeleted = useCallback((taskId: number) => {
        if (selectedTask?.id === taskId) {
            setSelectedTask(null);
        }
    }, [selectedTask?.id]);

    // Real-time updates with task deletion handler
    useTaskRealtime({
        projectId: project.id,
        autoRefresh: true,
        onTaskDeleted: handleTaskDeleted,
    });

    return (
        <>
            <ScrollArea className="flex-1">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-lg border bg-card"
                >
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-10"></TableHead>
                                <TableHead>Task</TableHead>
                                <TableHead className="w-32">Status</TableHead>
                                <TableHead className="w-24">Priority</TableHead>
                                <TableHead className="w-36">Due Date</TableHead>
                                <TableHead className="w-32">Assignee</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {project.lists.flatMap((list) =>
                                list.tasks.map((task) => (
                                    <TableRow
                                        key={task.id}
                                        className="group cursor-pointer"
                                        onClick={() => setSelectedTask(task)}
                                    >
                                        <TableCell className="pr-0">{getTaskStatusIcon(task)}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span
                                                    className={`font-medium ${task.completed_at ? 'text-muted-foreground line-through' : ''}`}
                                                >
                                                    {task.title}
                                                </span>
                                                {task.description && (
                                                    <span className="line-clamp-1 text-xs text-muted-foreground">
                                                        {task.description}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="gap-1.5 font-normal">
                                                <div
                                                    className="size-2 rounded-full"
                                                    style={{ backgroundColor: project.color }}
                                                />
                                                {list.name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {task.priority !== 'none' ? (
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-xs ${getPriorityColor(task.priority)}`}
                                                >
                                                    {task.priority}
                                                </Badge>
                                            ) : (
                                                <span className="text-sm text-muted-foreground/50">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {task.due_date ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                            <span>{new Date(task.due_date).toLocaleDateString()}</span>
                                                            {task.due_time && (
                                                                <span className="flex items-center gap-0.5 text-xs">
                                                                    <Clock className="size-3" />
                                                                    {task.due_time.slice(0, 5)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {new Date(task.due_date).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        })}
                                                        {task.due_time && ` at ${task.due_time.slice(0, 5)}`}
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : (
                                                <span className="text-sm text-muted-foreground/50">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {task.assignee ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="size-6">
                                                                <AvatarImage src={task.assignee.avatar ?? undefined} />
                                                                <AvatarFallback className="text-xs">
                                                                    {task.assignee.name.charAt(0).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="truncate text-sm">{task.assignee.name}</span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{task.assignee.email}</TooltipContent>
                                                </Tooltip>
                                            ) : (
                                                <div className="flex items-center gap-2 text-muted-foreground/50">
                                                    <User className="size-4" />
                                                    <span className="text-sm">Unassigned</span>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <TaskRowActions project={project} task={task} />
                                        </TableCell>
                                    </TableRow>
                                )),
                            )}
                            {project.lists.every((list) => list.tasks.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Circle className="size-8 text-muted-foreground/30" />
                                            <p className="text-sm text-muted-foreground">No tasks yet</p>
                                            {project.lists.length > 0 && (
                                                <CreateTaskDialog
                                                    project={project}
                                                    list={project.lists[0]}
                                                    trigger={
                                                        <Button variant="outline" size="sm" className="mt-2 gap-1">
                                                            <Plus className="size-3" />
                                                            Add first task
                                                        </Button>
                                                    }
                                                />
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </motion.div>

                {/* Lists summary and add button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="mt-4 flex items-center justify-between rounded-lg border bg-muted/30 p-4"
                >
                    <div className="flex flex-wrap gap-2">
                        {project.lists.map((list) => (
                            <div key={list.id} className="flex items-center gap-2">
                                <Badge variant="outline" className="gap-1.5">
                                    <div
                                        className="size-2 rounded-full"
                                        style={{ backgroundColor: project.color }}
                                    />
                                    {list.name}
                                    <span className="text-muted-foreground">({list.tasks.length})</span>
                                </Badge>
                                <CreateTaskDialog
                                    project={project}
                                    list={list}
                                    trigger={
                                        <Button variant="ghost" size="icon-sm" className="size-5">
                                            <Plus className="size-3" />
                                        </Button>
                                    }
                                />
                                <ListDropdownMenu
                                    project={project}
                                    list={list}
                                    onEdit={onEditList}
                                    onDelete={onDeleteList}
                                    triggerClassName="size-5"
                                />
                            </div>
                        ))}
                    </div>
                    <CreateListDialog project={project} />
                </motion.div>
            </ScrollArea>

            {/* Task Detail Sheet */}
            <TaskDetailSheet
                task={selectedTask}
                project={project}
                open={!!selectedTask}
                onOpenChange={(open) => !open && setSelectedTask(null)}
            />
        </>
    );
}
