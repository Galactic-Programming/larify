import { differenceInSeconds } from 'date-fns';
import {
    AlertTriangle,
    CheckCircle2,
    Circle,
    CircleAlert,
    Clock,
} from 'lucide-react';
import type { Task } from './types';

export const getPriorityColor = (priority: Task['priority']) => {
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

/**
 * Get the deadline Date object from a task
 */
export const getTaskDeadline = (task: Task): Date => {
    const dateOnly = task.due_date.split('T')[0];
    return new Date(`${dateOnly}T${task.due_time}`);
};

/**
 * Check if a task was completed late (after deadline)
 */
export const isCompletedLate = (task: Task): boolean => {
    if (!task.completed_at) return false;
    const deadline = getTaskDeadline(task);
    const completedAt = new Date(task.completed_at);
    return completedAt > deadline;
};

/**
 * Check if a task is currently overdue (not completed and past deadline)
 */
export const isTaskOverdue = (task: Task): boolean => {
    if (task.completed_at) return false;
    const deadline = getTaskDeadline(task);
    return new Date() > deadline;
};

export const getTaskStatusIcon = (task: Task) => {
    const deadline = getTaskDeadline(task);

    if (task.completed_at) {
        const completedAt = new Date(task.completed_at);
        // Completed late - orange/amber icon
        if (completedAt > deadline) {
            return <CircleAlert className="size-4 text-orange-500" />;
        }
        // Completed on time - green icon
        return <CheckCircle2 className="size-4 text-green-500" />;
    }

    // Not completed - check if overdue
    const isOverdue = differenceInSeconds(deadline, new Date()) < 0;
    if (isOverdue) {
        return <AlertTriangle className="size-4 text-red-500" />;
    }

    // Check if due soon (< 24 hours)
    const remaining = differenceInSeconds(deadline, new Date());
    if (remaining < 86400) {
        return <Clock className="size-4 text-amber-500" />;
    }

    return <Circle className="size-4 text-muted-foreground" />;
};
