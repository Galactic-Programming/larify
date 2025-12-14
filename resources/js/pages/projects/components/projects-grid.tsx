import type { Project } from '../lib/types';
import { ProjectCard } from './project-card';

interface ProjectsGridProps {
    projects: Project[];
    onView: (project: Project) => void;
    onEdit: (project: Project) => void;
    onArchive: (project: Project) => void;
    onDelete: (project: Project) => void;
}

export function ProjectsGrid({ projects, onView, onEdit, onArchive, onDelete }: ProjectsGridProps) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project, idx) => (
                <ProjectCard
                    key={project.id}
                    project={project}
                    index={idx}
                    onView={onView}
                    onEdit={onEdit}
                    onArchive={onArchive}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}
