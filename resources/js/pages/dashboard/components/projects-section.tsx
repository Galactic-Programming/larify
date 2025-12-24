import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    FolderKanban,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { RecentProject } from './types';

interface ProjectsSectionProps {
    projects: RecentProject[];
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
        >
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FolderKanban className="size-5 text-primary" />
                            Recent Projects
                        </CardTitle>
                        <CardDescription>
                            Your most recently updated projects
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/projects">
                            View all
                            <ArrowRight className="ml-1 size-3.5" />
                        </Link>
                    </Button>
                </CardHeader>

                <CardContent>
                    {projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="rounded-full bg-muted p-3">
                                <FolderKanban className="size-8 text-muted-foreground" />
                            </div>
                            <h3 className="mt-4 font-semibold">No projects yet</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Create your first project to get started.
                            </p>
                            <Button variant="outline" className="mt-4" asChild>
                                <Link href="/projects">
                                    Go to Projects
                                    <ArrowRight className="ml-1 size-3.5" />
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {projects.map((project, index) => (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: index * 0.05,
                                    }}
                                >
                                    <Link
                                        href={`/projects/${project.id}/lists`}
                                        className="group block"
                                    >
                                        <div className="rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md">
                                            {/* Header */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div
                                                        className="size-3 shrink-0 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                project.color,
                                                        }}
                                                    />
                                                    <h4 className="truncate font-medium text-foreground group-hover:text-primary transition-colors">
                                                        {project.name}
                                                    </h4>
                                                </div>
                                                {project.progress === 100 && (
                                                    <CheckCircle2 className="size-4 shrink-0 text-green-500" />
                                                )}
                                            </div>

                                            {/* Progress */}
                                            <div className="mt-3">
                                                <div className="mb-1.5 flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">
                                                        {project.completed_tasks_count} of{' '}
                                                        {project.tasks_count} tasks
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'font-medium',
                                                            project.progress === 100
                                                                ? 'text-green-500'
                                                                : 'text-foreground',
                                                        )}
                                                    >
                                                        {project.progress}%
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={project.progress}
                                                    className="h-1.5"
                                                />
                                            </div>

                                            {/* Footer */}
                                            <div className="mt-3 text-xs text-muted-foreground">
                                                Updated {formatDate(project.updated_at)}
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
