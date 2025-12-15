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
import { complete } from '@/actions/App/Http/Controllers/Tasks/TaskController';
import { router } from '@inertiajs/react';
import { Check, MoreHorizontal, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import type { Task } from '../../lib/types';
import { getPriorityColor, getTaskStatusIcon } from '../../lib/utils';
import { DeleteTaskDialog } from './delete-task-dialog';
import { EditTaskDialog } from './edit-task-dialog';

interface Project {
    id: number;
    name: string;
    color: string;
}

interface TaskCardProps {
    task: Task;
    project: Project;
    index?: number;
    variant?: 'board' | 'list';
    onClick?: (task: Task) => void;
}

export function TaskCard({ task, project, index = 0, variant = 'board', onClick }: TaskCardProps) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const isCompleted = !!task.completed_at;

    const handleToggleComplete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsProcessing(true);
        router.patch(
            complete({ project, task }).url,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsProcessing(false),
            },
        );
    };

    const taskActions = (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreHorizontal className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil className="mr-2 size-4" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleComplete} disabled={isProcessing}>
                    {isCompleted ? (
                        <>
                            <RotateCcw className="mr-2 size-4" />
                            Mark as Incomplete
                        </>
                    ) : (
                        <>
                            <Check className="mr-2 size-4" />
                            Mark as Complete
                        </>
                    )}
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
    );

    const dialogs = (
        <>
            <EditTaskDialog project={project} task={task} open={editOpen} onOpenChange={setEditOpen} />
            <DeleteTaskDialog project={project} task={task} open={deleteOpen} onOpenChange={setDeleteOpen} />
        </>
    );

    if (variant === 'list') {
        return (
            <>
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className="group flex cursor-pointer items-center gap-3 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                    onClick={() => onClick?.(task)}
                >
                    <div className="shrink-0">{getTaskStatusIcon(task)}</div>
                    <div className="min-w-0 flex-1">
                        <p
                            className={`text-sm font-medium ${task.completed_at ? 'text-muted-foreground line-through' : ''}`}
                        >
                            {task.title}
                        </p>
                        {task.description && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{task.description}</p>
                        )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {task.due_date && (
                            <Badge variant="outline" className="text-xs">
                                {new Date(task.due_date).toLocaleDateString()}
                            </Badge>
                        )}
                        <Badge variant="secondary" className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                        </Badge>
                        {taskActions}
                    </div>
                </motion.div>
                {dialogs}
            </>
        );
    }

    // Board variant (default)
    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                onClick={() => onClick?.(task)}
            >
                <Card className="group cursor-pointer bg-card transition-all hover:shadow-md">
                    <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5 shrink-0">{getTaskStatusIcon(task)}</div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <p
                                        className={`text-sm font-medium ${task.completed_at ? 'text-muted-foreground line-through' : ''}`}
                                    >
                                        {task.title}
                                    </p>
                                    {taskActions}
                                </div>
                                {task.description && (
                                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
                                )}
                                <div className="mt-2 flex items-center gap-2">
                                    {task.due_date && (
                                        <Badge variant="outline" className="text-xs">
                                            {new Date(task.due_date).toLocaleDateString()}
                                        </Badge>
                                    )}
                                    <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                        {task.priority}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
            {dialogs}
        </>
    );
}
