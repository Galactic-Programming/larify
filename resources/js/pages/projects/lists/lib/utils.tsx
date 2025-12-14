import { CheckCircle2, Circle, Clock } from 'lucide-react';
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
    if (task.started_at) {
        return <Clock className="size-4 text-blue-500" />;
    }
    return <Circle className="size-4 text-muted-foreground" />;
};
