import {
    SelectableStatusBadge,
    type StatusType,
} from '@/components/status-badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from '@/hooks/use-translations';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    BookOpen,
    Briefcase,
    ChartBar,
    Code,
    Database,
    FileText,
    Folder,
    FolderKanban,
    Globe,
    Layers,
    Layout,
    Lightbulb,
    Loader2,
    Lock,
    MessageSquare,
    MoreHorizontal,
    Package,
    Palette,
    Pencil,
    PenTool,
    Plus,
    Rocket,
    Search,
    Server,
    ShoppingCart,
    Smartphone,
    Target,
    Trash2,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export interface Project {
    id: number;
    name: string;
    description?: string;
    color: string;
    icon?: string;
    status: 'active' | 'archived' | 'completed';
    visibility: 'private' | 'public';
    due_date?: string;
    created_at?: string;
    updated_at?: string;
}

interface Props {
    projects?: Project[];
}

const projectColors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#22c55e', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#64748b', // slate
];

const projectIcons: { name: string; icon: LucideIcon }[] = [
    { name: 'folder', icon: Folder },
    { name: 'briefcase', icon: Briefcase },
    { name: 'code', icon: Code },
    { name: 'rocket', icon: Rocket },
    { name: 'target', icon: Target },
    { name: 'lightbulb', icon: Lightbulb },
    { name: 'users', icon: Users },
    { name: 'globe', icon: Globe },
    { name: 'layers', icon: Layers },
    { name: 'layout', icon: Layout },
    { name: 'package', icon: Package },
    { name: 'database', icon: Database },
    { name: 'server', icon: Server },
    { name: 'smartphone', icon: Smartphone },
    { name: 'shopping-cart', icon: ShoppingCart },
    { name: 'pen-tool', icon: PenTool },
    { name: 'file-text', icon: FileText },
    { name: 'book-open', icon: BookOpen },
    { name: 'message-square', icon: MessageSquare },
    { name: 'chart-bar', icon: ChartBar },
];

const getProjectIcon = (iconName?: string): LucideIcon => {
    if (!iconName) return Folder;
    const found = projectIcons.find((i) => i.name === iconName);
    return found?.icon ?? Folder;
};

// Helper to determine if a color is light or dark
const isLightColor = (color: string): boolean => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6;
};

