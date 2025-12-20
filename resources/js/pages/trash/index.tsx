import { softToastSuccess } from '@/components/shadcn-studio/soft-sonner';
import AppLayout from '@/layouts/app-layout';
import {
    emptyTrash,
    forceDeleteList,
    forceDeleteProject,
    forceDeleteTask,
    index,
    restoreList,
    restoreProject,
    restoreTask,
} from '@/actions/App/Http/Controllers/Trash/TrashController';
import type { BreadcrumbItem } from '@/types';
import type {
    NormalizedTrashItem,
    TrashFilter,
    TrashPageProps,
    TrashSortBy,
    TrashedList,
    TrashedProject,
    TrashedTask,
} from '@/types/trash.d';
import { Head, router } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { EmptyTrashDialog } from './components/empty-trash-dialog';
import { ForceDeleteDialog } from './components/force-delete-dialog';
import { RestoreDialog } from './components/restore-dialog';
import { TrashEmptyState } from './components/trash-empty-state';
import { TrashFilters } from './components/trash-filters';
import { TrashHeader } from './components/trash-header';
import { TrashItemList } from './components/trash-item-list';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Trash', href: index().url }];

// Helper to normalize items for display
function normalizeProject(project: TrashedProject): NormalizedTrashItem {
    return {
        id: project.id,
        type: 'project',
        title: project.name,
        subtitle: null,
        color: project.color,
        icon: project.icon,
        deletedAt: project.deleted_at,
        daysRemaining: project.days_remaining,
        metadata: {
            listsCount: project.lists_count,
            tasksCount: project.tasks_count,
        },
    };
}

function normalizeList(list: TrashedList): NormalizedTrashItem {
    return {
        id: list.id,
        type: 'list',
        title: list.name,
        subtitle: list.project_name,
        color: list.project_color,
        icon: null,
        deletedAt: list.deleted_at,
        daysRemaining: list.days_remaining,
        metadata: {
            projectId: list.project_id,
            projectName: list.project_name,
            tasksCount: list.tasks_count,
        },
    };
}

function normalizeTask(task: TrashedTask): NormalizedTrashItem {
    return {
        id: task.id,
        type: 'task',
        title: task.title,
        subtitle: `${task.project_name} / ${task.list_name}`,
        color: task.project_color,
        icon: null,
        deletedAt: task.deleted_at,
        daysRemaining: task.days_remaining,
        metadata: {
            projectId: task.project_id,
            projectName: task.project_name,
            listId: task.list_id,
            listName: task.list_name,
            listDeleted: task.list_deleted,
            priority: task.priority,
        },
    };
}

