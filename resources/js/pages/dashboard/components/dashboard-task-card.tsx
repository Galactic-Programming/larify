import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { AlertTriangle, Clock, FolderKanban } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import type { DashboardTask } from './types';

interface DashboardTaskCardProps {
    task: DashboardTask;
    index?: number;
}

const priorityColors: Record<string, string> = {
    low: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    urgent: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

function formatDueDate(dueDate: string, dueTime: string): string {
    const date = new Date(`${dueDate}T${dueTime}`);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) {
        return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    if (isTomorrow) {
        return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function DashboardTaskCard({ task, index = 0 }: DashboardTaskCardProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleComplete = () => {
        setIsProcessing(true);
        router.patch(
            `/projects/${task.project?.id}/tasks/${task.id}/complete`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsProcessing(false),
            },
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={cn(
                'group flex items-start gap-3 rounded-lg border bg-card p-3 transition-all hover:shadow-md',
                task.is_overdue && 'border-destructive/50 bg-destructive/5',
            )}
        >
            {/* Checkbox */}
            <div className="pt-0.5">
                <Checkbox
                    checked={false}
                    disabled={isProcessing}
                    onCheckedChange={handleComplete}
                    className="size-5"
                />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <Link
                        href={`/projects/${task.project?.id}/lists`}
                        className="min-w-0 flex-1"
                    >
                        <p className="truncate font-medium text-foreground transition-colors hover:text-primary">
                            {task.title}
                        </p>
                    </Link>

                    {/* Priority badge */}
                    {task.priority && (
                        <Badge
                            variant="secondary"
                            className={cn(
                                'shrink-0 text-xs capitalize',
                                priorityColors[task.priority],
                            )}
                        >
                            {task.priority}
                        </Badge>
                    )}
                </div>

                {/* Meta info */}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {/* Project */}
                    {task.project && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1">
                                    <span
                                        className="size-2 rounded-full"
                                        style={{
                                            backgroundColor: task.project.color,
                                        }}
                                    />
                                    <span className="truncate max-w-30">
                                        {task.project.name}
                                    </span>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>{task.project.name}</TooltipContent>
                        </Tooltip>
                    )}

                    {/* Due date */}
                    {task.due_date && task.due_time && (
                        <span
                            className={cn(
                                'inline-flex items-center gap-1',
                                task.is_overdue && 'text-destructive font-medium',
                            )}
                        >
                            {task.is_overdue ? (
                                <AlertTriangle className="size-3" />
                            ) : (
                                <Clock className="size-3" />
                            )}
                            {formatDueDate(task.due_date, task.due_time)}
                        </span>
                    )}

                    {/* List */}
                    {task.list && (
                        <span className="inline-flex items-center gap-1">
                            <FolderKanban className="size-3" />
                            <span className="truncate max-w-25">
                                {task.list.name}
                            </span>
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
