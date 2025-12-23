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
import { Trash2 } from 'lucide-react';

interface ForceDeleteDialogProps {
    item: NormalizedTrashItem | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

export function ForceDeleteDialog({
    item,
    open,
    onOpenChange,
    onConfirm,
    isLoading,
}: ForceDeleteDialogProps) {
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

    const getDeleteInfo = () => {
        if (item.type === 'project') {
            return `This will also permanently delete ${item.metadata.listsCount} lists and ${item.metadata.tasksCount} tasks.`;
        }
        if (item.type === 'list') {
            return `This will also permanently delete ${item.metadata.tasksCount} tasks.`;
        }
        return null;
    };

    const deleteInfo = getDeleteInfo();

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Permanently delete {getItemTypeLabel()}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <span>
                            Are you sure you want to permanently delete{' '}
                            <span className="font-semibold text-foreground">
                                "{item.title}"
                            </span>
                            ?
                        </span>
                        {deleteInfo && (
                            <span className="block font-medium text-destructive">
                                {deleteInfo}
                            </span>
                        )}
                        <span className="block font-semibold text-destructive">
                            This action cannot be undone.
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
                        {isLoading ? 'Deleting...' : 'Delete Forever'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
