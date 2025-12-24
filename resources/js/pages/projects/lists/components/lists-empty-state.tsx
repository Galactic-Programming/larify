import { Button } from '@/components/ui/button';
import { LayoutList, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import type { Permissions, Project } from '../lib/types';
import { CreateListDialog } from './create-list-dialog';

interface ListsEmptyStateProps {
    project: Project;
    permissions: Permissions;
}

export function ListsEmptyState({
    project,
    permissions,
}: ListsEmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex flex-1 items-center justify-center"
        >
            <div className="flex flex-col items-center justify-center rounded-lg border bg-card px-8 py-20">
                <div className="relative mb-6">
                    <div
                        className="flex size-24 items-center justify-center rounded-2xl shadow-xl"
                        style={{ backgroundColor: `${project.color}20` }}
                    >
                        <LayoutList
                            className="size-12"
                            style={{ color: project.color }}
                        />
                    </div>
                    {permissions.canEdit && (
                        <div
                            className="absolute -top-2 -right-2 flex size-8 animate-bounce items-center justify-center rounded-full text-white shadow-lg"
                            style={{ backgroundColor: project.color }}
                        >
                            <Plus className="size-4" />
                        </div>
                    )}
                </div>
                <h3 className="mb-2 text-xl font-semibold">No lists yet</h3>
                <p className="mb-6 max-w-sm text-center text-muted-foreground">
                    {permissions.canEdit
                        ? 'Create your first list to start organizing tasks in this project.'
                        : 'This project has no lists yet. Ask the project owner to add some.'}
                </p>
                {permissions.canEdit && (
                    <CreateListDialog
                        project={project}
                        canCreateList={permissions.canCreateList}
                        maxLists={permissions.maxLists}
                        currentLists={permissions.currentLists}
                        trigger={
                            <Button
                                size="lg"
                                className="gap-2 shadow-lg transition-all duration-300 hover:shadow-xl"
                                style={{
                                    backgroundColor: project.color,
                                    boxShadow: `0 10px 15px -3px ${project.color}40`,
                                }}
                            >
                                <Plus className="size-4" />
                                Create your first list
                            </Button>
                        }
                    />
                )}
            </div>
        </motion.div>
    );
}
