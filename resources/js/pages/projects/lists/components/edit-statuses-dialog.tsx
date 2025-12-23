import { reorder } from '@/actions/App/Http/Controllers/TaskLists/TaskListController';
import { softToastSuccess } from '@/components/shadcn-studio/soft-sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { router } from '@inertiajs/react';
import { GripVertical, LayoutList, Settings2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Project, TaskList } from '../lib/types';

interface EditStatusesDialogProps {
    project: Project;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface SortableItemProps {
    list: TaskList;
    projectColor: string;
    onNameChange: (id: number, name: string) => void;
}

function SortableItem({ list, projectColor, onNameChange }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: list.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 rounded-lg border bg-card p-2 ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
        >
            <button
                type="button"
                className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="size-4" />
            </button>
            <div
                className="flex size-8 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `${projectColor}20` }}
            >
                <LayoutList
                    className="size-4"
                    style={{ color: projectColor }}
                />
            </div>
            <Input
                value={list.name}
                onChange={(e) => onNameChange(list.id, e.target.value)}
                className="h-8 flex-1 border-0 bg-transparent px-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Status name"
            />
            <span className="shrink-0 text-xs text-muted-foreground">
                {list.tasks?.length || 0} tasks
            </span>
        </div>
    );
}

export function EditStatusesDialog({
    project,
    open,
    onOpenChange,
}: EditStatusesDialogProps) {
    const [lists, setLists] = useState<TaskList[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // Initialize lists when dialog opens
    useEffect(() => {
        if (open) {
            setLists(
                [...project.lists].sort((a, b) => a.position - b.position),
            );
        }
    }, [open, project.lists]);

    const handleOpenChange = (isOpen: boolean) => {
        onOpenChange(isOpen);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setLists((items) => {
                const oldIndex = items.findIndex(
                    (item) => item.id === active.id,
                );
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleNameChange = (id: number, name: string) => {
        setLists((items) =>
            items.map((item) => (item.id === id ? { ...item, name } : item)),
        );
    };

    const handleSave = () => {
        setIsSaving(true);

        // Prepare reorder data
        const reorderData = lists.map((list, index) => ({
            id: list.id,
            position: index,
        }));

        router.patch(
            reorder.url(project),
            { lists: reorderData },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                    softToastSuccess('Statuses updated successfully');
                },
                onFinish: () => {
                    setIsSaving(false);
                },
            },
        );
    };

    const hasChanges = () => {
        if (lists.length !== project.lists.length) return true;

        return lists.some((list, index) => {
            const original = project.lists.find((l) => l.id === list.id);
            return (
                original &&
                (original.position !== index || original.name !== list.name)
            );
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div
                            className="flex size-10 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${project.color}20` }}
                        >
                            <Settings2
                                className="size-5"
                                style={{ color: project.color }}
                            />
                        </div>
                        <div>
                            <DialogTitle>Edit Statuses</DialogTitle>
                            <DialogDescription>
                                Drag to reorder or rename your workflow
                                statuses.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-2 py-4">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={lists.map((l) => l.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {lists.map((list) => (
                                <SortableItem
                                    key={list.id}
                                    list={list}
                                    projectColor={project.color}
                                    onNameChange={handleNameChange}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSaving}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges()}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