export default function ProjectsIndex({
    projects: initialProjects = [],
}: Props) {
    const { t } = useTranslations();
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [filterBy, setFilterBy] = useState('all');
    const [visibilityFilter, setVisibilityFilter] = useState('all');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [deleteProject, setDeleteProject] = useState<Project | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editProject, setEditProject] = useState<Project | null>(null);

    // Sync with server data when it changes
    useEffect(() => {
        setProjects(initialProjects);
    }, [initialProjects]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('projects.title', 'Projects'), href: '/projects' },
    ];

    useEffect(() => {
        // Trigger mount animation after a small delay for smoother entrance
        const timer = setTimeout(() => setMounted(true), 50);
        return () => clearTimeout(timer);
    }, []);

    const handleDelete = () => {
        if (!deleteProject) return;

        setIsDeleting(true);
        router.delete(`/projects/${deleteProject.id}`, {
            onFinish: () => {
                setIsDeleting(false);
                setDeleteProject(null);
            },
        });
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        color: '#3b82f6',
        icon: 'folder',
        visibility: 'private' as 'private' | 'public',
    });

    const {
        data: editData,
        setData: setEditData,
        put,
        processing: editProcessing,
        errors: editErrors,
        reset: editReset,
    } = useForm({
        name: '',
        description: '',
        color: '#3b82f6',
        icon: 'folder',
        visibility: 'private' as 'private' | 'public',
    });

    const openEditSheet = (project: Project) => {
        setEditData({
            name: project.name,
            description: project.description || '',
            color: project.color,
            icon: project.icon || 'folder',
            visibility: project.visibility,
        });
        setEditProject(project);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editProject) return;

        put(`/projects/${editProject.id}`, {
            onSuccess: () => {
                setEditProject(null);
                editReset();
            },
        });
    };

    const filteredProjects = projects
        .filter((project) => {
            const matchesSearch = project.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            const matchesStatus =
                filterBy === 'all' || project.status === filterBy;
            const matchesVisibility =
                visibilityFilter === 'all' ||
                project.visibility === visibilityFilter;
            return matchesSearch && matchesStatus && matchesVisibility;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'created':
                    return (
                        new Date(b.created_at ?? 0).getTime() -
                        new Date(a.created_at ?? 0).getTime()
                    );
                case 'recent':
                default:
                    return (
                        new Date(b.updated_at ?? 0).getTime() -
                        new Date(a.updated_at ?? 0).getTime()
                    );
            }
        });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/projects', {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('projects.title', 'Projects')} />

            <div
                className={`flex h-full flex-1 flex-col p-6 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
            >
                {/* Hero Header */}
                <div className="mb-8">
                    <div className="mb-2 flex items-center gap-3">
                        <div
                            className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-700 ${mounted ? 'scale-100 rotate-0' : 'scale-0 -rotate-180'}`}
                        >
                            <FolderKanban className="size-6" />
                        </div>
                        <div>
                            <h1
                                className={`text-2xl font-bold transition-all delay-100 duration-500 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}
                            >
                                {t('projects.title', 'Projects')}
                            </h1>
                            <p
                                className={`text-sm text-muted-foreground transition-all delay-200 duration-500 ${mounted ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'}`}
                            >
                                {t(
                                    'projects.subtitle',
                                    'Manage and organize your work',
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div
                    className={`mb-6 flex flex-wrap items-end justify-between gap-4 transition-all delay-300 duration-500 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                >
                    <div className="flex items-center gap-4">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">
                                {t('projects.sort_by', 'Sort by')}
                            </span>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="h-9 w-[160px] transition-shadow duration-200 focus:shadow-md">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="recent">
                                        {t(
                                            'projects.recent_activity',
                                            'Recent activity',
                                        )}
                                    </SelectItem>
                                    <SelectItem value="name">
                                        {t(
                                            'projects.alphabetically',
                                            'Alphabetically',
                                        )}
                                    </SelectItem>
                                    <SelectItem value="created">
                                        {t(
                                            'projects.date_created',
                                            'Date created',
                                        )}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">
                                {t('projects.filter_by', 'Filter by')}
                            </span>
                            <Select
                                value={filterBy}
                                onValueChange={setFilterBy}
                            >
                                <SelectTrigger className="h-9 w-[160px] transition-shadow duration-200 focus:shadow-md">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        {t(
                                            'projects.all_projects',
                                            'All projects',
                                        )}
                                    </SelectItem>
                                    <SelectItem value="active">
                                        {t('projects.active', 'Active')}
                                    </SelectItem>
                                    <SelectItem value="archived">
                                        {t('projects.archived', 'Archived')}
                                    </SelectItem>
                                    <SelectItem value="completed">
                                        {t('projects.completed', 'Completed')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">
                                {t('projects.visibility', 'Visibility')}
                            </span>
                            <Select
                                value={visibilityFilter}
                                onValueChange={setVisibilityFilter}
                            >
                                <SelectTrigger className="h-9 w-[130px] transition-shadow duration-200 focus:shadow-md">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        {t('projects.all', 'All')}
                                    </SelectItem>
                                    <SelectItem value="private">
                                        {t('projects.private', 'Private')}
                                    </SelectItem>
                                    <SelectItem value="public">
                                        {t('projects.public', 'Public')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">
                            {t('projects.search', 'Search')}
                        </span>
                        <div className="group relative">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
                            <Input
                                type="text"
                                placeholder={t(
                                    'projects.search_placeholder',
                                    'Search projects...',
                                )}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 w-[200px] pl-9 transition-all duration-200 focus:w-[240px] focus:shadow-md"
                            />
                        </div>
                    </div>
                </div>

                {/* Projects Grid */}
                <div
                    className={`grid grid-cols-1 gap-4 transition-all delay-400 duration-500 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                >
                    {/* Create New - only show when there are projects */}
                    {projects.length > 0 && (
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className={`group relative flex aspect-[16/10] w-full items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-border transition-all duration-500 hover:scale-[1.02] hover:border-primary/50 hover:bg-primary/5 hover:shadow-xl hover:shadow-primary/20 ${mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                            style={{ transitionDelay: '450ms' }}
                        >
                            {/* Animated gradient background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/5 to-primary/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary),.1),transparent_70%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

                            <div className="relative flex items-center gap-2">
                                <div className="flex size-10 items-center justify-center rounded-full bg-muted/50 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/10">
                                    <Plus className="size-5 text-muted-foreground transition-all duration-500 group-hover:rotate-180 group-hover:text-primary" />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground transition-colors duration-300 group-hover:text-primary">
                                    Create new project
                                </span>
                            </div>
                        </button>
                    )}

                    {/* Project Cards */}
                    {filteredProjects.map((project, index) => {
                        const ProjectIcon = getProjectIcon(project.icon);
                        const isLight = isLightColor(project.color);
                        return (
                            <div
                                key={project.id}
                                className={`group relative flex aspect-[16/10] w-full cursor-pointer flex-col overflow-hidden rounded-xl transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl ${mounted ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-95 opacity-0'}`}
                                style={{
                                    backgroundColor: project.color,
                                    transitionDelay: mounted
                                        ? '0ms'
                                        : `${500 + (index + 1) * 100}ms`,
                                }}
                                onClick={() =>
                                    router.visit(`/projects/${project.id}`)
                                }
                            >
                                {/* Animated background patterns */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20" />
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                                {/* Project Icon - Background watermark */}
                                <div className="absolute top-3 left-3 z-0">
                                    <ProjectIcon
                                        className={`size-10 transition-all duration-300 group-hover:scale-110 ${isLight ? 'text-black/[0.12]' : 'text-white/[0.15]'}`}
                                    />
                                </div>

                                {/* More menu */}
                                <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button
                                                className={`flex size-8 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${isLight ? 'bg-black/10 hover:bg-black/20' : 'bg-black/20 hover:bg-black/40'}`}
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <MoreHorizontal
                                                    className={`size-4 ${isLight ? 'text-black/70' : 'text-white'}`}
                                                />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditSheet(project);
                                                }}
                                            >
                                                <Pencil className="mr-2 size-4" />
                                                {t(
                                                    'projects.edit_project',
                                                    'Edit project',
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="font-medium text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950/50"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteProject(project);
                                                }}
                                            >
                                                <Trash2 className="mr-2 size-4" />
                                                {t(
                                                    'projects.delete_project',
                                                    'Delete project',
                                                )}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Content */}
                                <div
                                    className={`absolute right-0 bottom-0 left-0 z-10 flex flex-col justify-end p-4 transition-all duration-200 ${isLight ? 'bg-gradient-to-t from-black/60 via-black/30 to-transparent group-hover:from-black/70' : 'bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:from-black/90'}`}
                                >
                                    {/* Description - only visible on hover */}
                                    {project.description && (
                                        <p className="mb-1 max-h-0 overflow-hidden text-left text-xs text-white/80 opacity-0 transition-all duration-200 group-hover:max-h-20 group-hover:opacity-100">
                                            {project.description}
                                        </p>
                                    )}
                                    {/* Name + Status & Visibility badges */}
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-left text-base font-semibold text-white drop-shadow-md">
                                            {project.name}
                                        </h3>
                                        <div className="flex items-center gap-1.5">
                                            {/* Private badge */}
                                            {project.visibility ===
                                                'private' && (
                                                <div className="flex size-5 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
                                                    <Lock className="size-2.5 text-white/90" />
                                                </div>
                                            )}
                                            {/* Status */}
                                            <SelectableStatusBadge
                                                status={
                                                    project.status as StatusType
                                                }
                                                onStatusChange={(newStatus) => {
                                                    // Optimistic update - update UI immediately
                                                    setProjects((prev) =>
                                                        prev.map((p) =>
                                                            p.id === project.id
                                                                ? {
                                                                      ...p,
                                                                      status: newStatus,
                                                                  }
                                                                : p,
                                                        ),
                                                    );
                                                    // Send to server in background
                                                    router.patch(
                                                        `/projects/${project.id}/status`,
                                                        { status: newStatus },
                                                        {
                                                            preserveScroll: true,
                                                            preserveState: true,
                                                        },
                                                    );
                                                }}
                                                size="sm"
                                                showChevron={false}
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                className="text-white [&>span]:text-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Shine effect on hover */}
                                <div
                                    className={`pointer-events-none absolute inset-0 -translate-x-full skew-x-12 bg-gradient-to-r from-transparent to-transparent transition-transform duration-500 ease-out group-hover:translate-x-full ${isLight ? 'via-black/10' : 'via-white/20'}`}
                                />

                                {/* Border glow */}
                                <div
                                    className={`pointer-events-none absolute inset-0 rounded-xl ring-2 transition-all duration-200 ${isLight ? 'ring-black/0 group-hover:ring-black/10' : 'ring-white/0 group-hover:ring-white/20'}`}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Empty State - No projects yet */}
                {filteredProjects.length === 0 && !searchQuery && (
                    <div
                        className={`flex flex-col items-center justify-center py-20 transition-all delay-500 duration-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                    >
                        <div className="relative mb-6">
                            <div className="flex size-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-xl shadow-primary/10">
                                <FolderKanban className="size-12 text-primary" />
                            </div>
                            <div className="absolute -top-2 -right-2 flex size-8 animate-bounce items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                                <Plus className="size-4" />
                            </div>
                        </div>
                        <h3 className="mb-2 text-xl font-semibold">
                            {t('projects.no_projects', 'No projects yet')}
                        </h3>
                        <p className="mb-6 max-w-sm text-center text-muted-foreground">
                            {t(
                                'projects.no_projects_desc',
                                'Create your first project to start organizing your tasks and collaborate with your team.',
                            )}
                        </p>
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            size="lg"
                            className="gap-2 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
                        >
                            <Plus className="size-4" />
                            {t(
                                'projects.create_first',
                                'Create your first project',
                            )}
                        </Button>
                    </div>
                )}

                {/* Empty State - Search no results */}
                {filteredProjects.length === 0 && searchQuery && (
                    <div className="animate-in py-16 text-center text-muted-foreground duration-300 zoom-in-95 fade-in">
                        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                            <Search className="size-6 text-muted-foreground" />
                        </div>
                        <p>
                            {t(
                                'projects.no_results',
                                'No projects found matching',
                            )}{' '}
                            "{searchQuery}"
                        </p>
                    </div>
                )}
            </div>

            {/* Create Sheet */}
            <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <SheetContent
                    side="right"
                    className="w-full overflow-y-auto sm:max-w-2xl"
                >
                    <div className="mx-auto max-w-lg py-6">
                        <SheetHeader className="text-left">
                            <SheetTitle className="animate-in text-2xl duration-500 fade-in slide-in-from-right-4">
                                {t(
                                    'projects.create_title',
                                    'Create new project',
                                )}
                            </SheetTitle>
                            <p className="animate-in text-muted-foreground delay-75 duration-500 fade-in slide-in-from-right-4">
                                {t(
                                    'projects.create_desc',
                                    'Fill in the details below to create your project.',
                                )}
                            </p>
                        </SheetHeader>

                        <form
                            onSubmit={handleSubmit}
                            className="mt-10 space-y-8"
                        >
                            {/* Name */}
                            <div
                                className="animate-in space-y-3 duration-500 fill-mode-both fade-in slide-in-from-right-4"
                                style={{ animationDelay: '100ms' }}
                            >
                                <Label htmlFor="name" className="text-base">
                                    {t('projects.project_name', 'Project name')}
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder={t(
                                        'projects.project_name_placeholder',
                                        'Enter project name',
                                    )}
                                    className="h-12 text-base transition-shadow duration-200 focus:shadow-lg focus:shadow-primary/10"
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div
                                className="animate-in space-y-3 duration-500 fill-mode-both fade-in slide-in-from-right-4"
                                style={{ animationDelay: '200ms' }}
                            >
                                <Label
                                    htmlFor="description"
                                    className="text-base"
                                >
                                    {t('projects.description', 'Description')}
                                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                                        {t(
                                            'projects.description_optional',
                                            '(optional)',
                                        )}
                                    </span>
                                </Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    placeholder={t(
                                        'projects.description_placeholder',
                                        "What's this project about?",
                                    )}
                                    className="min-h-[120px] resize-none text-base transition-shadow duration-200 focus:shadow-lg focus:shadow-primary/10"
                                />
                            </div>

                            {/* Color */}
                            <div
                                className="animate-in space-y-3 duration-500 fill-mode-both fade-in slide-in-from-right-4"
                                style={{ animationDelay: '300ms' }}
                            >
                                <Label className="text-base">
                                    {t(
                                        'projects.project_color',
                                        'Project color',
                                    )}
                                </Label>
                                <div className="flex items-center gap-3">
                                    {projectColors.map((color, index) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() =>
                                                setData('color', color)
                                            }
                                            className={`size-10 animate-in rounded-full transition-all duration-200 fill-mode-both zoom-in-50 fade-in hover:scale-110 hover:shadow-lg ${
                                                data.color === color
                                                    ? 'scale-110 ring-2 ring-foreground ring-offset-4'
                                                    : ''
                                            }`}
                                            style={{
                                                backgroundColor: color,
                                                animationDelay: `${350 + index * 50}ms`,
                                            }}
                                        />
                                    ))}
                                    {/* Custom color picker */}
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={data.color}
                                            onChange={(e) =>
                                                setData('color', e.target.value)
                                            }
                                            className="absolute inset-0 size-10 cursor-pointer opacity-0"
                                        />
                                        <div
                                            className={`flex size-10 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/50 transition-all duration-200 hover:scale-110 hover:border-foreground ${
                                                !projectColors.includes(
                                                    data.color,
                                                )
                                                    ? 'ring-2 ring-foreground ring-offset-4'
                                                    : ''
                                            }`}
                                            style={{
                                                backgroundColor:
                                                    !projectColors.includes(
                                                        data.color,
                                                    )
                                                        ? data.color
                                                        : 'transparent',
                                            }}
                                        >
                                            {projectColors.includes(
                                                data.color,
                                            ) && (
                                                <Palette className="size-4 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Icon */}
                            <div
                                className="animate-in space-y-3 duration-500 fill-mode-both fade-in slide-in-from-right-4"
                                style={{ animationDelay: '350ms' }}
                            >
                                <Label className="text-base">
                                    Project icon
                                </Label>
                                <div className="grid grid-cols-10 gap-2">
                                    {projectIcons.map(
                                        ({ name, icon: Icon }) => (
                                            <button
                                                key={name}
                                                type="button"
                                                onClick={() =>
                                                    setData('icon', name)
                                                }
                                                className={`flex size-10 items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 ${
                                                    data.icon === name
                                                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                                                        : 'bg-muted hover:bg-muted/80'
                                                }`}
                                            >
                                                <Icon className="size-5" />
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>

                            {/* Visibility */}
                            <div
                                className="animate-in space-y-3 duration-500 fill-mode-both fade-in slide-in-from-right-4"
                                style={{ animationDelay: '400ms' }}
                            >
                                <Label className="text-base">
                                    {t(
                                        'projects.visibility_label',
                                        'Visibility',
                                    )}
                                </Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setData('visibility', 'private')
                                        }
                                        className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-md ${
                                            data.visibility === 'private'
                                                ? 'border-foreground bg-foreground/5 shadow-md'
                                                : 'border-border hover:border-foreground/30 hover:bg-muted/50'
                                        }`}
                                    >
                                        <Lock
                                            className={`size-6 transition-transform duration-200 ${
                                                data.visibility === 'private'
                                                    ? 'scale-110 text-foreground'
                                                    : 'text-muted-foreground'
                                            }`}
                                        />
                                        <div className="text-center">
                                            <p
                                                className={`font-medium ${
                                                    data.visibility ===
                                                    'private'
                                                        ? 'text-foreground'
                                                        : 'text-foreground'
                                                }`}
                                            >
                                                {t(
                                                    'projects.private_label',
                                                    'Private',
                                                )}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {t(
                                                    'projects.private_desc',
                                                    'Only you can access',
                                                )}
                                            </p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setData('visibility', 'public')
                                        }
                                        className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-md ${
                                            data.visibility === 'public'
                                                ? 'border-foreground bg-foreground/5 shadow-md'
                                                : 'border-border hover:border-foreground/30 hover:bg-muted/50'
                                        }`}
                                    >
                                        <Globe
                                            className={`size-6 transition-transform duration-200 ${
                                                data.visibility === 'public'
                                                    ? 'scale-110 text-foreground'
                                                    : 'text-muted-foreground'
                                            }`}
                                        />
                                        <div className="text-center">
                                            <p
                                                className={`font-medium ${
                                                    data.visibility === 'public'
                                                        ? 'text-foreground'
                                                        : 'text-foreground'
                                                }`}
                                            >
                                                {t(
                                                    'projects.public_label',
                                                    'Public',
                                                )}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {t(
                                                    'projects.public_desc',
                                                    'Anyone can view',
                                                )}
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div
                                className="flex animate-in gap-4 pt-6 duration-500 fill-mode-both fade-in slide-in-from-bottom-4"
                                style={{ animationDelay: '500ms' }}
                            >
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    className="flex-1 transition-all duration-200 hover:shadow-md"
                                    onClick={() => setIsCreateOpen(false)}
                                >
                                    {t('projects.cancel', 'Cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="flex-1 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
                                    disabled={processing || !data.name}
                                >
                                    {processing && (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                    )}
                                    {t('projects.create_btn', 'Create project')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Edit Sheet */}
            <Sheet
                open={!!editProject}
                onOpenChange={(open) => !open && setEditProject(null)}
            >
                <SheetContent
                    side="right"
                    className="w-full overflow-y-auto sm:max-w-2xl"
                >
                    <div className="mx-auto max-w-lg py-6">
                        <SheetHeader className="text-left">
                            <SheetTitle className="animate-in text-2xl duration-500 fade-in slide-in-from-right-4">
                                {t('projects.edit_title', 'Edit project')}
                            </SheetTitle>
                            <p className="animate-in text-muted-foreground delay-75 duration-500 fade-in slide-in-from-right-4">
                                {t(
                                    'projects.edit_desc',
                                    'Update your project details below.',
                                )}
                            </p>
                        </SheetHeader>

                        <form
                            onSubmit={handleEditSubmit}
                            className="mt-10 space-y-8"
                        >
                            {/* Name */}
                            <div
                                className="animate-in space-y-3 duration-500 fill-mode-both fade-in slide-in-from-right-4"
                                style={{ animationDelay: '100ms' }}
                            >
                                <Label
                                    htmlFor="edit-name"
                                    className="text-base"
                                >
                                    {t('projects.project_name', 'Project name')}
                                </Label>
                                <Input
                                    id="edit-name"
                                    value={editData.name}
                                    onChange={(e) =>
                                        setEditData('name', e.target.value)
                                    }
                                    placeholder={t(
                                        'projects.project_name_placeholder',
                                        'Enter project name',
                                    )}
                                    className="h-12 text-base transition-shadow duration-200 focus:shadow-lg focus:shadow-primary/10"
                                />
                                {editErrors.name && (
                                    <p className="text-sm text-destructive">
                                        {editErrors.name}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div
                                className="animate-in space-y-3 duration-500 fill-mode-both fade-in slide-in-from-right-4"
                                style={{ animationDelay: '200ms' }}
                            >
                                <Label
                                    htmlFor="edit-description"
                                    className="text-base"
                                >
                                    {t('projects.description', 'Description')}
                                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                                        {t(
                                            'projects.description_optional',
                                            '(optional)',
                                        )}
                                    </span>
                                </Label>
                                <Textarea
                                    id="edit-description"
                                    value={editData.description}
                                    onChange={(e) =>
                                        setEditData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                    placeholder={t(
                                        'projects.description_placeholder',
                                        "What's this project about?",
                                    )}
                                    className="min-h-[120px] resize-none text-base transition-shadow duration-200 focus:shadow-lg focus:shadow-primary/10"
                                />
                            </div>

                            {/* Color */}
                            <div
                                className="animate-in space-y-3 duration-500 fill-mode-both fade-in slide-in-from-right-4"
                                style={{ animationDelay: '300ms' }}
                            >
                                <Label className="text-base">
                                    {t(
                                        'projects.project_color',
                                        'Project color',
                                    )}
                                </Label>
                                <div className="flex items-center gap-3">
                                    {projectColors.map((color, index) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() =>
                                                setEditData('color', color)
                                            }
                                            className={`size-10 animate-in rounded-full transition-all duration-200 fill-mode-both zoom-in-50 fade-in hover:scale-110 hover:shadow-lg ${
                                                editData.color === color
                                                    ? 'scale-110 ring-2 ring-foreground ring-offset-4'
                                                    : ''
                                            }`}
                                            style={{
                                                backgroundColor: color,
                                                animationDelay: `${350 + index * 50}ms`,
                                            }}
                                        />
                                    ))}
                                    {/* Custom color picker */}
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={editData.color}
                                            onChange={(e) =>
                                                setEditData(
                                                    'color',
                                                    e.target.value,
                                                )
                                            }
                                            className="absolute inset-0 size-10 cursor-pointer opacity-0"
                                        />
                                        <div
                                            className={`flex size-10 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/50 transition-all duration-200 hover:scale-110 hover:border-foreground ${
                                                !projectColors.includes(
                                                    editData.color,
                                                )
                                                    ? 'ring-2 ring-foreground ring-offset-4'
                                                    : ''
                                            }`}
                                            style={{
                                                backgroundColor:
                                                    !projectColors.includes(
                                                        editData.color,
                                                    )
                                                        ? editData.color
                                                        : 'transparent',
                                            }}
                                        >
                                            {projectColors.includes(
                                                editData.color,
                                            ) && (
                                                <Palette className="size-4 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Icon */}
                            <div
                                className="animate-in space-y-3 duration-500 fill-mode-both fade-in slide-in-from-right-4"
                                style={{ animationDelay: '350ms' }}
                            >
                                <Label className="text-base">
                                    {t('projects.project_icon', 'Project icon')}
                                </Label>
                                <div className="grid grid-cols-10 gap-2">
                                    {projectIcons.map(
                                        ({ name, icon: Icon }) => (
                                            <button
                                                key={name}
                                                type="button"
                                                onClick={() =>
                                                    setEditData('icon', name)
                                                }
                                                className={`flex size-10 items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 ${
                                                    editData.icon === name
                                                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                                                        : 'bg-muted hover:bg-muted/80'
                                                }`}
                                            >
                                                <Icon className="size-5" />
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>

                            {/* Visibility */}
                            <div
                                className="animate-in space-y-3 duration-500 fill-mode-both fade-in slide-in-from-right-4"
                                style={{ animationDelay: '400ms' }}
                            >
                                <Label className="text-base">
                                    {t(
                                        'projects.visibility_label',
                                        'Visibility',
                                    )}
                                </Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditData('visibility', 'private')
                                        }
                                        className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-md ${
                                            editData.visibility === 'private'
                                                ? 'border-foreground bg-foreground/5 shadow-md'
                                                : 'border-border hover:border-foreground/30 hover:bg-muted/50'
                                        }`}
                                    >
                                        <Lock
                                            className={`size-6 transition-transform duration-200 ${
                                                editData.visibility ===
                                                'private'
                                                    ? 'scale-110 text-foreground'
                                                    : 'text-muted-foreground'
                                            }`}
                                        />
                                        <div className="text-center">
                                            <p className="font-medium text-foreground">
                                                {t(
                                                    'projects.private_label',
                                                    'Private',
                                                )}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {t(
                                                    'projects.private_desc',
                                                    'Only you can access',
                                                )}
                                            </p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setEditData('visibility', 'public')
                                        }
                                        className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-md ${
                                            editData.visibility === 'public'
                                                ? 'border-foreground bg-foreground/5 shadow-md'
                                                : 'border-border hover:border-foreground/30 hover:bg-muted/50'
                                        }`}
                                    >
                                        <Globe
                                            className={`size-6 transition-transform duration-200 ${
                                                editData.visibility === 'public'
                                                    ? 'scale-110 text-foreground'
                                                    : 'text-muted-foreground'
                                            }`}
                                        />
                                        <div className="text-center">
                                            <p className="font-medium text-foreground">
                                                {t(
                                                    'projects.public_label',
                                                    'Public',
                                                )}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {t(
                                                    'projects.public_desc',
                                                    'Anyone can view',
                                                )}
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div
                                className="flex animate-in gap-4 pt-6 duration-500 fill-mode-both fade-in slide-in-from-bottom-4"
                                style={{ animationDelay: '500ms' }}
                            >
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    className="flex-1 transition-all duration-200 hover:shadow-md"
                                    onClick={() => setEditProject(null)}
                                >
                                    {t('projects.cancel', 'Cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="flex-1 transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
                                    disabled={editProcessing || !editData.name}
                                >
                                    {editProcessing && (
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                    )}
                                    {t('projects.save_btn', 'Save changes')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={!!deleteProject}
                onOpenChange={(open) => !open && setDeleteProject(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t('projects.delete_title', 'Delete project')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(
                                'projects.delete_confirm',
                                'Are you sure you want to delete',
                            )}{' '}
                            <span className="font-semibold text-foreground">
                                "{deleteProject?.name}"
                            </span>
                            {t(
                                'projects.delete_warning',
                                '? This action cannot be undone and all associated data will be permanently removed.',
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            {t('projects.cancel', 'Cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 font-medium text-white hover:bg-red-700"
                        >
                            {isDeleting && (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            )}
                            {t('projects.delete_btn', 'Delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
