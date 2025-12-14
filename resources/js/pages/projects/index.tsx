import { softToastSuccess } from '@/components/shadcn-studio/soft-sonner';
import AppLayout from '@/layouts/app-layout';
import { DeleteProjectDialog } from '@/pages/projects/components/delete-project-dialog';
import { EditProjectDialog } from '@/pages/projects/components/edit-project-dialog';
import { ProjectsEmptyState } from '@/pages/projects/components/projects-empty-state';
import { ProjectsFilters } from '@/pages/projects/components/projects-filters';
import { ProjectsGrid } from '@/pages/projects/components/projects-grid';
import { ProjectsHeader } from '@/pages/projects/components/projects-header';
import { ShowProjectDialog } from '@/pages/projects/components/show-project-dialog';
import type { FilterType, Project, SortType } from '@/pages/projects/lib/types';
import { archive, index } from '@/routes/projects';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

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
                <ProjectsHeader />

                <ProjectsFilters
                    filter={filter}
                    onFilterChange={setFilter}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    activeCount={activeCount}
                    archivedCount={archivedCount}
                    totalCount={projects.length}
                />

                {filteredProjects.length > 0 ? (
                    <ProjectsGrid
                        projects={filteredProjects}
                        onView={setViewingProject}
                        onEdit={setEditingProject}
                        onArchive={handleArchive}
                        onDelete={setDeletingProject}
                    />
                ) : (
                    <ProjectsEmptyState
                        filter={filter}
                        searchQuery={searchQuery}
                        onClearSearch={() => setSearchQuery('')}
                    />
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
