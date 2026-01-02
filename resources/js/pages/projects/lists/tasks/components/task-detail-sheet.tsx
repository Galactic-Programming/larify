import {
    complete,
    move,
} from '@/actions/App/Http/Controllers/Tasks/TaskController';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
// import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { differenceInSeconds, format } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { LabelManagerSheet } from '../../components/labels';
import type { Permissions, Project, Task } from '../../lib/types';
import { getTaskDeadline, isCompletedLate } from '../../lib/utils';
import { DeleteTaskDialog } from './delete-task-dialog';
import { EditTaskDialog } from './edit-task-dialog';
import { ReopenTaskDialog } from './reopen-task-dialog';
import {
    CountdownSection,
    TaskActivity,
    TaskDescription,
    TaskDetailsCard,
    TaskFooterActions,
    TaskHeader,
} from './task-detail';
import { TaskCommentsPanel } from './task-comments';

interface TaskDetailSheetProps {
    task: Task | null;
    project: Project;
    permissions: Permissions;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TaskDetailSheet({
    task,
    project,
    permissions,
    open,
    onOpenChange,
}: TaskDetailSheetProps) {
    const { auth } = usePage<SharedData>().props;
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [reopenOpen, setReopenOpen] = useState(false);
    const [labelManagerOpen, setLabelManagerOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);

    // Check if user can update deadline
    const canUpdateDeadline =
        permissions.role === 'owner' || task?.created_by === auth.user.id;

    // Real-time countdown to deadline
    useEffect(() => {
        if (!task?.due_date || !task?.due_time || task?.completed_at) {
            setTimeRemaining(0);
            return;
        }

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
        if (minutes > 0 && days === 0)
            parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);

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
        if (seconds < 3600) return 'urgent';
        if (seconds < 86400) return 'warning';
        return 'normal';
    }, []);

    if (!task) return null;

    const currentList = project.lists.find((l) => l.id === task.list_id);

    // Handle orphaned data - task's list was deleted
    if (!currentList && open) {
        onOpenChange(false);
        return null;
    }

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
        if (isCompleted && wasOverdueWhenCompleted) {
            if (!permissions.canReopen) return;
            setReopenOpen(true);
            return;
        }

        if (isCompleted && !permissions.canReopen) return;
        if (!isCompleted && !permissions.canEdit) return;

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
            if (completedLate) {
                return {
                    bg: 'bg-linear-to-r from-orange-500/10 via-orange-500/5 to-transparent',
                    iconBg: 'bg-orange-500',
                    textPrimary: 'text-orange-700 dark:text-orange-400',
                    textSecondary: 'text-orange-600 dark:text-orange-500',
                };
            }
            return {
                bg: 'bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-transparent',
                iconBg: 'bg-emerald-500',
                textPrimary: 'text-emerald-700 dark:text-emerald-400',
                textSecondary: 'text-emerald-600 dark:text-emerald-500',
            };
        }
        switch (urgencyLevel) {
            case 'overdue':
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
                <SheetContent className="flex w-full max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
                    <TaskHeader
                        task={task}
                        project={project}
                        currentList={currentList}
                        isCompleted={isCompleted}
                        isOverdue={isOverdue}
                        completedLate={completedLate}
                    />

                    <ResizablePanelGroup direction="horizontal" className="flex-1">
                        {/* Task Details Panel */}
                        <ResizablePanel defaultSize={50} minSize={35}>
                            <div className="flex h-full flex-col">
                                <ScrollArea className="flex-1">
                                    <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
                                        <CountdownSection
                                            task={task}
                                            permissions={permissions}
                                            isCompleted={isCompleted}
                                            isOverdue={isOverdue}
                                            completedLate={completedLate}
                                            isProcessing={isProcessing}
                                            timeRemaining={timeRemaining}
                                            lateBySeconds={lateBySeconds}
                                            urgencyLevel={urgencyLevel}
                                            countdownStyles={countdownStyles}
                                            deadlineDisplay={deadlineDisplay}
                                            formatTimeHHMMSS={formatTimeHHMMSS}
                                            formatTimeHumanReadable={formatTimeHumanReadable}
                                            onToggleComplete={handleToggleComplete}
                                            canReopen={permissions.canReopen}
                                        />

                                        <TaskDescription description={task.description} />

                                        <TaskDetailsCard
                                            task={task}
                                            project={project}
                                            permissions={permissions}
                                            currentList={currentList}
                                            isProcessing={isProcessing}
                                            isOverdue={isOverdue}
                                            urgencyLevel={urgencyLevel}
                                            deadlineDisplay={deadlineDisplay}
                                            onMoveToList={handleMoveToList}
                                            onOpenLabelManager={() => setLabelManagerOpen(true)}
                                        />

                                        <TaskActivity task={task} />
                                    </div>
                                </ScrollArea>

                                <TaskFooterActions
                                    permissions={permissions}
                                    onOpenEdit={() => setEditOpen(true)}
                                    onOpenDelete={() => setDeleteOpen(true)}
                                />
                            </div>
                        </ResizablePanel>

                        <ResizableHandle withHandle />

                        {/* Comments Panel */}
                        <ResizablePanel defaultSize={50} minSize={30}>
                            <TaskCommentsPanel
                                projectId={project.id}
                                taskId={task.id}
                            />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </SheetContent>
            </Sheet>

            {/* Edit Dialog */}
            <EditTaskDialog
                project={project}
                task={task}
                open={editOpen}
                onOpenChange={setEditOpen}
                canAssignTask={permissions.canAssignTask}
                canUpdateDeadline={canUpdateDeadline}
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

            {/* Label Manager Sheet */}
            <LabelManagerSheet
                project={project}
                permissions={permissions}
                open={labelManagerOpen}
                onOpenChange={setLabelManagerOpen}
            />
        </>
    );
}
