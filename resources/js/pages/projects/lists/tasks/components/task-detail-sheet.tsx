import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { complete, move, start } from '@/actions/App/Http/Controllers/Tasks/TaskController';
import { router } from '@inertiajs/react';
import { format, formatDistanceToNow, parseISO, differenceInSeconds } from 'date-fns';
import {
    AlertTriangle,
    ArrowDown,
    ArrowRight,
    ArrowUp,
    Calendar,
    CheckCircle2,
    Minus,
    Pencil,
    Play,
    Square,
    Timer,
    Trash2,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import type { Project, Task, TaskPriority } from '../../lib/types';
import { DeleteTaskDialog } from './delete-task-dialog';
import { EditTaskDialog } from './edit-task-dialog';

interface TaskDetailSheetProps {
    task: Task | null;
    project: Project;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; icon: typeof Minus; color: string; bgColor: string }> = {
    none: { label: 'None', icon: Minus, color: 'text-muted-foreground', bgColor: 'bg-muted/50' },
    low: { label: 'Low', icon: ArrowDown, color: 'text-emerald-600', bgColor: 'bg-emerald-500/10' },
    medium: { label: 'Medium', icon: ArrowRight, color: 'text-amber-600', bgColor: 'bg-amber-500/10' },
    high: { label: 'High', icon: ArrowUp, color: 'text-orange-600', bgColor: 'bg-orange-500/10' },
    urgent: { label: 'Urgent', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-500/10' },
};

export function TaskDetailSheet({ task, project, open, onOpenChange }: TaskDetailSheetProps) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Real-time elapsed timer for in-progress tasks
    useEffect(() => {
        if (!task?.started_at || task?.completed_at) {
            setElapsedTime(0);
            return;
        }

        const startTime = parseISO(task.started_at);
        const updateElapsed = () => {
            setElapsedTime(differenceInSeconds(new Date(), startTime));
        };

        updateElapsed();
        const interval = setInterval(updateElapsed, 1000);

        return () => clearInterval(interval);
    }, [task?.started_at, task?.completed_at]);

    // Format elapsed time as HH:MM:SS
    const formatElapsedTime = useCallback((seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }, []);

    if (!task) return null;

    const currentList = project.lists.find((l) => l.id === task.list_id);

    // Handle orphaned data - task's list was deleted
    if (!currentList && open) {
        onOpenChange(false);
        return null;
    }

    const priorityConfig = PRIORITY_CONFIG[task.priority];
    const PriorityIcon = priorityConfig.icon;

    // Status helpers
    const isCompleted = !!task.completed_at;
    const isInProgress = !!task.started_at && !task.completed_at;
    const isNotStarted = !task.started_at && !task.completed_at;

    const handleToggleComplete = () => {
        setIsProcessing(true);
        router.patch(
            complete({ project, task }).url,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsProcessing(false),
                onError: () => {
                    setIsProcessing(false);
                    onOpenChange(false);
                },
            },
        );
    };

    const handleStartTask = () => {
        if (task.started_at) return;
        setIsProcessing(true);
        router.patch(
            start({ project, task }).url,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsProcessing(false),
                onError: () => {
                    setIsProcessing(false);
                    onOpenChange(false);
                },
            },
        );
    };

    const handleMoveToList = (listId: string) => {
        const newListId = parseInt(listId, 10);
        if (newListId === task.list_id) return;

        setIsProcessing(true);
        router.patch(
            move({ project, task }).url,
            { list_id: newListId },
            {
                preserveScroll: true,
                onFinish: () => setIsProcessing(false),
                onError: () => {
                    setIsProcessing(false);
                    onOpenChange(false);
                },
            },
        );
    };

    const getDueDateInfo = () => {
        if (!task.due_date) return null;

        const dueDate = parseISO(task.due_date);
        const now = new Date();
        const isOverdue = !isCompleted && dueDate < now;
        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isDueSoon = !isCompleted && diffDays <= 1 && diffDays >= 0;

        return {
            formatted: format(dueDate, 'MMM d, yyyy'),
            time: task.due_time ? task.due_time.slice(0, 5) : null,
            isOverdue,
            isDueSoon,
        };
    };

    const dueDateInfo = getDueDateInfo();

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="flex w-full max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                    {/* Header - Clean, minimal */}
                    <SheetHeader className="border-b bg-linear-to-b from-muted/50 to-background px-6 py-5">
                        <div className="flex items-start gap-4">
                            <div className="min-w-0 flex-1 space-y-1">
                                <SheetTitle
                                    className={`text-xl font-semibold leading-tight ${isCompleted ? 'text-muted-foreground line-through' : ''
                                        }`}
                                >
                                    {task.title}
                                </SheetTitle>
                                <SheetDescription className="flex items-center gap-2 text-sm">
                                    <Badge variant="outline" className="gap-1 font-normal">
                                        <div
                                            className="size-2 rounded-full"
                                            style={{ backgroundColor: project.color }}
                                        />
                                        {currentList?.name}
                                    </Badge>
                                    {isCompleted && (
                                        <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-700">
                                            <CheckCircle2 className="size-3" />
                                            Completed
                                        </Badge>
                                    )}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1">
                        <div className="space-y-5 p-6">
                            {/* Timer Section - Bordio style: Prominent when active */}
                            {(isInProgress || isCompleted) && (
                                <div
                                    className={`overflow-hidden rounded-xl ${isInProgress
                                            ? 'bg-linear-to-r from-blue-500/10 via-blue-500/5 to-transparent'
                                            : 'bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-transparent'
                                        }`}
                                >
                                    <div className="p-4">
                                        {/* Active Timer Display */}
                                        {isInProgress && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/30" />
                                                        <div className="relative flex size-10 items-center justify-center rounded-full bg-blue-500 text-white">
                                                            <Timer className="size-5" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium uppercase tracking-wider text-blue-600">
                                                            Time Tracking
                                                        </p>
                                                        <p className="text-2xl font-bold tabular-nums text-blue-700">
                                                            {formatElapsedTime(elapsedTime)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="gap-1.5 bg-blue-500 text-white hover:bg-blue-600"
                                                    onClick={handleToggleComplete}
                                                    disabled={isProcessing}
                                                >
                                                    <Square className="size-3.5 fill-current" />
                                                    Stop
                                                </Button>
                                            </div>
                                        )}

                                        {/* Completed Timer Display */}
                                        {isCompleted && task.started_at && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                                                        <CheckCircle2 className="size-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">
                                                            Total Time
                                                        </p>
                                                        <p className="text-2xl font-bold tabular-nums text-emerald-700">
                                                            {formatElapsedTime(
                                                                differenceInSeconds(
                                                                    parseISO(task.completed_at!),
                                                                    parseISO(task.started_at),
                                                                ),
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700">
                                                    Completed
                                                </Badge>
                                            </div>
                                        )}

                                        {/* Time details */}
                                        <div className="mt-3 flex gap-4 border-t border-current/10 pt-3 text-xs text-muted-foreground">
                                            {task.started_at && (
                                                <div>
                                                    <span className="font-medium">Started:</span>{' '}
                                                    {format(parseISO(task.started_at), 'MMM d, HH:mm')}
                                                </div>
                                            )}
                                            {task.completed_at && (
                                                <div>
                                                    <span className="font-medium">Completed:</span>{' '}
                                                    {format(parseISO(task.completed_at), 'MMM d, HH:mm')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Start Timer Button - Bordio style: Clear CTA when not started */}
                            {isNotStarted && (
                                <Button
                                    onClick={handleStartTask}
                                    disabled={isProcessing}
                                    className="w-full gap-2 bg-linear-to-r from-blue-500 to-blue-600 py-6 text-base font-medium text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-500/30"
                                >
                                    <Play className="size-5 fill-current" />
                                    Start Timer
                                </Button>
                            )}

                            {/* Description - Only if exists */}
                            {task.description && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Description
                                    </h4>
                                    <div className="rounded-lg bg-muted/30 p-4">
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                                            {task.description}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Details - Bordio style: Clean list layout */}
                            <div className="space-y-1">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Details
                                </h4>
                                <div className="divide-y rounded-lg border bg-card">
                                    {/* Priority */}
                                    <div className="flex items-center justify-between p-3">
                                        <span className="text-sm text-muted-foreground">Priority</span>
                                        <Badge
                                            variant="secondary"
                                            className={`gap-1.5 ${priorityConfig.bgColor} ${priorityConfig.color}`}
                                        >
                                            <PriorityIcon className="size-3.5" />
                                            {priorityConfig.label}
                                        </Badge>
                                    </div>

                                    {/* Due Date */}
                                    <div className="flex items-center justify-between p-3">
                                        <span className="text-sm text-muted-foreground">Due Date</span>
                                        {dueDateInfo ? (
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant={dueDateInfo.isOverdue ? 'destructive' : 'secondary'}
                                                    className={
                                                        dueDateInfo.isDueSoon
                                                            ? 'border-amber-500 bg-amber-500/10 text-amber-700'
                                                            : ''
                                                    }
                                                >
                                                    <Calendar className="mr-1.5 size-3" />
                                                    {dueDateInfo.formatted}
                                                    {dueDateInfo.time && (
                                                        <span className="ml-1 opacity-70">• {dueDateInfo.time}</span>
                                                    )}
                                                </Badge>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground/60">Not set</span>
                                        )}
                                    </div>

                                    {/* Assignee */}
                                    <div className="flex items-center justify-between p-3">
                                        <span className="text-sm text-muted-foreground">Assignee</span>
                                        {task.assignee ? (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="size-6 border">
                                                                <AvatarImage src={task.assignee.avatar || undefined} />
                                                                <AvatarFallback className="text-xs font-medium">
                                                                    {task.assignee.name.charAt(0).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-sm font-medium">
                                                                {task.assignee.name}
                                                            </span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{task.assignee.email}</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ) : (
                                            <span className="text-sm text-muted-foreground/60">Unassigned</span>
                                        )}
                                    </div>

                                    {/* List/Status */}
                                    <div className="flex items-center justify-between p-3">
                                        <span className="text-sm text-muted-foreground">List</span>
                                        <Select
                                            value={task.list_id.toString()}
                                            onValueChange={handleMoveToList}
                                            disabled={isProcessing}
                                        >
                                            <SelectTrigger className="h-8 w-auto min-w-35 border-0 bg-muted/50 text-sm font-medium">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {project.lists.map((list) => (
                                                    <SelectItem key={list.id} value={list.id.toString()}>
                                                        {list.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Activity/Metadata - Minimal */}
                            <div className="space-y-1">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Activity
                                </h4>
                                <div className="space-y-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <div className="size-1.5 rounded-full bg-muted-foreground/30" />
                                        Created {formatDistanceToNow(parseISO(task.created_at), { addSuffix: true })}
                                    </div>
                                    {task.updated_at !== task.created_at && (
                                        <div className="flex items-center gap-2">
                                            <div className="size-1.5 rounded-full bg-muted-foreground/30" />
                                            Updated {formatDistanceToNow(parseISO(task.updated_at), { addSuffix: true })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Footer Actions - Bordio style: Simple, clear */}
                    <div className="border-t bg-muted/30 px-6 py-4">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={() => setEditOpen(true)}
                            >
                                <Pencil className="size-4" />
                                Edit Task
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10 hover:text-background-foreground"
                                onClick={() => setDeleteOpen(true)}
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Edit Dialog */}
            <EditTaskDialog
                project={project}
                task={task}
                open={editOpen}
                onOpenChange={setEditOpen}
            />

            {/* Delete Dialog */}
            <DeleteTaskDialog
                project={project}
                task={task}
                open={deleteOpen}
                onOpenChange={(open) => {
                    setDeleteOpen(open);
                    if (!open) onOpenChange(false);
                }}
            />
        </>
    );
}
