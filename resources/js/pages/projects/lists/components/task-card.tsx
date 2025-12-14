import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'motion/react';
import type { Task } from '../lib/types';
import { getPriorityColor, getTaskStatusIcon } from '../lib/utils';

interface TaskCardProps {
    task: Task;
    index?: number;
    variant?: 'board' | 'list';
}

export function TaskCard({ task, index = 0, variant = 'board' }: TaskCardProps) {
    if (variant === 'list') {
        return (
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="group flex items-center gap-3 rounded-lg border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
            >
                <div className="shrink-0">{getTaskStatusIcon(task)}</div>
                <div className="min-w-0 flex-1">
                    <p
                        className={`text-sm font-medium ${task.completed_at ? 'text-muted-foreground line-through' : ''}`}
                    >
                        {task.title}
                    </p>
                    {task.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {task.description}
                        </p>
                    )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {task.due_date && (
                        <Badge variant="outline" className="text-xs">
                            {new Date(task.due_date).toLocaleDateString()}
                        </Badge>
                    )}
                    <Badge
                        variant="secondary"
                        className={`text-xs ${getPriorityColor(task.priority)}`}
                    >
                        {task.priority}
                    </Badge>
                </div>
            </motion.div>
        );
    }

    // Board variant (default)
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
        >
            <Card className="group cursor-pointer bg-card transition-all hover:shadow-md">
                <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                        <div className="mt-0.5 shrink-0">{getTaskStatusIcon(task)}</div>
                        <div className="min-w-0 flex-1">
                            <p
                                className={`text-sm font-medium ${task.completed_at ? 'text-muted-foreground line-through' : ''}`}
                            >
                                {task.title}
                            </p>
                            {task.description && (
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                    {task.description}
                                </p>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                                {task.due_date && (
                                    <Badge variant="outline" className="text-xs">
                                        {new Date(task.due_date).toLocaleDateString()}
                                    </Badge>
                                )}
                                <span
                                    className={`text-xs font-medium ${getPriorityColor(task.priority)}`}
                                >
                                    {task.priority}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
