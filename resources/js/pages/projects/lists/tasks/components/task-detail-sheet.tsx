import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
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
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import {
    AlertTriangle,
    ArrowDown,
    ArrowRight,
    ArrowUp,
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    Folder,
    Minus,
    Pencil,
    Play,
    Trash2,
    User,
} from 'lucide-react';
import { useState } from 'react';
import type { Project, Task, TaskPriority } from '../../lib/types';
import { getPriorityColor } from '../../lib/utils';
import { DeleteTaskDialog } from './delete-task-dialog';
import { EditTaskDialog } from './edit-task-dialog';

interface TaskDetailSheetProps {
    task: Task | null;
    project: Project;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; icon: typeof Minus; color: string }> = {
    none: { label: 'None', icon: Minus, color: 'text-muted-foreground' },
    low: { label: 'Low', icon: ArrowDown, color: 'text-green-500' },
    medium: { label: 'Medium', icon: ArrowRight, color: 'text-yellow-500' },
    high: { label: 'High', icon: ArrowUp, color: 'text-orange-500' },
    urgent: { label: 'Urgent', icon: AlertTriangle, color: 'text-red-500' },
};

export function TaskDetailSheet({ task, project, open, onOpenChange }: TaskDetailSheetProps) {
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    if (!task) return null;

    const currentList = project.lists.find((l) => l.id === task.list_id);

    // Handle orphaned data - task's list was deleted
    if (!currentList && open) {
        onOpenChange(false);
        return null;
    }

    const priorityConfig = PRIORITY_CONFIG[task.priority];
    const PriorityIcon = priorityConfig.icon;

    const getStatusInfo = () => {
        if (task.completed_at) {
            return {
                label: 'Completed',
                icon: CheckCircle2,
                color: 'text-green-500',
                bgColor: 'bg-green-500/10',
            };
        }
        if (task.started_at) {
            return {
                label: 'In Progress',
                icon: Clock,
                color: 'text-blue-500',
                bgColor: 'bg-blue-500/10',
            };
        }
        return {
            label: 'Not Started',
            icon: Circle,
            color: 'text-muted-foreground',
            bgColor: 'bg-muted',
        };
    };

    const statusInfo = getStatusInfo();
    const StatusIcon = statusInfo.icon;

    const handleToggleComplete = () => {
        setIsProcessing(true);
        router.patch(
            complete({ project, task }).url,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsProcessing(false),
                onError: () => {
                    // Handle error (e.g., task was deleted)
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
                    // Handle error (e.g., task was deleted)
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
            {
                list_id: newListId,
                // Position auto-calculated by backend to prevent race condition
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsProcessing(false);
                    onOpenChange(false); // Close sheet after moving
                },
                onError: () => {
                    // Handle error (e.g., task or target list was deleted)
                    setIsProcessing(false);
                    onOpenChange(false);
                },
            },
        );
    };

    const formatDueDateTime = () => {
        if (!task.due_date) return null;
        const date = parseISO(task.due_date);
        const formattedDate = format(date, 'MMM d, yyyy');
        const formattedTime = task.due_time ? ` at ${task.due_time.slice(0, 5)}` : '';
        return formattedDate + formattedTime;
    };

    const getDueDateStatus = () => {
        if (!task.due_date || task.completed_at) return null;
        const dueDate = parseISO(task.due_date);
        const now = new Date();
        if (dueDate < now) return 'overdue';
        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) return 'due-soon';
        return null;
    };

    const dueDateStatus = getDueDateStatus();

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="flex w-full flex-col sm:max-w-lg">
                    <SheetHeader className="space-y-3">
                        <div className="flex items-start gap-3">
                            {/* Completion Checkbox */}
                            <div className="pt-1">
                                <Checkbox
                                    checked={!!task.completed_at}
                                    onCheckedChange={handleToggleComplete}
                                    disabled={isProcessing}
                                    className="size-5"
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <SheetTitle
                                    className={`text-lg leading-tight ${task.completed_at ? 'text-muted-foreground line-through' : ''}`}
                                >
                                    {task.title}
                                </SheetTitle>
                                <SheetDescription className="mt-1 text-sm">
                                    in <span className="font-medium">{currentList?.name || 'Unknown list'}</span>
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    <Separator className="my-2" />

                    <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-6 pb-4">
                            {/* Status & Quick Actions */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        className={`gap-1.5 ${statusInfo.bgColor} ${statusInfo.color}`}
                                    >
                                        <StatusIcon className="size-3.5" />
                                        {statusInfo.label}
                                    </Badge>
                                    {!task.started_at && !task.completed_at && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5"
                                            onClick={handleStartTask}
                                            disabled={isProcessing}
                                        >
                                            <Play className="size-3.5" />
                                            Start Task
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            {task.description && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                                    <p className="whitespace-pre-wrap text-sm">{task.description}</p>
                                </div>
                            )}

                            {/* Details Grid */}
                            <div className="grid gap-4">
                                {/* Priority */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <PriorityIcon className={`size-4 ${priorityConfig.color}`} />
                                        Priority
                                    </div>
                                    <Badge variant="outline" className={`${getPriorityColor(task.priority)}`}>
                                        {priorityConfig.label}
                                    </Badge>
                                </div>

                                {/* Due Date */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="size-4" />
                                        Due Date
                                    </div>
                                    {task.due_date ? (
                                        <Badge
                                            variant={dueDateStatus === 'overdue' ? 'destructive' : 'outline'}
                                            className={dueDateStatus === 'due-soon' ? 'border-orange-500 text-orange-500' : ''}
                                        >
                                            {formatDueDateTime()}
                                        </Badge>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Not set</span>
                                    )}
                                </div>

                                {/* Assignee */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <User className="size-4" />
                                        Assignee
                                    </div>
                                    {task.assignee ? (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="size-6">
                                                            <AvatarImage src={task.assignee.avatar || undefined} />
                                                            <AvatarFallback className="text-xs">
                                                                {task.assignee.name.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm">{task.assignee.name}</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{task.assignee.email}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Unassigned</span>
                                    )}
                                </div>

                                {/* Move to List */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Folder className="size-4" />
                                        List
                                    </div>
                                    <Select
                                        value={task.list_id.toString()}
                                        onValueChange={handleMoveToList}
                                        disabled={isProcessing}
                                    >
                                        <SelectTrigger className="h-8 w-auto min-w-32">
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

                            {/* Time Tracking Info */}
                            {(task.started_at || task.completed_at) && (
                                <>
                                    <Separator />
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium text-muted-foreground">Time Tracking</h4>
                                        <div className="space-y-2 text-sm">
                                            {task.started_at && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">Started</span>
                                                    <span>
                                                        {formatDistanceToNow(parseISO(task.started_at), {
                                                            addSuffix: true,
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                            {task.completed_at && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">Completed</span>
                                                    <span>
                                                        {formatDistanceToNow(parseISO(task.completed_at), {
                                                            addSuffix: true,
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Metadata */}
                            <Separator />
                            <div className="space-y-2 text-xs text-muted-foreground">
                                <div className="flex items-center justify-between">
                                    <span>Created</span>
                                    <span>{format(parseISO(task.created_at), 'MMM d, yyyy HH:mm')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Updated</span>
                                    <span>{format(parseISO(task.updated_at), 'MMM d, yyyy HH:mm')}</span>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Footer Actions */}
                    <Separator className="my-2" />
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={() => setEditOpen(true)}
                        >
                            <Pencil className="size-4" />
                            Edit
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => setDeleteOpen(true)}
                        >
                            <Trash2 className="size-4" />
                        </Button>
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
                    if (!open) onOpenChange(false); // Close sheet after delete
                }}
            />
        </>
    );
}
