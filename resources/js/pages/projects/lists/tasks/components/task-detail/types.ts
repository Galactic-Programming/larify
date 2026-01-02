import type {
    Permissions,
    Project,
    Task,
    TaskPriority,
} from '../../../lib/types';

export interface TaskDetailContextValue {
    task: Task;
    project: Project;
    permissions: Permissions;
    isProcessing: boolean;
    setIsProcessing: (value: boolean) => void;
    timeRemaining: number;
    isCompleted: boolean;
    isOverdue: boolean;
    completedLate: boolean;
    urgencyLevel: 'overdue' | 'urgent' | 'warning' | 'normal';
    countdownStyles: CountdownStyles;
    priorityConfig: PriorityConfig;
    currentList: { id: number; name: string } | undefined;
    deadlineDisplay: { date: string; time: string };
    lateBySeconds: number;
    formatTimeHHMMSS: (seconds: number) => string;
    formatTimeHumanReadable: (seconds: number) => string;
    handleToggleComplete: () => void;
    handleMoveToList: (listId: string) => void;
    onOpenLabelManager: () => void;
    onOpenEdit: () => void;
    onOpenDelete: () => void;
}

export interface CountdownStyles {
    bg: string;
    iconBg: string;
    textPrimary: string;
    textSecondary: string;
}

export interface PriorityConfig {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
}

export const PRIORITY_CONFIG: Record<TaskPriority, PriorityConfig> = {
    none: {
        label: 'None',
        icon: () => null, // Will be replaced with actual icon
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/50',
    },
    low: {
        label: 'Low',
        icon: () => null,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-500/10',
    },
    medium: {
        label: 'Medium',
        icon: () => null,
        color: 'text-amber-600',
        bgColor: 'bg-amber-500/10',
    },
    high: {
        label: 'High',
        icon: () => null,
        color: 'text-orange-600',
        bgColor: 'bg-orange-500/10',
    },
    urgent: {
        label: 'Urgent',
        icon: () => null,
        color: 'text-red-600',
        bgColor: 'bg-red-500/10',
    },
};
