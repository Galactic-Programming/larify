import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    AlertTriangle,
    ArrowDown,
    ArrowRight,
    ArrowUp,
    Calendar,
    Minus,
} from 'lucide-react';
import { LabelField } from '../../../components/labels';
import type { Permissions, Project, Task, TaskPriority } from '../../../lib/types';

interface TaskDetailsCardProps {
    task: Task;
    project: Project;
    permissions: Permissions;
    currentList: { id: number; name: string } | undefined;
    isProcessing: boolean;
    isOverdue: boolean;
    urgencyLevel: 'overdue' | 'urgent' | 'warning' | 'normal';
    deadlineDisplay: { date: string; time: string };
    onMoveToList: (listId: string) => void;
    onOpenLabelManager: () => void;
}

const PRIORITY_ICONS = {
    none: Minus,
    low: ArrowDown,
    medium: ArrowRight,
    high: ArrowUp,
    urgent: AlertTriangle,
};

const PRIORITY_CONFIG: Record<
    TaskPriority,
    { label: string; color: string; bgColor: string }
> = {
    none: {
        label: 'None',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/50',
    },
    low: {
        label: 'Low',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-500/10',
    },
    medium: {
        label: 'Medium',
        color: 'text-amber-600',
        bgColor: 'bg-amber-500/10',
    },
    high: {
        label: 'High',
        color: 'text-orange-600',
        bgColor: 'bg-orange-500/10',
    },
    urgent: {
        label: 'Urgent',
        color: 'text-red-600',
        bgColor: 'bg-red-500/10',
    },
};

export function TaskDetailsCard({
    task,
    project,
    permissions,
    currentList,
    isProcessing,
    isOverdue,
    urgencyLevel,
    deadlineDisplay,
    onMoveToList,
    onOpenLabelManager,
}: TaskDetailsCardProps) {
    const priorityConfig = PRIORITY_CONFIG[task.priority];
    const PriorityIcon = PRIORITY_ICONS[task.priority];

    return (
        <div className="space-y-1">
            <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
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
                                            <AvatarImage
                                                src={task.assignee.avatar || undefined}
                                            />
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

                {/* Labels */}
                <div className="flex items-center justify-between p-3">
                    <span className="text-sm text-muted-foreground">Labels</span>
                    <LabelField
                        project={project}
                        task={task}
                        selectedLabels={task.labels ?? []}
                        disabled={!permissions.canEdit}
                        onCreateLabel={onOpenLabelManager}
                    />
                </div>

                {/* List/Status - Editable only for editors */}
                <div className="flex items-center justify-between p-3">
                    <span className="text-sm text-muted-foreground">List</span>
                    {permissions.canEdit ? (
                        <Select
                            value={task.list_id.toString()}
                            onValueChange={onMoveToList}
                            disabled={isProcessing}
                        >
                            <SelectTrigger className="h-8 w-auto min-w-35 border-0 bg-muted/50 text-sm font-medium">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {project.lists.map((list) => (
                                    <SelectItem
                                        key={list.id}
                                        value={list.id.toString()}
                                        title={list.name}
                                    >
                                        <span className="max-w-[14ch] truncate">
                                            {list.name}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <span
                            className="max-w-[16ch] truncate text-sm font-medium"
                            title={currentList?.name}
                        >
                            {currentList?.name}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
