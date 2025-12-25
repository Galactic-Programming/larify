import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    AlertTriangle,
    CheckCircle2,
    ListTodo,
} from 'lucide-react';
import { motion } from 'motion/react';
import { MyTasksTable } from './my-tasks-table';
import type { DashboardTask, GroupedTasks } from './types';

interface MyTasksSectionProps {
    tasks: GroupedTasks;
    overdueCount: number;
}

export function MyTasksSection({ tasks, overdueCount }: MyTasksSectionProps) {
    // Flatten all tasks into a single array, ordered by priority
    const allTasks: DashboardTask[] = [
        ...tasks.overdue,
        ...tasks.today,
        ...tasks.later,
    ];

    // Create grouped data for tabs
    const groupedData = {
        all: allTasks,
        overdue: tasks.overdue,
        today: tasks.today,
        later: tasks.later,
    };

    const totalTasks = allTasks.length;

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

                <CardContent className="flex flex-1 flex-col">
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
                        <MyTasksTable data={allTasks} groupedData={groupedData} />
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
