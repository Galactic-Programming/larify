import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { softToastSuccess } from '@/components/shadcn-studio/soft-sonner';
import AppLayout from '@/layouts/app-layout';
import { CreateProjectDialog } from '@/pages/projects/components/create-project-dialog';
import { DeleteProjectDialog } from '@/pages/projects/components/delete-project-dialog';
import { EditProjectDialog } from '@/pages/projects/components/edit-project-dialog';
import { ShowProjectDialog } from '@/pages/projects/components/show-project-dialog';
import { archive, index, show } from '@/routes/projects';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Archive,
    ArchiveRestore,
    CheckSquare,
    Eye,
    FolderKanban,
    LayoutList,
    MoreHorizontal,
    Pencil,
    Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface Project {
    id: number;
    user_id: number;
    name: string;
    description: string | null;
    color: string;
    is_archived: boolean;
    lists_count: number;
    tasks_count: number;
    members_count: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    projects: Project[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Projects',
        href: index().url,
    },
];

export default function ProjectsIndex({ projects }: Props) {
    const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active');
    const [viewingProject, setViewingProject] = useState<Project | null>(null);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [deletingProject, setDeletingProject] = useState<Project | null>(null);

    const filteredProjects = projects.filter((project) => {
        if (filter === 'active') return !project.is_archived;
        if (filter === 'archived') return project.is_archived;
        return true;
    });

    const activeCount = projects.filter((p) => !p.is_archived).length;
    const archivedCount = projects.filter((p) => p.is_archived).length;

    const handleArchive = (project: Project) => {
        router.patch(archive(project).url, {}, {
            preserveScroll: true,
            onSuccess: () => {
                softToastSuccess(project.is_archived ? 'Project restored successfully' : 'Project archived successfully');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Projects" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Projects</h1>
                        <p className="text-muted-foreground">Manage and organize your projects</p>
                    </div>
                    <CreateProjectDialog />
                </motion.div>

                {/* Filter Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="flex gap-2"
                >
                    <Button
                        variant={filter === 'active' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('active')}
                    >
                        Active
                        <Badge variant="secondary" className="ml-2">
                            {activeCount}
                        </Badge>
                    </Button>
                    <Button
                        variant={filter === 'archived' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('archived')}
                    >
                        Archived
                        <Badge variant="secondary" className="ml-2">
                            {archivedCount}
                        </Badge>
                    </Button>
                    <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
                        All
                        <Badge variant="secondary" className="ml-2">
                            {projects.length}
                        </Badge>
                    </Button>
                </motion.div>

                {/* Projects Grid */}
                {filteredProjects.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredProjects.map((project, idx) => (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: idx * 0.05 }}
                            >
                                <Card
                                    className={`group relative overflow-hidden transition-all hover:shadow-md ${project.is_archived ? 'opacity-60' : ''
                                        }`}
                                >
                                    {/* Color accent bar */}
                                    <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: project.color }} />

                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <Link
                                                href={show(project).url}
                                                className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80"
                                            >
                                                <div
                                                    className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                                                    style={{ backgroundColor: `${project.color}20` }}
                                                >
                                                    <FolderKanban className="size-5" style={{ color: project.color }} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <CardTitle className="truncate text-base">{project.name}</CardTitle>
                                                    {project.is_archived && (
                                                        <Badge variant="secondary" className="mt-1 text-xs">
                                                            <Archive className="mr-1 size-3" />
                                                            Archived
                                                        </Badge>
                                                    )}
                                                </div>
                                            </Link>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="opacity-0 transition-opacity group-hover:opacity-100"
                                                    >
                                                        <MoreHorizontal className="size-4" />
                                                        <span className="sr-only">Open menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setViewingProject(project)}>
                                                        <Eye className="mr-2 size-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={show(project).url}>
                                                            <FolderKanban className="mr-2 size-4" />
                                                            Open Board
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setEditingProject(project)}>
                                                        <Pencil className="mr-2 size-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleArchive(project)}>
                                                        {project.is_archived ? (
                                                            <>
                                                                <ArchiveRestore className="mr-2 size-4" />
                                                                Restore
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Archive className="mr-2 size-4" />
                                                                Archive
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => setDeletingProject(project)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 size-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        {project.description && (
                                            <CardDescription className="line-clamp-2 pt-2">{project.description}</CardDescription>
                                        )}
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
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        <Empty className="border">
                            <EmptyHeader>
                                <EmptyMedia variant="icon">
                                    {filter === 'archived' ? <Archive /> : <FolderKanban />}
                                </EmptyMedia>
                                <EmptyTitle>
                                    {filter === 'archived' ? 'No archived projects' : 'No projects yet'}
                                </EmptyTitle>
                                <EmptyDescription>
                                    {filter === 'archived'
                                        ? 'Archived projects will appear here. You can archive projects from the project menu.'
                                        : 'Get started by creating your first project to organize your tasks with Kanban boards.'}
                                </EmptyDescription>
                            </EmptyHeader>
                            {filter !== 'archived' && (
                                <EmptyContent>
                                    <CreateProjectDialog />
                                </EmptyContent>
                            )}
                        </Empty>
                    </motion.div>
                )}
            </div>

            {/* Show Project Dialog */}
            {viewingProject && (
                <ShowProjectDialog
                    project={viewingProject}
                    open={!!viewingProject}
                    onOpenChange={(open) => !open && setViewingProject(null)}
                />
            )}

            {/* Edit Project Dialog */}
            {editingProject && (
                <EditProjectDialog
                    project={editingProject}
                    open={!!editingProject}
                    onOpenChange={(open) => !open && setEditingProject(null)}
                />
            )}

            {/* Delete Project Dialog */}
            {deletingProject && (
                <DeleteProjectDialog
                    project={deletingProject}
                    open={!!deletingProject}
                    onOpenChange={(open) => !open && setDeletingProject(null)}
                />
            )}
        </AppLayout>
    );
}
