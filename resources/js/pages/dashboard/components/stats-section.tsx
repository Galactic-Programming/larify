import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    AlertTriangle,
    CalendarClock,
    CheckCircle2,
    FolderKanban,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';

interface StatsSectionProps {
    stats: {
        my_tasks_count: number;
        overdue_count: number;
        due_today_count: number;
        high_priority_count: number;
        projects_count: number;
        archived_projects_count: number;
        avg_progress: number;
        total_project_tasks: number;
        completed_project_tasks: number;
        completed_this_week: number;
        completed_last_week: number;
        week_change: number;
    };
}

export function StatsSection({ stats }: StatsSectionProps) {
    const isTasksHealthy = stats.overdue_count === 0;
    const isDueTodayOk = stats.due_today_count === 0;
    const isProgressGood = stats.avg_progress >= 50;
    const isWeekPositive = stats.week_change >= 0;

    return (
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 lg:grid-cols-4">
            {/* My Tasks Card */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>My Tasks</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {stats.my_tasks_count}
                    </CardTitle>
                    <CardAction>
                        <Badge
                            variant="outline"
                            className={
                                isTasksHealthy
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                            }
                        >
                            {isTasksHealthy ? (
                                <CheckCircle2 className="size-3" />
                            ) : (
                                <AlertTriangle className="size-3" />
                            )}
                            {isTasksHealthy
                                ? 'On track'
                                : `${stats.overdue_count} overdue`}
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        {isTasksHealthy ? (
                            <>
                                All tasks on track{' '}
                                <CheckCircle2 className="size-4 text-green-500" />
                            </>
                        ) : (
                            <>
                                {stats.overdue_count} tasks need attention{' '}
                                <AlertTriangle className="size-4 text-red-500" />
                            </>
                        )}
                    </div>
                    <div className="text-muted-foreground">
                        {stats.high_priority_count > 0
                            ? `${stats.high_priority_count} high priority tasks`
                            : 'No high priority tasks'}
                    </div>
                </CardFooter>
            </Card>

            {/* Due Today Card */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Due Today</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {stats.due_today_count}
                    </CardTitle>
                    <CardAction>
                        <Badge
                            variant="outline"
                            className={
                                isDueTodayOk
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-orange-600 dark:text-orange-400'
                            }
                        >
                            {isDueTodayOk ? (
                                <CheckCircle2 className="size-3" />
                            ) : (
                                <CalendarClock className="size-3" />
                            )}
                            {isDueTodayOk ? 'Clear' : 'Pending'}
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        {isDueTodayOk ? (
                            <>
                                No deadlines today{' '}
                                <CheckCircle2 className="size-4 text-green-500" />
                            </>
                        ) : (
                            <>
                                Tasks need attention{' '}
                                <CalendarClock className="size-4 text-orange-500" />
                            </>
                        )}
                    </div>
                    <div className="text-muted-foreground">
                        Tasks scheduled for today
                    </div>
                </CardFooter>
            </Card>

            {/* Active Projects Card */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Active Projects</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {stats.projects_count}
                    </CardTitle>
                    <CardAction>
                        <Badge
                            variant="outline"
                            className={
                                isProgressGood
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-blue-600 dark:text-blue-400'
                            }
                        >
                            {isProgressGood ? (
                                <TrendingUp className="size-3" />
                            ) : (
                                <FolderKanban className="size-3" />
                            )}
                            {stats.avg_progress}% avg
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        {stats.projects_count > 0 ? (
                            <>
                                {stats.avg_progress}% average completion{' '}
                                <TrendingUp className="size-4 text-primary" />
                            </>
                        ) : (
                            <>
                                No active projects{' '}
                                <FolderKanban className="size-4" />
                            </>
                        )}
                    </div>
                    <div className="text-muted-foreground">
                        {stats.archived_projects_count > 0
                            ? `${stats.archived_projects_count} archived projects`
                            : 'No archived projects'}
                    </div>
                </CardFooter>
            </Card>

            {/* Completed This Week Card */}
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Completed This Week</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {stats.completed_this_week}
                    </CardTitle>
                    <CardAction>
                        <Badge
                            variant="outline"
                            className={
                                isWeekPositive
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                            }
                        >
                            {isWeekPositive ? (
                                <TrendingUp className="size-3" />
                            ) : (
                                <TrendingDown className="size-3" />
                            )}
                            {isWeekPositive ? '+' : ''}
                            {stats.week_change}%
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        {isWeekPositive ? (
                            <>
                                {stats.week_change > 0
                                    ? `Up ${stats.week_change}% this week`
                                    : 'Same as last week'}{' '}
                                <TrendingUp className="size-4 text-green-500" />
                            </>
                        ) : (
                            <>
                                Down {Math.abs(stats.week_change)}% this week{' '}
                                <TrendingDown className="size-4 text-red-500" />
                            </>
                        )}
                    </div>
                    <div className="text-muted-foreground">
                        {stats.completed_last_week} completed last week
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
