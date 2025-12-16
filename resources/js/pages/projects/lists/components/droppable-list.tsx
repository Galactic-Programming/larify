import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';

interface DroppableListProps {
    listId: number;
    children: ReactNode;
}

export function DroppableList({ listId, children }: DroppableListProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `list-${listId}`,
        data: {
            type: 'list',
            listId,
        },
    });

    return (
        <div
            ref={setNodeRef}
            className={`min-h-25 flex-1 space-y-2 transition-colors ${isOver ? 'bg-primary/5 rounded-lg' : ''}`}
        >
            {children}
        </div>
    );
}
