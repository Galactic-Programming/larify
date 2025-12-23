import { destroy } from '@/actions/App/Http/Controllers/Tasks/TaskController';
import { softToastSuccess } from '@/components/shadcn-studio/soft-sonner';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { Task } from '../../lib/types';

interface Project {
    id: number;
}

interface DeleteTaskDialogProps {
    project: Project;
    task: Task;
    trigger?: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function DeleteTaskDialog({
    project,
    task,
    trigger,
    open: controlledOpen,
    onOpenChange,
}: DeleteTaskDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;

    const handleOpenChange = (isOpen: boolean) => {
        if (isControlled) {
            onOpenChange?.(isOpen);
        } else {
            setInternalOpen(isOpen);
        }
    };

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(destroy.url({ project, task }), {
            preserveScroll: true,
            onSuccess: () => {
                handleOpenChange(false);
                softToastSuccess('Task deleted successfully');
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            {trigger && (
                <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            )}
            {!trigger && !isControlled && (
                <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </AlertDialogTrigger>
            )}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete{' '}
                        <span className="font-medium text-foreground">
                            "{task.title}"
                        </span>
                        ? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
