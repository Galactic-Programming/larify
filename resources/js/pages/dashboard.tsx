import DashboardFooter from '@/components/shadcn-studio/blocks/dashboard-footer';
import { SparklesText } from '@/components/ui/sparkles-text';
import { useDashboardRealtime } from '@/hooks/use-dashboard-realtime';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'motion/react';
import { ActivityWidget } from './dashboard/components/activity-widget';
import { MyTasksSection } from './dashboard/components/my-tasks-section';
import { ProjectsSection } from './dashboard/components/projects-section';
import { StatsSection } from './dashboard/components/stats-section';
import { UpcomingWidget } from './dashboard/components/upcoming-widget';
import type { DashboardPageProps } from './dashboard/components/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

export default function Dashboard({
    stats,
    myTasks,
    upcomingDeadlines,
    recentActivities,
    recentProjects,
}: DashboardPageProps) {
    const { auth } = usePage<SharedData>().props;
    const firstName = auth.user.name.split(' ')[0];

    // Real-time updates for dashboard data
    useDashboardRealtime({ autoRefresh: true });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 pb-0">
                {/* Welcome Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-linear-to-br from-primary/10 via-card to-card p-6 dark:border-sidebar-border"
                >
                    <div className="relative z-10">
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                            className="text-sm text-muted-foreground"
                        >
                            {getGreeting()},
                        </motion.p>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                            className="text-2xl font-bold tracking-tight md:text-3xl"
                        >
                            <SparklesText className="inline-block">
                                {firstName}
                            </SparklesText>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.4 }}
                            className="mt-2 text-muted-foreground"
                        >
                            Welcome back to LaraFlow. Here's what's happening today.
                        </motion.p>
                    </div>
                    {/* Decorative gradient circles */}
                    <div className="absolute -top-10 -right-10 size-40 rounded-full bg-primary/10 blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 size-32 rounded-full bg-primary/5 blur-2xl" />
                </motion.div>

                {/* Stats Section */}
                <StatsSection stats={stats} />

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                    {/* Left Column - My Tasks (2/3 width) */}
                    <MyTasksSection
                        tasks={myTasks}
                        overdueCount={stats.overdue_count}
                    />

                    {/* Right Column - Sidebar Widgets (1/3 width, proportional heights) */}
                    <div className="flex flex-col gap-6">
                        <div className="flex-54">
                            <UpcomingWidget deadlines={upcomingDeadlines} />
                        </div>
                        <div className="flex-46">
                            <ActivityWidget activities={recentActivities} />
                        </div>
                    </div>
                </div>

                {/* Projects Section */}
                <ProjectsSection projects={recentProjects} />
            </div>
            <DashboardFooter />
        </AppLayout>
    );
}
