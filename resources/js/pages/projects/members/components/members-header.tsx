import { Button } from '@/components/ui/button';
import { getProjectIcon } from '@/pages/projects/lib/project-icons';
import { index as listsIndex } from '@/routes/projects/lists';
import { Link } from '@inertiajs/react';
import { ArrowLeft, UserPlus, Users } from 'lucide-react';
import { motion } from 'motion/react';
import type { CSSProperties } from 'react';
import { createElement, memo } from 'react';
import type { ProjectWithMembers } from '../lib/types';

// Memoized project icon component
const ProjectIconDisplay = memo(function ProjectIconDisplay({
    iconName,
    className,
    style,
}: {
    iconName: string | null;
    className?: string;
    style?: CSSProperties;
}) {
    const Icon = getProjectIcon(iconName);
    return createElement(Icon, { className, style });
});

interface MembersHeaderProps {
    project: ProjectWithMembers;
    membersCount: number;
    canManageMembers: boolean;
    onAddMember: () => void;
}

export function MembersHeader({
    project,
    membersCount,
    canManageMembers,
    onAddMember,
}: MembersHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            {/* Project Info */}
            <div className="flex items-center gap-3 sm:gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="shrink-0"
                >
                    <Link href={listsIndex(project).url}>
                        <ArrowLeft className="size-4" />
                    </Link>
                </Button>
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                        duration: 0.5,
                        type: 'spring',
                        stiffness: 200,
                    }}
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg shadow-lg sm:size-14 sm:rounded-xl"
                    style={{ backgroundColor: `${project.color}20` }}
                >
                    <ProjectIconDisplay
                        iconName={project.icon}
                        className="size-5 sm:size-7"
                        style={{ color: project.color }}
                    />
                </motion.div>
                <div className="min-w-0">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="truncate text-xl font-bold tracking-tight sm:text-2xl md:text-3xl"
                    >
                        Team Members
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex items-center gap-2 text-sm text-muted-foreground sm:text-base"
                    >
                        <Users className="size-3.5 shrink-0 sm:size-4" />
                        <span className="truncate">
                            {membersCount}{' '}
                            {membersCount === 1 ? 'member' : 'members'} in{' '}
                            <span className="hidden sm:inline">
                                {project.name}
                            </span>
                            <span className="sm:hidden">project</span>
                        </span>
                    </motion.div>
                </div>
            </div>

            {/* Actions - Only show for users who can manage members (Pro plan) */}
            {canManageMembers && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                >
                    <Button
                        onClick={onAddMember}
                        className="gap-2 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
                    >
                        <UserPlus className="size-4" />
                        Add Member
                    </Button>
                </motion.div>
            )}
        </motion.div>
    );
}
