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
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { softToastSuccess } from '@/components/shadcn-studio/soft-sonner';
import AppLayout from '@/layouts/app-layout';
import { CreateProjectDialog } from '@/pages/projects/components/create-project-dialog';
import { DeleteProjectDialog } from '@/pages/projects/components/delete-project-dialog';
import { EditProjectDialog } from '@/pages/projects/components/edit-project-dialog';
import { ShowProjectDialog } from '@/pages/projects/components/show-project-dialog';
import { getProjectIcon } from '@/pages/projects/lib/project-icons';
import { archive, index } from '@/routes/projects';
import { index as listsIndex } from '@/routes/projects/lists';
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
    Plus,
    Search,
    Trash2,
    Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';

interface Project {
    id: number;
    user_id: number;
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
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
    const [sortBy, setSortBy] = useState<'recent' | 'name' | 'created'>('recent');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingProject, setViewingProject] = useState<Project | null>(null);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [deletingProject, setDeletingProject] = useState<Project | null>(null);

    const filteredProjects = useMemo(() => {
        return projects
            .filter((project) => {
                // Filter by status
                if (filter === 'active' && project.is_archived) return false;
                if (filter === 'archived' && !project.is_archived) return false;

                // Filter by search query
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    return (
                        project.name.toLowerCase().includes(query) ||
                        project.description?.toLowerCase().includes(query)
                    );
                }

                return true;
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case 'name':
                        return a.name.localeCompare(b.name);
                    case 'created':
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    case 'recent':
                    default:
                        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
                }
            });
    }, [projects, filter, sortBy, searchQuery]);

    const activeCount = projects.filter((p) => !p.is_archived).length;
    const archivedCount = projects.filter((p) => p.is_archived).length;

    const handleArchive = (project: Project) => {
        router.patch(
            archive(project).url,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    softToastSuccess(
                        project.is_archived ? 'Project restored successfully' : 'Project archived successfully',
                    );
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Projects" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                {/* Hero Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div className="flex items-center gap-4">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                            className="flex size-14 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/25"
                        >
                            <FolderKanban className="size-7" />
                        </motion.div>
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="text-2xl font-bold tracking-tight md:text-3xl"
                            >
                                Projects
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="text-muted-foreground"
                            >
                                Manage and organize your projects
                            </motion.p>
                        </div>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                    >
                        <CreateProjectDialog />
                    </motion.div>
                </motion.div>

                {/* Filters & Search */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="flex flex-wrap items-end justify-between gap-4"
                >
                    {/* Status Filter */}
                    <div className="flex gap-1 rounded-lg border bg-muted/30 p-1">
                        <Button
                            variant={filter === 'active' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter('active')}
                            className="gap-1.5"
                        >
                            Active
                            <Badge variant={filter === 'active' ? 'secondary' : 'outline'} className="ml-1">
                                {activeCount}
                            </Badge>
                        </Button>
                        <Button
                            variant={filter === 'archived' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter('archived')}
                            className="gap-1.5"
                        >
                            Archived
                            <Badge variant={filter === 'archived' ? 'secondary' : 'outline'} className="ml-1">
                                {archivedCount}
                            </Badge>
                        </Button>
                        <Button
                            variant={filter === 'all' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter('all')}
                            className="gap-1.5"
                        >
                            All
                            <Badge variant={filter === 'all' ? 'secondary' : 'outline'} className="ml-1">
                                {projects.length}
                            </Badge>
                        </Button>
                    </div>

                    {/* Sort & Search */}
                    <div className="flex items-center gap-3">
                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                            <SelectTrigger className="h-9 w-44">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="recent">Recently Updated</SelectItem>
                                <SelectItem value="created">Date Created</SelectItem>
                                <SelectItem value="name">Name</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="group relative">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <Input
                                type="text"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 w-50 pl-9 transition-all duration-200 focus:w-65"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Projects Grid */}
                {filteredProjects.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredProjects.map((project, idx) => {
                            const ProjectIcon = getProjectIcon(project.icon);
                            return (
                                <motion.div
                                    key={project.id}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.3, delay: idx * 0.05 }}
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
                                                        <ProjectIcon
                                                            className="size-5"
                                                            style={{ color: project.color }}
                                                        />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <CardTitle className="truncate text-base">
                                                            {project.name}
                                                        </CardTitle>
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
                                                            <Link href={listsIndex(project).url}>
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
                                                <CardDescription className="line-clamp-2 pt-2">
                                                    {project.description}
                                                </CardDescription>
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
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="size-4" />
                                                    <span>{project.members_count + 1}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                    >
                        {searchQuery ? (
                            <Empty className="border">
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <Search />
                                    </EmptyMedia>
                                    <EmptyTitle>No results found</EmptyTitle>
                                    <EmptyDescription>
                                        No projects found matching "{searchQuery}". Try a different search term.
                                    </EmptyDescription>
                                </EmptyHeader>
                                <EmptyContent>
                                    <Button variant="outline" onClick={() => setSearchQuery('')}>
                                        Clear search
                                    </Button>
                                </EmptyContent>
                            </Empty>
                        ) : filter === 'archived' ? (
                            <Empty className="border">
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <Archive />
                                    </EmptyMedia>
                                    <EmptyTitle>No archived projects</EmptyTitle>
                                    <EmptyDescription>
                                        Archived projects will appear here. You can archive projects from the project
                                        menu.
                                    </EmptyDescription>
                                </EmptyHeader>
                            </Empty>
                        ) : (
                            /* Custom empty state with bouncing badge */
                            <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-20">
                                <div className="relative mb-6">
                                    <div className="flex size-24 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 shadow-xl shadow-primary/10">
                                        <FolderKanban className="size-12 text-primary" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 flex size-8 animate-bounce items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                                        <Plus className="size-4" />
                                    </div>
                                </div>
                                <h3 className="mb-2 text-xl font-semibold">No projects yet</h3>
                                <p className="mb-6 max-w-sm text-center text-muted-foreground">
                                    Create your first project to start organizing your tasks and collaborate with
                                    Kanban boards.
                                </p>
                                <CreateProjectDialog
                                    trigger={
                                        <Button
                                            size="lg"
                                            className="gap-2 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
                                        >
                                            <Plus className="size-4" />
                                            Create your first project
                                        </Button>
                                    }
                                />
                            </div>
                        )}
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
