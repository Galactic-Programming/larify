import {
    move,
    reorder,
} from '@/actions/App/Http/Controllers/Tasks/TaskController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useTaskRealtime } from '@/hooks/use-task-realtime';
import {
    type CollisionDetection,
    DndContext,
    type DragEndEvent,
    type DragOverEvent,
    DragOverlay,
    type DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    pointerWithin,
    rectIntersection,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { router } from '@inertiajs/react';
import { Circle, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import type { Permissions, Project, Task, TaskList } from '../../lib/types';
import { CreateTaskDialog } from '../../tasks/components/create-task-dialog';
import { SortableTaskCard } from '../../tasks/components/sortable-task-card';
import { TaskCard } from '../../tasks/components/task-card';
import { TaskDetailSheet } from '../../tasks/components/task-detail-sheet';
import { CreateListDialog } from '../create-list-dialog';
import { DroppableList } from '../droppable-list';
import { ListDropdownMenu } from '../list-dropdown-menu';

interface BoardViewProps {
    project: Project;
    permissions: Permissions;
    onEditList: (list: TaskList) => void;
    onDeleteList: (list: TaskList) => void;
}

export function BoardView({
    project,
    permissions,
    onEditList,
    onDeleteList,
}: BoardViewProps) {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [originalListId, setOriginalListId] = useState<number | null>(null); // Track original list when drag starts
    const [localLists, setLocalLists] = useState<TaskList[]>(project.lists);

    // Sync localLists with project.lists when it changes (from server/realtime)
    useMemo(() => {
        setLocalLists(project.lists);
    }, [project.lists]);

    // Handle task deletion from real-time updates - close sheet if viewing deleted task
    const handleTaskDeleted = useCallback(
        (taskId: number) => {
            if (selectedTask?.id === taskId) {
                setSelectedTask(null);
            }
        },
        [selectedTask?.id],
    );

    // Real-time updates with task deletion handler
    useTaskRealtime({
        projectId: project.id,
        autoRefresh: true,
        onTaskDeleted: handleTaskDeleted,
    });

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // Custom collision detection: prefer tasks, fallback to lists
    const collisionDetection: CollisionDetection = useCallback((args) => {
        // First check for task collisions using pointerWithin
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) {
            // Filter to only task collisions (not list containers)
            const taskCollisions = pointerCollisions.filter(
                (collision) => !String(collision.id).startsWith('list-'),
            );
            if (taskCollisions.length > 0) {
                return taskCollisions;
            }
        }

        // Fallback to rect intersection for list containers
        const rectCollisions = rectIntersection(args);
        return rectCollisions;
    }, []);

    // Find which list contains a task
    const findListByTaskId = useCallback(
        (taskId: number): TaskList | undefined => {
            return localLists.find((list) =>
                list.tasks.some((task) => task.id === taskId),
            );
        },
        [localLists],
    );

    // Extract list ID from droppable ID (handles both "list-123" and task IDs)
    const getListIdFromDroppableId = useCallback(
        (droppableId: string | number): number | null => {
            const id = String(droppableId);
            if (id.startsWith('list-')) {
                return parseInt(id.replace('list-', ''), 10);
            }
            // It's a task ID, find its list
            const list = findListByTaskId(Number(droppableId));
            return list?.id ?? null;
        },
        [findListByTaskId],
    );

    // Handle drag start
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const task = active.data.current?.task as Task | undefined;
        const listId = active.data.current?.listId as number | undefined;
        if (task) {
            setActiveTask(task);
            setOriginalListId(listId ?? null); // Remember the original list
        }
    };

    // Handle drag over (for moving between lists)
    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as number;
        const overId = over.id;

        // Find the source list (where the task currently is in localLists)
        const activeList = findListByTaskId(activeId);
        if (!activeList) return;

        // Determine target list ID
        const targetListId = getListIdFromDroppableId(overId);
        if (!targetListId) return;

        // Find target list
        const overList = localLists.find((list) => list.id === targetListId);
        if (!overList) return;

        // Skip if same list
        if (activeList.id === overList.id) return;

        // Check if dropping over a specific task
        const isOverTask = !String(overId).startsWith('list-');
        const overTask = isOverTask
            ? overList.tasks.find((t) => t.id === overId)
            : undefined;

        // Moving to a different list - update local state optimistically
        setLocalLists((lists) => {
            const activeListIndex = lists.findIndex(
                (l) => l.id === activeList.id,
            );
            const overListIndex = lists.findIndex((l) => l.id === overList.id);

            if (activeListIndex === -1 || overListIndex === -1) return lists;

            const activeTaskIndex = lists[activeListIndex].tasks.findIndex(
                (t) => t.id === activeId,
            );
            if (activeTaskIndex === -1) return lists;

            const task = lists[activeListIndex].tasks[activeTaskIndex];

            // Calculate new position
            let newPosition = lists[overListIndex].tasks.length; // Default: end of list
            if (overTask) {
                const overTaskIndex = lists[overListIndex].tasks.findIndex(
                    (t) => t.id === overTask.id,
                );
                newPosition = overTaskIndex;
            }

            // Create new lists array with task moved
            const newLists = [...lists];

            // Remove from source
            newLists[activeListIndex] = {
                ...newLists[activeListIndex],
                tasks: newLists[activeListIndex].tasks.filter(
                    (t) => t.id !== activeId,
                ),
            };

            // Add to destination
            const updatedTask = { ...task, list_id: overList.id };
            const newTasks = [...newLists[overListIndex].tasks];
            newTasks.splice(newPosition, 0, updatedTask);
            newLists[overListIndex] = {
                ...newLists[overListIndex],
                tasks: newTasks,
            };

            return newLists;
        });
    };

    // Handle drag end
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const draggedFromListId = originalListId; // Get the original list before clearing

        setActiveTask(null);
        setOriginalListId(null);

        if (!over || !draggedFromListId) return;

        const activeId = active.id as number;
        const overId = over.id;

        // Find current list (where task is now after handleDragOver)
        const currentList = findListByTaskId(activeId);
        if (!currentList) return;

        // Determine the target list ID
        const targetListId = getListIdFromDroppableId(overId);
        if (!targetListId) return;

        const targetList = localLists.find((l) => l.id === targetListId);
        if (!targetList) return;

        // Check if we're moving between different lists (compare original list with current)
        const isMovingBetweenLists = draggedFromListId !== currentList.id;

        if (!isMovingBetweenLists) {
            // Reordering within the same list - only if dropped on a task (not list container)
            const isOverTask = !String(overId).startsWith('list-');
            if (!isOverTask) return;

            const listIndex = localLists.findIndex(
                (l) => l.id === currentList.id,
            );
            const tasks = localLists[listIndex].tasks;
            const activeTaskIndex = tasks.findIndex((t) => t.id === activeId);
            const overTaskIndex = tasks.findIndex((t) => t.id === overId);

            if (activeTaskIndex !== overTaskIndex && overTaskIndex !== -1) {
                setLocalLists((lists) => {
                    const newLists = [...lists];
                    const newTasks = arrayMove(
                        newLists[listIndex].tasks,
                        activeTaskIndex,
                        overTaskIndex,
                    );
                    newLists[listIndex] = {
                        ...newLists[listIndex],
                        tasks: newTasks,
                    };
                    return newLists;
                });

                // Send reorder API
                const reorderedTasks = arrayMove(
                    tasks,
                    activeTaskIndex,
                    overTaskIndex,
                );
                const reorderData = reorderedTasks.map((task, index) => ({
                    id: task.id,
                    position: index,
                }));

                router.patch(
                    reorder.url({ project, list: currentList }),
                    { tasks: reorderData },
                    { preserveScroll: true },
                );
            }
        } else {
            // Moving to different list - task was already moved optimistically in handleDragOver
            // Find the new position from localLists (where task is now)
            const currentListIndex = localLists.findIndex(
                (l) => l.id === currentList.id,
            );
            const taskPositionInNewList = localLists[
                currentListIndex
            ].tasks.findIndex((t) => t.id === activeId);
            const newPosition =
                taskPositionInNewList !== -1 ? taskPositionInNewList : 0;

            // Call move API with position
            router.patch(
                move.url({ project, task: { id: activeId } }),
                { list_id: currentList.id, position: newPosition },
                { preserveScroll: true },
            );
        }
    };

    // Get task IDs for sortable context
    const getTaskIds = (list: TaskList) => list.tasks.map((task) => task.id);

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <ScrollArea className="flex-1 pb-4">
                    <div className="flex gap-4 pb-4">
                        {localLists.map((list, listIdx) => (
                            <motion.div
                                key={list.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                    duration: 0.3,
                                    delay: listIdx * 0.1,
                                }}
                                className="w-72 shrink-0 sm:w-80"
                            >
                                <Card className="flex h-fit max-h-[calc(100vh-320px)] flex-col bg-muted/30 sm:max-h-[calc(100vh-280px)]">
                                    {/* List Header */}
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="size-3 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        project.color,
                                                }}
                                            />
                                            <CardTitle
                                                className="max-w-[16ch] truncate text-base font-semibold"
                                                title={list.name}
                                            >
                                                {list.name}
                                            </CardTitle>
                                            <Badge
                                                variant="secondary"
                                                className="ml-1"
                                            >
                                                {list.tasks.length}
                                            </Badge>
                                        </div>
                                        <ListDropdownMenu
                                            project={project}
                                            list={list}
                                            permissions={permissions}
                                            onEdit={onEditList}
                                            onDelete={onDeleteList}
                                        />
                                    </CardHeader>

                                    {/* Tasks - Droppable Area */}
                                    <CardContent className="scrollbar-none flex-1 overflow-y-auto overscroll-contain scroll-smooth px-3 pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                        <DroppableList listId={list.id}>
                                            <SortableContext
                                                items={getTaskIds(list)}
                                                strategy={
                                                    verticalListSortingStrategy
                                                }
                                            >
                                                {list.tasks.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {list.tasks.map(
                                                            (task, taskIdx) => (
                                                                <SortableTaskCard
                                                                    key={
                                                                        task.id
                                                                    }
                                                                    task={task}
                                                                    project={
                                                                        project
                                                                    }
                                                                    index={
                                                                        taskIdx
                                                                    }
                                                                    onClick={
                                                                        setSelectedTask
                                                                    }
                                                                    disabled={
                                                                        !permissions.canEdit
                                                                    }
                                                                    permissions={
                                                                        permissions
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                                                        <Circle className="mb-2 size-8 text-muted-foreground/50" />
                                                        <p className="text-sm text-muted-foreground">
                                                            No tasks yet
                                                        </p>
                                                        {permissions.canEdit && (
                                                            <CreateTaskDialog
                                                                project={
                                                                    project
                                                                }
                                                                list={list}
                                                                canAssignTask={
                                                                    permissions.canAssignTask
                                                                }
                                                                trigger={
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="mt-2 gap-1"
                                                                    >
                                                                        <Plus className="size-3" />
                                                                        Add task
                                                                    </Button>
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </SortableContext>
                                        </DroppableList>

                                        {/* Add Task Button - Only for editors and owners */}
                                        {list.tasks.length > 0 &&
                                            permissions.canEdit && (
                                                <CreateTaskDialog
                                                    project={project}
                                                    list={list}
                                                    canAssignTask={
                                                        permissions.canAssignTask
                                                    }
                                                    trigger={
                                                        <Button
                                                            variant="ghost"
                                                            className="mt-2 w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                                                        >
                                                            <Plus className="size-4" />
                                                            Add task
                                                        </Button>
                                                    }
                                                />
                                            )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}

                        {/* Add List Card - Only for editors and owners */}
                        {permissions.canEdit && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                    duration: 0.3,
                                    delay: localLists.length * 0.1,
                                }}
                                className="w-72 shrink-0 sm:w-80"
                            >
                                <CreateListDialog
                                    project={project}
                                    trigger={
                                        <Card className="flex h-32 cursor-pointer items-center justify-center border-dashed bg-muted/20 transition-all hover:border-primary hover:bg-muted/40">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Plus className="size-8" />
                                                <span className="font-medium">
                                                    Add new list
                                                </span>
                                            </div>
                                        </Card>
                                    }
                                />
                            </motion.div>
                        )}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>

                {/* Drag Overlay - shows dragged task */}
                <DragOverlay>
                    {activeTask && (
                        <div className="rotate-3 opacity-90">
                            <TaskCard
                                task={activeTask}
                                project={project}
                                index={0}
                                variant="board"
                                permissions={permissions}
                            />
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {/* Task Detail Sheet */}
            <TaskDetailSheet
                task={selectedTask}
                project={project}
                permissions={permissions}
                open={!!selectedTask}
                onOpenChange={(open) => !open && setSelectedTask(null)}
            />
        </>
    );
}
