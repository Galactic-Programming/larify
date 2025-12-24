import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
    AlertTriangle,
    Calendar,
    CalendarClock,
    CheckCircle2,
    Clock,
    ListTodo,
} from 'lucide-react';
import { motion } from 'motion/react';
import { DashboardTaskCard } from './dashboard-task-card';
import type { GroupedTasks } from './types';

interface MyTasksSectionProps {
    tasks: GroupedTasks;
    overdueCount: number;
}

interface TaskGroupProps {
    title: string;
    icon: React.ReactNode;
    tasks: GroupedTasks[keyof GroupedTasks];
    variant?: 'default' | 'warning' | 'muted';
}

function TaskGroup({
    title,
    icon,
    tasks,
    variant = 'default',
}: TaskGroupProps) {
    if (tasks.length === 0) return null;

    const headerColors = {
        default: 'text-foreground',
        warning: 'text-destructive',
        muted: 'text-muted-foreground',
    };

    return (
        <div className="space-y-2">
            <div
                className={cn(
                    'flex items-center gap-2 text-sm font-medium',
                    headerColors[variant],
                )}
            >
                {icon}
                <span>{title}</span>
                <Badge
                    variant={variant === 'warning' ? 'destructive' : 'secondary'}
                    className="text-xs"
                >
                    {tasks.length}
                </Badge>
            </div>
            <div className="space-y-2">
                {tasks.map((task, index) => (
                    <DashboardTaskCard key={task.id} task={task} index={index} />
                ))}
            </div>
        </div>
    );
}

export function MyTasksSection({ tasks, overdueCount }: MyTasksSectionProps) {
    const totalTasks =
        tasks.overdue.length +
        tasks.today.length +
        tasks.this_week.length +
        tasks.later.length +
        tasks.no_date.length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="h-full"
        >
            <Card className="flex h-full flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ListTodo className="size-5 text-primary" />
                            My Tasks
                        </CardTitle>
                        <CardDescription>
                            {totalTasks > 0
                                ? `${totalTasks} task${totalTasks !== 1 ? 's' : ''} to complete`
                                : 'All caught up!'}
                        </CardDescription>
                    </div>
                    {overdueCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="flex items-center gap-1"
                        >
                            <AlertTriangle className="size-3" />
                            {overdueCount} overdue
                        </Badge>
                    )}
                </CardHeader>

                <CardContent className="flex flex-1 flex-col space-y-6">
                    {totalTasks === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                            <div className="rounded-full bg-primary/10 p-3">
                                <CheckCircle2 className="size-8 text-primary" />
                            </div>
                            <h3 className="mt-4 font-semibold">
                                All tasks completed!
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Great job! You've finished all your tasks.
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className="flex-1 pr-4">
                            <div className="space-y-6">
                                {/* Overdue */}
                                <TaskGroup
                                    title="Overdue"
                                    icon={<AlertTriangle className="size-4" />}
                                    tasks={tasks.overdue}
                                    variant="warning"
                                />

                                {/* Today */}
                                <TaskGroup
                                    title="Today"
                                    icon={<Clock className="size-4" />}
                                    tasks={tasks.today}
                                />

                                {/* This Week */}
                                <TaskGroup
                                    title="This Week"
                                    icon={<Calendar className="size-4" />}
                                    tasks={tasks.this_week}
                                />

                                {/* Later */}
                                <TaskGroup
                                    title="Later"
                                    icon={<CalendarClock className="size-4" />}
                                    tasks={tasks.later}
                                    variant="muted"
                                />

                                {/* No Date */}
                                <TaskGroup
                                    title="No Due Date"
                                    icon={<ListTodo className="size-4" />}
                                    tasks={tasks.no_date}
                                    variant="muted"
                                />
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
