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
import { getPriorityColor, getTaskStatusIcon, isCompletedLate, isTaskOverdue } from '../../lib/utils';
import { DeleteTaskDialog } from './delete-task-dialog';
import { EditTaskDialog } from './edit-task-dialog';
import { ReopenTaskDialog } from './reopen-task-dialog';

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
    const [reopenOpen, setReopenOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const isCompleted = !!task.completed_at;
    const isOverdue = isTaskOverdue(task);
    const completedLate = isCompletedLate(task);

    // Check if task was overdue when completed (for reopen check)
    const wasOverdueWhenCompleted = (() => {
        if (!isCompleted) return false;
        const dateOnly = task.due_date.split('T')[0];
        const deadline = new Date(`${dateOnly}T${task.due_time}`);
        return new Date() > deadline;
    })();

    const handleToggleComplete = (e: React.MouseEvent) => {
        e.stopPropagation();

        // If trying to reopen an overdue task, show reopen dialog instead
        if (isCompleted && wasOverdueWhenCompleted) {
            setReopenOpen(true);
            return;
        }

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
            <ReopenTaskDialog project={project} task={task} open={reopenOpen} onOpenChange={setReopenOpen} />
        </>
    );

    if (variant === 'list') {
        return (
            <>
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                    className={`group flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${isOverdue
                            ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20'
                            : completedLate
                                ? 'border-orange-200 bg-orange-50/30 dark:border-orange-900/50 dark:bg-orange-950/20'
                                : 'bg-muted/30'
                        }`}
                    onClick={() => onClick?.(task)}
                >
                    <div className="shrink-0">{getTaskStatusIcon(task)}</div>
                    <div className="min-w-0 flex-1">
                        <p
                            className={`truncate text-sm font-medium ${task.completed_at ? 'text-muted-foreground line-through' : ''}`}
                            title={task.title}
                        >
                            {task.title}
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {completedLate && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 text-xs">
                                Late
                            </Badge>
                        )}
                        {task.due_date && !completedLate && (
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
                <Card className={`group cursor-pointer transition-all hover:shadow-md ${isOverdue
                        ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20'
                        : completedLate
                            ? 'border-orange-200 bg-orange-50/30 dark:border-orange-900/50 dark:bg-orange-950/20'
                            : 'bg-card'
                    }`}>
                    <CardContent className="px-2.5 py-2">
                        <div className="flex items-center gap-2">
                            <div className="shrink-0">{getTaskStatusIcon(task)}</div>
                            <div className="min-w-0 flex-1">
                                <p
                                    className={`truncate text-sm font-medium ${task.completed_at ? 'text-muted-foreground line-through' : ''}`}
                                    title={task.title}
                                >
                                    {task.title}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                                {completedLate && (
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 text-[10px] px-1.5 py-0">
                                        Late
                                    </Badge>
                                )}
                                {task.due_date && !completedLate && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                        {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </Badge>
                                )}
                                {task.priority !== 'none' && (
                                    <span className={`text-[10px] font-medium uppercase ${getPriorityColor(task.priority)}`}>
                                        {task.priority.charAt(0)}
                                    </span>
                                )}
                                {taskActions}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
            {dialogs}
        </>
    );
}
