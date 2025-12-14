import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { getProjectIcon } from '@/pages/projects/lib/project-icons';
import type { Project } from '@/pages/projects/lib/types';
import {
    Archive,
    Calendar,
    CheckSquare,
    LayoutList,
    Palette,
    Users,
} from 'lucide-react';
import { createElement, memo } from 'react';

// Memoized component to avoid "Cannot create components during render" error
const ProjectIconDisplay = memo(function ProjectIconDisplay({
    iconName,
    className,
}: {
    iconName: string | null;
    className?: string;
}) {
    const Icon = getProjectIcon(iconName);
    return createElement(Icon, { className });
});

interface ShowProjectDialogProps {
    project: Project | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ShowProjectDialog({ project, open, onOpenChange }: ShowProjectDialogProps) {
    if (!project) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-lg"
                            style={{ backgroundColor: project.color }}
                        >
                            <ProjectIconDisplay iconName={project.icon} className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-xl">{project.name}</DialogTitle>
                            <DialogDescription className="sr-only">
                                Project details for {project.name}
                            </DialogDescription>
                        </div>
                        {project.is_archived && (
                            <Badge variant="secondary" className="gap-1">
                                <Archive className="h-3 w-3" />
                                Archived
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                    {/* Description */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                        <p className="text-sm leading-relaxed">
                            {project.description || (
                                <span className="italic text-muted-foreground">
                                    No description
                                </span>
                            )}
                        </p>
                    </div>

                    <Separator />

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="flex flex-col items-center rounded-lg border bg-muted/30 p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                <LayoutList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="mt-2 text-2xl font-bold">{project.lists_count}</span>
                            <span className="text-xs text-muted-foreground">Lists</span>
                        </div>

                        <div className="flex flex-col items-center rounded-lg border bg-muted/30 p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                <CheckSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="mt-2 text-2xl font-bold">{project.tasks_count}</span>
                            <span className="text-xs text-muted-foreground">Tasks</span>
                        </div>

                        <div className="flex flex-col items-center rounded-lg border bg-muted/30 p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="mt-2 text-2xl font-bold">{project.members_count + 1}</span>
                            <span className="text-xs text-muted-foreground">Members</span>
                        </div>

                        <div className="flex flex-col items-center rounded-lg border bg-muted/30 p-4">
                            <div
                                className="flex h-10 w-10 items-center justify-center rounded-full"
                                style={{ backgroundColor: `${project.color}20` }}
                            >
                                <Palette className="h-5 w-5" style={{ color: project.color }} />
                            </div>
                            <div
                                className="mt-2 h-6 w-6 rounded-full border-2 border-white shadow-sm dark:border-gray-800"
                                style={{ backgroundColor: project.color }}
                            />
                            <span className="text-xs text-muted-foreground">Color</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Timestamps */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Created:</span>
                            <span className="font-medium">{formatDate(project.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Last updated:</span>
                            <span className="font-medium">{formatDate(project.updated_at)}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
