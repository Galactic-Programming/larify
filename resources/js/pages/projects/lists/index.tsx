import AppLayout from '@/layouts/app-layout';
import { index as projectsIndex, show as projectShow } from '@/routes/projects';
import { index as listsIndex } from '@/actions/App/Http/Controllers/TaskLists/TaskListController';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { DeleteListDialog } from './components/delete-list-dialog';
import { EditListDialog } from './components/edit-list-dialog';
import { ListsEmptyState } from './components/lists-empty-state';
import { ListsHeader } from './components/lists-header';
import { BoardView } from './components/views/board-view';
import { ListView } from './components/views/list-view';
import { TableView } from './components/views/table-view';
import type { Project, Task, TaskFilter, TaskList, ViewMode } from './lib/types';

// Helper to check if task is overdue
function isTaskOverdue(task: Task): boolean {
    if (task.completed_at) return false;
    const deadline = new Date(`${task.due_date.split('T')[0]}T${task.due_time}`);
    return new Date() > deadline;
}

// Helper to check if task is due soon (within 24 hours)
function isTaskDueSoon(task: Task): boolean {
    if (task.completed_at) return false;
    const deadline = new Date(`${task.due_date.split('T')[0]}T${task.due_time}`);
    const now = new Date();
    const hoursUntilDue = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDue > 0 && hoursUntilDue <= 24;
}

interface Props {
    project: Project;
}

export default function ListsIndex({ project }: Props) {
    const [viewMode, setViewMode] = useState<ViewMode>('board');
    const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
    const [editingList, setEditingList] = useState<TaskList | null>(null);
    const [deletingList, setDeletingList] = useState<TaskList | null>(null);

    // Note: Real-time updates are handled in each view component (BoardView, ListView, TableView)
    // to properly handle task deletion when detail sheet is open

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: projectsIndex().url },
        { title: project.name, href: projectShow(project).url },
        { title: 'Lists', href: listsIndex(project).url },
    ];

    // Calculate task counts for filters
    const allTasks = project.lists.flatMap((list) => list.tasks);
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.completed_at).length;
    const overdueTasks = allTasks.filter(isTaskOverdue).length;
    const dueSoonTasks = allTasks.filter(isTaskDueSoon).length;

    // Filter project lists based on selected filter
    const filteredProject = useMemo(() => {
        if (taskFilter === 'all') return project;

        const filterFn = (task: Task) => {
            switch (taskFilter) {
                case 'overdue':
                    return isTaskOverdue(task);
                case 'due-soon':
                    return isTaskDueSoon(task);
                case 'completed':
                    return task.completed_at !== null;
                default:
                    return true;
            }
        };

        return {
            ...project,
            lists: project.lists.map((list) => ({
                ...list,
                tasks: list.tasks.filter(filterFn),
            })),
        };
    }, [project, taskFilter]);

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
                        project={filteredProject}
                        onEditList={handleEditList}
                        onDeleteList={handleDeleteList}
                    />
                );
            case 'list':
                return (
                    <ListView
                        project={filteredProject}
                        onEditList={handleEditList}
                        onDeleteList={handleDeleteList}
                    />
                );
            case 'table':
                return (
                    <TableView
                        project={filteredProject}
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
                    taskFilter={taskFilter}
                    onTaskFilterChange={setTaskFilter}
                    totalTasks={totalTasks}
                    completedTasks={completedTasks}
                    overdueTasks={overdueTasks}
                    dueSoonTasks={dueSoonTasks}
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
