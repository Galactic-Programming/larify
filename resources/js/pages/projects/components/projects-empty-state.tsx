import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { CreateProjectDialog } from '@/pages/projects/components/create-project-dialog';
import type { FilterType } from '@/pages/projects/lib/types';
import { Archive, FolderKanban, Plus, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface ProjectsEmptyStateProps {
    filter: FilterType;
    searchQuery: string;
    onClearSearch: () => void;
}

export function ProjectsEmptyState({
    filter,
    searchQuery,
    onClearSearch,
}: ProjectsEmptyStateProps) {
    return (
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
                            No projects found matching "{searchQuery}". Try a
                            different search term.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button variant="outline" onClick={onClearSearch}>
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
                            Archived projects will appear here. You can archive
                            projects from the project menu.
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
                    <h3 className="mb-2 text-xl font-semibold">
                        No projects yet
                    </h3>
                    <p className="mb-6 max-w-sm text-center text-muted-foreground">
                        Create your first project to start organizing your tasks
                        and collaborate with Kanban boards.
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
    );
}
