import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Activity } from '@/types/notifications.d';
import { FolderOpen } from 'lucide-react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useMemo } from 'react';
import { ActivityItem } from './activity-item';

interface ActivityTimelineProps {
    activities: Activity[];
    isLoading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
}

// Animation variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
};

// Group activities by project
interface ProjectGroup {
    projectId: number;
    projectName: string;
    projectColor: string;
    activities: Activity[];
    latestActivityTime: string;
}

function groupActivitiesByProject(activities: Activity[]): ProjectGroup[] {
    const groups = new Map<number, ProjectGroup>();

    activities.forEach((activity) => {
        const projectId = activity.project?.id || 0;
        const projectName = activity.project?.name || 'Unknown Project';
        const projectColor = activity.project?.color || '#6b7280';

        if (!groups.has(projectId)) {
            groups.set(projectId, {
                projectId,
                projectName,
                projectColor,
                activities: [],
                latestActivityTime: activity.created_at_human,
            });
        }

        groups.get(projectId)!.activities.push(activity);
    });

    // Sort groups by latest activity (most recent first)
    return Array.from(groups.values()).sort((a, b) => {
        const aLatest = a.activities[0]?.created_at || '';
        const bLatest = b.activities[0]?.created_at || '';
        return bLatest.localeCompare(aLatest);
    });
}

function ActivitySkeleton() {
    return (
        <div className="relative pl-6">
            {/* Timeline dot */}
            <div className="absolute left-0 top-5 -translate-x-1/2">
                <Skeleton className="size-2.5 rounded-full" />
            </div>
            {/* Card skeleton */}
            <div className="pb-4">
                <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="size-6 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-4 w-3/4" />
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-5 w-24 rounded-full" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Project group with continuous timeline
function ProjectTimelineGroup({
    group,
    groupIndex,
    isLastGroup,
}: {
    group: ProjectGroup;
    groupIndex: number;
    isLastGroup: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="relative"
        >
            {/* Project header - with icon, no timeline connection */}
            <div className="flex items-center gap-3 pb-4">
                {/* Project icon */}
                <div
                    className="flex size-7 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${group.projectColor}20` }}
                >
                    <FolderOpen className="size-4" style={{ color: group.projectColor }} />
                </div>
                {/* Project info */}
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{group.projectName}</h3>
                    <span className="text-xs text-muted-foreground">
                        {group.activities.length} {group.activities.length === 1 ? 'activity' : 'activities'}
                    </span>
                    <span className="text-xs text-muted-foreground">• {group.latestActivityTime}</span>
                </div>
            </div>

            {/* Activities with timeline */}
            <div className="relative ml-3">
                {/* Continuous timeline line - only for activities */}
                <div
                    className="absolute left-0 top-0 w-0.5 rounded-full"
                    style={{
                        backgroundColor: group.projectColor,
                        opacity: 0.3,
                        // Line from first dot to last dot
                        top: '20px',
                        height: `calc(100% - ${isLastGroup ? '44px' : '24px'})`,
                    }}
                />

                {/* Activities in this project */}
                {group.activities.map((activity, index) => (
                    <div key={activity.id} className="relative pb-4 pl-6">
                        {/* Activity dot - centered on the timeline line */}
                        <div
                            className="absolute left-0 top-5 z-10 -translate-x-1/2 size-2.5 rounded-full ring-[3px] ring-background"
                            style={{ backgroundColor: group.projectColor }}
                        />
                        {/* Activity card */}
                        <ActivityItem activity={activity} index={groupIndex * 10 + index} />
                    </div>
                ))}
            </div>

            {/* Spacer between project groups */}
            {!isLastGroup && <div className="h-6" />}
        </motion.div>
    );
}

export function ActivityTimeline({
    activities,
    isLoading,
    hasMore,
    onLoadMore,
}: ActivityTimelineProps) {
    const projectGroups = useMemo(
        () => groupActivitiesByProject(activities),
        [activities]
    );

    if (isLoading && activities.length === 0) {
        return (
            <div className="relative ml-3">
                {/* Skeleton timeline line */}
                <div className="absolute left-0 top-5 h-[calc(100%-44px)] w-0.5 rounded-full bg-muted opacity-30" />
                <div className="flex flex-col">
                    {[...Array(5)].map((_, i) => (
                        <ActivitySkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col"
        >
            <AnimatePresence mode="popLayout">
                {projectGroups.map((group, groupIndex) => (
                    <ProjectTimelineGroup
                        key={group.projectId}
                        group={group}
                        groupIndex={groupIndex}
                        isLastGroup={groupIndex === projectGroups.length - 1}
                    />
                ))}
            </AnimatePresence>

            {hasMore && (
                <motion.div
                    className="flex justify-center pt-4 pl-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
                        {isLoading ? 'Loading...' : 'Load more'}
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
}
