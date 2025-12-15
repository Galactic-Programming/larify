import AppLayout from '@/layouts/app-layout';
import { index as projectsIndex, show as projectShow } from '@/routes/projects';
import { index as listsIndex } from '@/actions/App/Http/Controllers/TaskLists/TaskListController';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

import { DeleteListDialog } from './components/delete-list-dialog';
import { EditListDialog } from './components/edit-list-dialog';
import { ListsEmptyState } from './components/lists-empty-state';
import { ListsHeader } from './components/lists-header';
import { BoardView } from './components/views/board-view';
import { ListView } from './components/views/list-view';
import { TableView } from './components/views/table-view';
import type { Project, TaskList, ViewMode } from './lib/types';

interface Props {
    project: Project;
}

export default function ListsIndex({ project }: Props) {
    const [viewMode, setViewMode] = useState<ViewMode>('board');
    const [editingList, setEditingList] = useState<TaskList | null>(null);
    const [deletingList, setDeletingList] = useState<TaskList | null>(null);

    // Note: Real-time updates are handled in each view component (BoardView, ListView, TableView)
    // to properly handle task deletion when detail sheet is open

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: projectsIndex().url },
        { title: project.name, href: projectShow(project).url },
        { title: 'Lists', href: listsIndex(project).url },
    ];

    const totalTasks = project.lists.reduce((sum, list) => sum + list.tasks.length, 0);
    const completedTasks = project.lists.reduce(
        (sum, list) => sum + list.tasks.filter((t) => t.completed_at).length,
        0,
    );

    const handleEditList = (list: TaskList) => setEditingList(list);
    const handleDeleteList = (list: TaskList) => setDeletingList(list);

    const renderView = () => {
        if (project.lists.length === 0) {
            return <ListsEmptyState project={project} />;
        }

        switch (viewMode) {
            case 'board':
                return (
                    <BoardView
                        project={project}
                        onEditList={handleEditList}
                        onDeleteList={handleDeleteList}
                    />
                );
            case 'list':
                return (
                    <ListView
                        project={project}
                        onEditList={handleEditList}
                        onDeleteList={handleDeleteList}
                    />
                );
            case 'table':
                return (
                    <TableView
                        project={project}
                        onEditList={handleEditList}
                        onDeleteList={handleDeleteList}
                    />
                );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${project.name} - Lists`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <ListsHeader
                    project={project}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    totalTasks={totalTasks}
                    completedTasks={completedTasks}
                />

                {renderView()}
            </div>

            {/* Edit List Dialog */}
            {editingList && (
                <EditListDialog
                    project={project}
                    list={editingList}
                    open={!!editingList}
                    onOpenChange={(open: boolean) => !open && setEditingList(null)}
                />
            )}

            {/* Delete List Dialog */}
            {deletingList && (
                <DeleteListDialog
                    project={project}
                    list={deletingList}
                    open={!!deletingList}
                    onOpenChange={(open: boolean) => !open && setDeletingList(null)}
                />
            )}
        </AppLayout>
    );
}
