import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getProjectIcon } from '@/pages/projects/lib/project-icons';
import { index as listsIndex } from '@/routes/projects/lists';
import { Link } from '@inertiajs/react';
import { Archive, CheckSquare, Crown, LayoutList, Shield, Eye, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { createElement, memo } from 'react';
import type { Project } from '../lib/types';
import { ProjectDropdownMenu } from './project-dropdown-menu';

// Memoized component to avoid "Cannot create components during render" error
const ProjectIconDisplay = memo(function ProjectIconDisplay({
    iconName,
    className,
    style,
}: {
    iconName: string | null;
    className?: string;
    style?: React.CSSProperties;
}) {
    const Icon = getProjectIcon(iconName);
    return createElement(Icon, { className, style });
});

interface ProjectCardProps {
    project: Project;
    index: number;
    onView: (project: Project) => void;
    onEdit: (project: Project) => void;
    onArchive: (project: Project) => void;
    onDelete: (project: Project) => void;
}

export function ProjectCard({
    project,
    index,
    onView,
    onEdit,
    onArchive,
    onDelete,
}: ProjectCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
        >
            <Card
                className={`group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${project.is_archived ? 'opacity-60' : ''}`}
            >
                {/* Color accent bar */}
                <div
                    className="absolute inset-x-0 top-0 h-1.5 transition-all duration-300 group-hover:h-2"
                    style={{ backgroundColor: project.color }}
                />

                {/* Shine effect on hover */}
                <div className="pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />

                <CardHeader className="pb-3 pt-4">
                    <div className="flex items-start justify-between gap-2">
                        <Link
                            href={listsIndex(project).url}
                            className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-80"
                        >
                            <div
                                className="flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                                style={{ backgroundColor: `${project.color}20` }}
                            >
                                <ProjectIconDisplay
                                    iconName={project.icon}
                                    className="size-5"
                                    style={{ color: project.color }}
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <CardTitle className="truncate text-base">{project.name}</CardTitle>
                                <div className="mt-1 flex items-center gap-1.5">
                                    {project.is_archived && (
                                        <Badge variant="secondary" className="text-xs">
                                            <Archive className="mr-1 size-3" />
                                            Archived
                                        </Badge>
                                    )}
                                    {!project.is_owner && project.my_role && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        project.my_role === 'editor'
                                                            ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                                            : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'
                                                    }
                                                >
                                                    {project.my_role === 'editor' ? (
                                                        <Shield className="mr-1 size-3" />
                                                    ) : (
                                                        <Eye className="mr-1 size-3" />
                                                    )}
                                                    {project.my_role === 'editor' ? 'Editor' : 'Viewer'}
                                                </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                Shared by {project.user?.name ?? 'Unknown'}
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                </div>
                            </div>
                        </Link>
                        <ProjectDropdownMenu
                            project={project}
                            onView={onView}
                            onEdit={onEdit}
                            onArchive={onArchive}
                            onDelete={onDelete}
                        />
                    </div>
                    <CardDescription className="line-clamp-2 min-h-10 pt-2">
                        {project.description || <span className="text-transparent">-</span>}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <LayoutList className="size-4" />
                            <span>{project.lists_count} lists</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CheckSquare className="size-4" />
                            <span>{project.tasks_count} tasks</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Users className="size-4" />
                            <span>{project.members_count + 1}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
