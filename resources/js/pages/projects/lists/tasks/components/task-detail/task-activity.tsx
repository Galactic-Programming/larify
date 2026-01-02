import { formatDistanceToNow, parseISO } from 'date-fns';
import type { Task } from '../../../lib/types';

interface TaskActivityProps {
    task: Task;
}

export function TaskActivity({ task }: TaskActivityProps) {
    return (
        <div className="space-y-1">
            <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Activity
            </h4>
            <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-muted-foreground/30" />
                    Created{' '}
                    {formatDistanceToNow(parseISO(task.created_at), {
                        addSuffix: true,
                    })}
                </div>
                {task.updated_at !== task.created_at && (
                    <div className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-muted-foreground/30" />
                        Updated{' '}
                        {formatDistanceToNow(parseISO(task.updated_at), {
                            addSuffix: true,
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
