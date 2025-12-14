import { softToastSuccess } from '@/components/shadcn-studio/soft-sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { destroy } from '@/actions/App/Http/Controllers/TaskLists/TaskListController';
import { router } from '@inertiajs/react';
import { AlertTriangle, LayoutList } from 'lucide-react';
import { useState } from 'react';

interface Project {
    id: number;
    name: string;
    color: string;
}

interface TaskList {
    id: number;
    name: string;
    position: number;
    tasks_count?: number;
    tasks?: { length: number };
}

interface DeleteListDialogProps {
    project: Project;
    list: TaskList;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteListDialog({ project, list, open, onOpenChange }: DeleteListDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const tasksCount = list.tasks_count ?? list.tasks?.length ?? 0;

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(destroy({ project: project.id, list: list.id }).url, {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                softToastSuccess('List deleted successfully');
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="size-5 text-destructive" />
                        </div>
                        <div>
                            <AlertDialogTitle>Delete List</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete "{list.name}"?
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>

                {tasksCount > 0 && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                        <div className="flex items-start gap-2">
                            <LayoutList className="mt-0.5 size-4 text-destructive" />
                            <div className="text-sm">
                                <p className="font-medium text-destructive">
                                    This list contains {tasksCount} task{tasksCount > 1 ? 's' : ''}
                                </p>
                                <p className="text-muted-foreground">
                                    All tasks in this list will be permanently deleted.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-white hover:bg-destructive/90"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete List'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
