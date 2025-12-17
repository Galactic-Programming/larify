import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Project, Task } from '../../lib/types';
import { TaskCard } from './task-card';

interface SortableTaskCardProps {
    task: Task;
    project: Project;
    index: number;
    onClick?: (task: Task) => void;
    disabled?: boolean;
}

export function SortableTaskCard({ task, project, index, onClick, disabled = false }: SortableTaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        data: {
            type: 'task',
            task,
            listId: task.list_id,
        },
        disabled,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...(disabled ? {} : listeners)}>
            <TaskCard
                task={task}
                project={project}
                index={index}
                variant="board"
                onClick={onClick}
            />
        </div>
    );
}
