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
import { complete, move } from '@/actions/App/Http/Controllers/Tasks/TaskController';
import { router } from '@inertiajs/react';
import { format, parseISO, differenceInSeconds } from 'date-fns';
import {
    AlertTriangle,
    ArrowDown,
    ArrowRight,
    ArrowUp,
    Calendar,
    CheckCircle2,
    CircleAlert,
    Clock,
    Minus,
    Pencil,
    Trash2,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import type { Project, Task, TaskPriority } from '../../lib/types';
import { isCompletedLate, getTaskDeadline } from '../../lib/utils';
import { DeleteTaskDialog } from './delete-task-dialog';
import { EditTaskDialog } from './edit-task-dialog';
import { ReopenTaskDialog } from './reopen-task-dialog';

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
    const [reopenOpen, setReopenOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);

    // Real-time countdown to deadline
    useEffect(() => {
        if (!task?.due_date || !task?.due_time || task?.completed_at) {
            setTimeRemaining(0);
            return;
        }

        // Parse due_date (handle both ISO format and date-only format)
        const dateOnly = task.due_date.split('T')[0];
        const deadline = new Date(`${dateOnly}T${task.due_time}`);

        const updateRemaining = () => {
            const remaining = differenceInSeconds(deadline, new Date());
            setTimeRemaining(remaining);
        };

        updateRemaining();
        const interval = setInterval(updateRemaining, 1000);

        return () => clearInterval(interval);
    }, [task?.due_date, task?.due_time, task?.completed_at]);

    // Format time as HH:MM:SS
    const formatTimeHHMMSS = useCallback((seconds: number) => {
        const isNegative = seconds < 0;
        const absSeconds = Math.abs(seconds);

        const hours = Math.floor(absSeconds / 3600);
        const minutes = Math.floor((absSeconds % 3600) / 60);
        const secs = absSeconds % 60;

        const formatted = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        return isNegative ? `-${formatted}` : formatted;
    }, []);

    // Format time as human readable
    const formatTimeHumanReadable = useCallback((seconds: number) => {
        const isNegative = seconds < 0;
        const absSeconds = Math.abs(seconds);

        const days = Math.floor(absSeconds / 86400);
        const hours = Math.floor((absSeconds % 86400) / 3600);
        const minutes = Math.floor((absSeconds % 3600) / 60);

        const parts: string[] = [];
        if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
        if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
        if (minutes > 0 && days === 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);

        if (parts.length === 0) {
            if (absSeconds < 60) {
                return isNegative ? 'Just overdue' : 'Less than a minute';
            }
        }

        const timeStr = parts.join(', ');
        return isNegative ? `${timeStr} overdue` : `${timeStr} left`;
    }, []);

    // Get urgency level for styling
    const getUrgencyLevel = useCallback((seconds: number) => {
        if (seconds < 0) return 'overdue';
        if (seconds < 3600) return 'urgent'; // < 1 hour
        if (seconds < 86400) return 'warning'; // < 24 hours
        return 'normal';
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
    const isOverdue = timeRemaining < 0 && !isCompleted;
    const completedLate = isCompletedLate(task);
    const urgencyLevel = getUrgencyLevel(timeRemaining);

    // Calculate how late the task was completed
    const getLateBySeconds = (): number => {
        if (!completedLate || !task.completed_at) return 0;
        const deadline = getTaskDeadline(task);
        const completedAt = new Date(task.completed_at);
        return Math.floor((completedAt.getTime() - deadline.getTime()) / 1000);
    };

    const lateBySeconds = getLateBySeconds();

    // Check if task was overdue when completed (for reopen check)
    const wasOverdueWhenCompleted = (() => {
        if (!isCompleted) return false;
        const dateOnly = task.due_date.split('T')[0];
        const deadline = new Date(`${dateOnly}T${task.due_time}`);
        return new Date() > deadline;
    })();

    const handleToggleComplete = () => {
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
                preserveState: false,
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

    const getDeadlineDisplay = () => {
        // Parse due_date (handle both ISO format and date-only format)
        const dateOnly = task.due_date.split('T')[0];
        const deadline = new Date(`${dateOnly}T${task.due_time}`);
        return {
            date: format(deadline, 'MMM d, yyyy'),
            time: task.due_time.slice(0, 5),
        };
    };

    const deadlineDisplay = getDeadlineDisplay();

    // Get countdown section styling based on urgency
    const getCountdownStyles = () => {
        if (isCompleted) {
            // Completed late - orange styling
            if (completedLate) {
                return {
                    bg: 'bg-linear-to-r from-orange-500/10 via-orange-500/5 to-transparent',
                    iconBg: 'bg-orange-500',
                    textPrimary: 'text-orange-700 dark:text-orange-400',
                    textSecondary: 'text-orange-600 dark:text-orange-500',
                };
            }
            // Completed on time - green styling
            return {
                bg: 'bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-transparent',
                iconBg: 'bg-emerald-500',
                textPrimary: 'text-emerald-700 dark:text-emerald-400',
                textSecondary: 'text-emerald-600 dark:text-emerald-500',
            };
        }
        switch (urgencyLevel) {
            case 'overdue':
                return {
                    bg: 'bg-linear-to-r from-red-500/10 via-red-500/5 to-transparent',
                    iconBg: 'bg-red-500',
                    textPrimary: 'text-red-700 dark:text-red-400',
                    textSecondary: 'text-red-600 dark:text-red-500',
                };
            case 'urgent':
                return {
                    bg: 'bg-linear-to-r from-red-500/10 via-red-500/5 to-transparent',
                    iconBg: 'bg-red-500',
                    textPrimary: 'text-red-700 dark:text-red-400',
                    textSecondary: 'text-red-600 dark:text-red-500',
                };
            case 'warning':
                return {
                    bg: 'bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent',
                    iconBg: 'bg-amber-500',
                    textPrimary: 'text-amber-700 dark:text-amber-400',
                    textSecondary: 'text-amber-600 dark:text-amber-500',
                };
            default:
                return {
                    bg: 'bg-linear-to-r from-blue-500/10 via-blue-500/5 to-transparent',
                    iconBg: 'bg-blue-500',
                    textPrimary: 'text-blue-700 dark:text-blue-400',
                    textSecondary: 'text-blue-600 dark:text-blue-500',
                };
        }
    };

    const countdownStyles = getCountdownStyles();

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
                                    {isCompleted && !completedLate && (
                                        <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                                            <CheckCircle2 className="size-3" />
                                            Completed
                                        </Badge>
                                    )}
                                    {completedLate && (
                                        <Badge variant="secondary" className="gap-1 bg-orange-500/10 text-orange-700 dark:text-orange-400">
                                            <CircleAlert className="size-3" />
                                            Completed Late
                                        </Badge>
                                    )}
                                    {isOverdue && (
                                        <Badge variant="destructive" className="gap-1">
                                            <AlertTriangle className="size-3" />
                                            Overdue
                                        </Badge>
                                    )}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1">
                        <div className="space-y-5 p-6">
                            {/* Countdown Section */}
                            <div className={`overflow-hidden rounded-xl ${countdownStyles.bg}`}>
                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                {!isCompleted && urgencyLevel === 'urgent' && (
                                                    <div className="absolute inset-0 animate-ping rounded-full bg-red-500/30" />
                                                )}
                                                <div className={`relative flex size-10 items-center justify-center rounded-full ${countdownStyles.iconBg} text-white`}>
                                                    {isCompleted ? (
                                                        completedLate ? (
                                                            <CircleAlert className="size-5" />
                                                        ) : (
                                                            <CheckCircle2 className="size-5" />
                                                        )
                                                    ) : (
                                                        <Clock className="size-5" />
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <p className={`text-xs font-medium uppercase tracking-wider ${countdownStyles.textSecondary}`}>
                                                    {isCompleted
                                                        ? (completedLate ? 'Completed Late' : 'Completed On Time')
                                                        : isOverdue
                                                            ? 'Overdue'
                                                            : 'Time Remaining'}
                                                </p>
                                                {isCompleted ? (
                                                    <>
                                                        <p className={`text-lg font-semibold ${countdownStyles.textPrimary}`}>
                                                            {format(parseISO(task.completed_at!), 'MMM d, yyyy • HH:mm')}
                                                        </p>
                                                        {completedLate && (
                                                            <p className={`text-sm ${countdownStyles.textSecondary}`}>
                                                                {formatTimeHumanReadable(-lateBySeconds).replace(' left', ' late')}
                                                            </p>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className={`text-2xl font-bold tabular-nums ${countdownStyles.textPrimary}`}>
                                                            {formatTimeHHMMSS(timeRemaining)}
                                                        </p>
                                                        <p className={`text-sm ${countdownStyles.textSecondary}`}>
                                                            {formatTimeHumanReadable(timeRemaining)}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {!isCompleted && (
                                            <Button
                                                size="sm"
                                                className="gap-1.5 bg-emerald-500 text-white hover:bg-emerald-600"
                                                onClick={handleToggleComplete}
                                                disabled={isProcessing}
                                            >
                                                <CheckCircle2 className="size-3.5" />
                                                Complete
                                            </Button>
                                        )}
                                        {isCompleted && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-1.5"
                                                onClick={handleToggleComplete}
                                                disabled={isProcessing}
                                            >
                                                Reopen
                                            </Button>
                                        )}
                                    </div>

                                    {/* Deadline info */}
                                    <div className="mt-3 flex gap-4 border-t border-current/10 pt-3 text-xs text-muted-foreground">
                                        <div>
                                            <span className="font-medium">Deadline:</span>{' '}
                                            {deadlineDisplay.date} at {deadlineDisplay.time}
                                        </div>
                                        {task.completed_at && (
                                            <div>
                                                <span className="font-medium">Completed:</span>{' '}
                                                {format(parseISO(task.completed_at), 'MMM d, HH:mm')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

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
                                        <Badge
                                            variant={isOverdue ? 'destructive' : 'secondary'}
                                            className={
                                                !isOverdue && urgencyLevel === 'warning'
                                                    ? 'border-amber-500 bg-amber-500/10 text-amber-700'
                                                    : ''
                                            }
                                        >
                                            <Calendar className="mr-1.5 size-3" />
                                            {deadlineDisplay.date}
                                            <span className="ml-1 opacity-70">• {deadlineDisplay.time}</span>
                                        </Badge>
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

            {/* Reopen Dialog (for overdue tasks) */}
            <ReopenTaskDialog
                project={project}
                task={task}
                open={reopenOpen}
                onOpenChange={setReopenOpen}
            />
        </>
    );
}
