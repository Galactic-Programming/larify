import DashboardFooter from '@/components/shadcn-studio/blocks/dashboard-footer';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { SparklesText } from '@/components/ui/sparkles-text';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'motion/react';

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

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;
    const firstName = auth.user.name.split(' ')[0];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {/* Welcome Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="relative col-span-full overflow-hidden rounded-xl border border-sidebar-border/70 bg-linear-to-br from-primary/10 via-card to-card p-6 dark:border-sidebar-border"
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
                                <SparklesText className="inline-block">{firstName}</SparklesText>
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.4 }}
                                className="mt-2 text-muted-foreground"
                            >
                                Welcome back to Larify. Here's what's happening today.
                            </motion.p>
                        </div>
                        {/* Decorative gradient circles */}
                        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-3xl" />
                        <div className="absolute -bottom-10 -left-10 size-32 rounded-full bg-primary/5 blur-2xl" />
                    </motion.div>
                </div>

                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {[0, 1, 2].map((index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + index * 0.1, duration: 0.4, ease: 'easeOut' }}
                            whileHover={{ scale: 1.02, y: -4, transition: { duration: 0.2 } }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-card relative aspect-video cursor-pointer overflow-hidden rounded-xl border border-sidebar-border/70 transition-shadow hover:shadow-lg dark:border-sidebar-border"
                        >
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.5, ease: 'easeOut' }}
                    whileHover={{ scale: 1.005, transition: { duration: 0.2 } }}
                    className="bg-card relative min-h-[50vh] flex-1 cursor-pointer overflow-hidden rounded-xl border border-sidebar-border/70 transition-shadow hover:shadow-lg sm:min-h-[60vh] md:min-h-min dark:border-sidebar-border"
                >
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </motion.div>
            </div>
            <DashboardFooter />
        </AppLayout>
    );
}
