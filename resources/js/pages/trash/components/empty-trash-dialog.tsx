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
import { Trash2 } from 'lucide-react';

interface EmptyTrashDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isLoading?: boolean;
    itemCount: number;
}

export function EmptyTrashDialog({
    open,
    onOpenChange,
    onConfirm,
    isLoading,
    itemCount,
}: EmptyTrashDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Empty Trash</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <span>
                            Are you sure you want to permanently delete{' '}
                            <span className="font-semibold text-foreground">
                                {itemCount} item{itemCount !== 1 ? 's' : ''}
                            </span>{' '}
                            from trash?
                        </span>
                        <span className="block font-semibold text-destructive">
                            This action cannot be undone. All projects, lists,
                            and tasks in trash will be permanently removed.
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="gap-2 bg-destructive text-white hover:bg-destructive/90"
                    >
                        <Trash2 className="size-4" />
                        {isLoading ? 'Emptying...' : 'Empty Trash'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