export default function TrashIndex({ trashedProjects, trashedLists, trashedTasks, retentionDays }: TrashPageProps) {
    const [filter, setFilter] = useState<TrashFilter>('all');
    const [sortBy, setSortBy] = useState<TrashSortBy>('recent');
    const [searchQuery, setSearchQuery] = useState('');
    const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

    // Dialog states
    const [restoreItem, setRestoreItem] = useState<NormalizedTrashItem | null>(null);
    const [deleteItem, setDeleteItem] = useState<NormalizedTrashItem | null>(null);
    const [showEmptyDialog, setShowEmptyDialog] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Normalize all items
    const allItems = useMemo(() => {
        const projects = trashedProjects.map(normalizeProject);
        const lists = trashedLists.map(normalizeList);
        const tasks = trashedTasks.map(normalizeTask);
        return [...projects, ...lists, ...tasks];
    }, [trashedProjects, trashedLists, trashedTasks]);

    // Filter items
    const filteredItems = useMemo(() => {
        let items = allItems;

        // Filter by type
        if (filter !== 'all') {
            items = items.filter((item) => {
                if (filter === 'projects') return item.type === 'project';
                if (filter === 'lists') return item.type === 'list';
                if (filter === 'tasks') return item.type === 'task';
                return true;
            });
        }

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter(
                (item) =>
                    item.title.toLowerCase().includes(query) ||
                    item.subtitle?.toLowerCase().includes(query)
            );
        }

        // Sort items
        items = [...items].sort((a, b) => {
            switch (sortBy) {
                case 'recent':
                    return new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime();
                case 'type': {
                    const typeOrder = { project: 0, list: 1, task: 2 };
                    return typeOrder[a.type] - typeOrder[b.type];
                }
                case 'remaining':
                    return a.daysRemaining - b.daysRemaining;
                default:
                    return 0;
            }
        });

        return items;
    }, [allItems, filter, searchQuery, sortBy]);

    // Counts for tabs
    const counts = useMemo(
        () => ({
            all: allItems.length,
            projects: trashedProjects.length,
            lists: trashedLists.length,
            tasks: trashedTasks.length,
        }),
        [allItems.length, trashedProjects.length, trashedLists.length, trashedTasks.length]
    );

    // Restore handler
    const handleRestore = useCallback((item: NormalizedTrashItem) => {
        setRestoreItem(item);
    }, []);

    const confirmRestore = useCallback(() => {
        if (!restoreItem) return;

        setIsProcessing(true);
        setProcessingIds((prev) => new Set(prev).add(restoreItem.id));

        const getRestoreRoute = () => {
            switch (restoreItem.type) {
                case 'project':
                    return restoreProject(restoreItem.id);
                case 'list':
                    return restoreList(restoreItem.id);
                case 'task':
                    return restoreTask(restoreItem.id);
            }
        };

        const route = getRestoreRoute();
        if (!route) return;

        router.patch(
            route.url,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    softToastSuccess(`${restoreItem.type.charAt(0).toUpperCase() + restoreItem.type.slice(1)} restored successfully`);
                    setRestoreItem(null);
                },
                onError: () => {
                    toast.error('Failed to restore item');
                },
                onFinish: () => {
                    setIsProcessing(false);
                    setProcessingIds((prev) => {
                        const next = new Set(prev);
                        next.delete(restoreItem.id);
                        return next;
                    });
                },
            }
        );
    }, [restoreItem]);

    // Force delete handler
    const handleForceDelete = useCallback((item: NormalizedTrashItem) => {
        setDeleteItem(item);
    }, []);

    const confirmForceDelete = useCallback(() => {
        if (!deleteItem) return;

        setIsProcessing(true);
        setProcessingIds((prev) => new Set(prev).add(deleteItem.id));

        const getDeleteRoute = () => {
            switch (deleteItem.type) {
                case 'project':
                    return forceDeleteProject(deleteItem.id);
                case 'list':
                    return forceDeleteList(deleteItem.id);
                case 'task':
                    return forceDeleteTask(deleteItem.id);
            }
        };

        const route = getDeleteRoute();
        if (!route) return;

        router.delete(route.url, {
            preserveScroll: true,
            onSuccess: () => {
                softToastSuccess(`${deleteItem.type.charAt(0).toUpperCase() + deleteItem.type.slice(1)} permanently deleted`);
                setDeleteItem(null);
            },
            onError: () => {
                toast.error('Failed to delete item');
            },
            onFinish: () => {
                setIsProcessing(false);
                setProcessingIds((prev) => {
                    const next = new Set(prev);
                    next.delete(deleteItem.id);
                    return next;
                });
            },
        });
    }, [deleteItem]);

    // Empty trash handler
    const handleEmptyTrash = useCallback(() => {
        setShowEmptyDialog(true);
    }, []);

    const confirmEmptyTrash = useCallback(() => {
        setIsProcessing(true);

        router.delete(emptyTrash().url, {
            preserveScroll: true,
            onSuccess: () => {
                softToastSuccess('Trash emptied successfully');
                setShowEmptyDialog(false);
            },
            onError: () => {
                toast.error('Failed to empty trash');
            },
            onFinish: () => {
                setIsProcessing(false);
            },
        });
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Trash" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6">
                <TrashHeader
                    totalCount={counts.all}
                    retentionDays={retentionDays}
                    onEmptyTrash={handleEmptyTrash}
                    isEmptyDisabled={counts.all === 0 || isProcessing}
                />

                <TrashFilters
                    filter={filter}
                    onFilterChange={setFilter}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    counts={counts}
                />

                {filteredItems.length > 0 ? (
                    <TrashItemList
                        items={filteredItems}
                        onRestore={handleRestore}
                        onForceDelete={handleForceDelete}
                        processingIds={processingIds}
                    />
                ) : (
                    <TrashEmptyState
                        filter={filter}
                        searchQuery={searchQuery}
                        onClearSearch={() => setSearchQuery('')}
                    />
                )}
            </div>

            {/* Restore Dialog */}
            <RestoreDialog
                item={restoreItem}
                open={!!restoreItem}
                onOpenChange={(open) => !open && setRestoreItem(null)}
                onConfirm={confirmRestore}
                isLoading={isProcessing}
            />

            {/* Force Delete Dialog */}
            <ForceDeleteDialog
                item={deleteItem}
                open={!!deleteItem}
                onOpenChange={(open) => !open && setDeleteItem(null)}
                onConfirm={confirmForceDelete}
                isLoading={isProcessing}
            />

            {/* Empty Trash Dialog */}
            <EmptyTrashDialog
                open={showEmptyDialog}
                onOpenChange={setShowEmptyDialog}
                onConfirm={confirmEmptyTrash}
                isLoading={isProcessing}
                itemCount={counts.all}
            />
        </AppLayout>
    );
}
