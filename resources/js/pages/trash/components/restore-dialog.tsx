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
import type { NormalizedTrashItem } from '@/types/trash.d';
import { RotateCcw } from 'lucide-react';

interface RestoreDialogProps {
    item: NormalizedTrashItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

export function RestoreDialog({ item, open, onOpenChange, onConfirm, isLoading }: RestoreDialogProps) {
    if (!item) return null;

    const getItemTypeLabel = () => {
        switch (item.type) {
            case 'project':
                return 'project';
            case 'list':
                return 'list';
            case 'task':
                return 'task';
        }
    };

    const getRestoreInfo = () => {
        if (item.type === 'project') {
            return `This will also restore ${item.metadata.listsCount} lists and ${item.metadata.tasksCount} tasks that were deleted with it.`;
        }
        if (item.type === 'list') {
            return `This will also restore ${item.metadata.tasksCount} tasks that were deleted with it.`;
        }
        return null;
    };

    const restoreInfo = getRestoreInfo();

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Restore {getItemTypeLabel()}</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <span>
                            Are you sure you want to restore{' '}
                            <span className="font-semibold text-foreground">"{item.title}"</span>?
                        </span>
                        {restoreInfo && (
                            <span className="block text-muted-foreground">{restoreInfo}</span>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="gap-2"
                    >
                        <RotateCcw className="size-4" />
                        {isLoading ? 'Restoring...' : 'Restore'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
