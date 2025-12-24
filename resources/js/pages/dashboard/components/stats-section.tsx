import { CheckSquare, FolderKanban, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { StatsCard } from './stats-card';

interface StatsSectionProps {
    stats: {
        my_tasks_count: number;
        overdue_count: number;
        projects_count: number;
        archived_projects_count: number;
        completed_this_week: number;
        completed_last_week: number;
        week_change: number;
    };
}

export function StatsSection({ stats }: StatsSectionProps) {
    const weekChangeText =
        stats.week_change > 0
            ? `+${stats.week_change}% vs last week`
            : stats.week_change < 0
                ? `${stats.week_change}% vs last week`
                : 'Same as last week';

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatsCard
                icon={<CheckSquare className="size-5" />}
                value={stats.my_tasks_count}
                title="My Tasks"
                subtitle={
                    stats.overdue_count > 0
                        ? `${stats.overdue_count} overdue`
                        : 'All on track'
                }
                subtitleVariant={stats.overdue_count > 0 ? 'warning' : 'success'}
                index={0}
            />

            <StatsCard
                icon={<FolderKanban className="size-5" />}
                value={stats.projects_count}
                title="Active Projects"
                subtitle={
                    stats.archived_projects_count > 0
                        ? `${stats.archived_projects_count} archived`
                        : undefined
                }
                index={1}
            />

            <StatsCard
                icon={<Target className="size-5" />}
                value={stats.completed_this_week}
                title="Completed This Week"
                subtitle={
                    <span className="inline-flex items-center gap-1">
                        {stats.week_change >= 0 ? (
                            <TrendingUp className="size-3" />
                        ) : (
                            <TrendingDown className="size-3" />
                        )}
                        {weekChangeText}
                    </span>
                }
                subtitleVariant={stats.week_change >= 0 ? 'success' : 'warning'}
                index={2}
            />
        </div>
    );
}
