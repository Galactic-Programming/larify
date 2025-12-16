import { AlertTriangle, CheckCircle2, Circle, Clock } from 'lucide-react';
import { differenceInSeconds } from 'date-fns';
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

export const getTaskStatusIcon = (task: Task) => {
    if (task.completed_at) {
        return <CheckCircle2 className="size-4 text-green-500" />;
    }
    // Parse due_date (handle both ISO format and date-only format)
    const dateOnly = task.due_date.split('T')[0];
    const deadline = new Date(`${dateOnly}T${task.due_time}`);
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
