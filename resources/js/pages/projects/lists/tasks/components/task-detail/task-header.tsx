import { Badge } from '@/components/ui/badge';
import {
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { AlertTriangle, CheckCircle2, CircleAlert } from 'lucide-react';
import type { Project, Task } from '../../../lib/types';

interface TaskHeaderProps {
    task: Task;
    project: Project;
    currentList: { id: number; name: string } | undefined;
    isCompleted: boolean;
    isOverdue: boolean;
    completedLate: boolean;
}

export function TaskHeader({
    task,
    project,
    currentList,
    isCompleted,
    isOverdue,
    completedLate,
}: TaskHeaderProps) {
    return (
        <SheetHeader className="border-b bg-linear-to-b from-muted/50 to-background px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                    <SheetTitle
                        className={`text-lg leading-tight font-semibold sm:text-xl ${isCompleted ? 'text-muted-foreground line-through' : ''
                            }`}
                    >
                        {task.title}
                    </SheetTitle>
                    <SheetDescription className="flex flex-wrap items-center gap-1.5 text-sm sm:gap-2">
                        <Badge
                            variant="outline"
                            className="max-w-[18ch] gap-1 font-normal"
                            title={currentList?.name}
                        >
                            <div
                                className="size-2 shrink-0 rounded-full"
                                style={{
                                    backgroundColor: project.color,
                                }}
                            />
                            <span className="truncate">{currentList?.name}</span>
                        </Badge>
                        {isCompleted && !completedLate && (
                            <Badge
                                variant="secondary"
                                className="gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            >
                                <CheckCircle2 className="size-3" />
                                Completed
                            </Badge>
                        )}
                        {completedLate && (
                            <Badge
                                variant="secondary"
                                className="gap-1 bg-orange-500/10 text-orange-700 dark:text-orange-400"
                            >
                                <CircleAlert className="size-3" />
                                Completed Late
                            </Badge>
                        )}
                        {isOverdue && (
                            <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="size-3" />
                                Overdue
                            </Badge>
                        )}
                    </SheetDescription>
                </div>
            </div>
        </SheetHeader>
    );
}
