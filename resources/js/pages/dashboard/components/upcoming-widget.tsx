import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarClock,
    ChevronRight,
    Clock,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { UpcomingTask } from './types';

interface UpcomingWidgetProps {
    deadlines: UpcomingTask[];
}

function formatDeadline(dueDate: string, dueTime: string): string {
    const date = new Date(`${dueDate}T${dueTime}`);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} overdue`;
    }
    if (diffDays === 0) {
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
        if (diffHours <= 0) {
            return 'Due now';
        }
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} left`;
    }
    if (diffDays === 1) {
        return 'Due tomorrow';
    }
    return `${diffDays} days left`;
}

function isOverdue(dueDate: string, dueTime: string): boolean {
    const date = new Date(`${dueDate}T${dueTime}`);
    return date < new Date();
}

function isUrgent(dueDate: string, dueTime: string): boolean {
    const date = new Date(`${dueDate}T${dueTime}`);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours <= 24 && diffHours > 0;
}

export function UpcomingWidget({ deadlines }: UpcomingWidgetProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
        >
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <CalendarClock className="size-4 text-primary" />
                        Upcoming Deadlines
                    </CardTitle>
                    <CardDescription>Next 5 due tasks</CardDescription>
                </CardHeader>

                <CardContent>
                    {deadlines.length === 0 ? (
                        <div className="py-4 text-center text-sm text-muted-foreground">
                            No upcoming deadlines
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {deadlines.map((task, index) => {
                                const overdue = isOverdue(
                                    task.due_date,
                                    task.due_time,
                                );
                                const urgent = isUrgent(
                                    task.due_date,
                                    task.due_time,
                                );

                                return (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.2,
                                            delay: index * 0.05,
                                        }}
                                    >
                                        <Link
                                            href={`/projects/${task.project?.id}/lists`}
                                            className={cn(
                                                'group flex items-center gap-3 rounded-lg border p-2.5 transition-all hover:bg-accent',
                                                overdue &&
                                                'border-destructive/50 bg-destructive/5',
                                                urgent &&
                                                !overdue &&
                                                'border-warning/50 bg-warning/5',
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'rounded-full p-1.5',
                                                    overdue
                                                        ? 'bg-destructive/10 text-destructive'
                                                        : urgent
                                                            ? 'bg-orange-500/10 text-orange-500'
                                                            : 'bg-muted text-muted-foreground',
                                                )}
                                            >
                                                {overdue ? (
                                                    <AlertTriangle className="size-3.5" />
                                                ) : (
                                                    <Clock className="size-3.5" />
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {task.title}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    {task.project && (
                                                        <span className="flex items-center gap-1">
                                                            <span
                                                                className="size-1.5 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        task
                                                                            .project
                                                                            .color,
                                                                }}
                                                            />
                                                            <span className="truncate max-w-20">
                                                                {
                                                                    task.project
                                                                        .name
                                                                }
                                                            </span>
                                                        </span>
                                                    )}
                                                    <span
                                                        className={cn(
                                                            overdue &&
                                                            'text-destructive font-medium',
                                                            urgent &&
                                                            !overdue &&
                                                            'text-orange-500 font-medium',
                                                        )}
                                                    >
                                                        {formatDeadline(
                                                            task.due_date,
                                                            task.due_time,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
