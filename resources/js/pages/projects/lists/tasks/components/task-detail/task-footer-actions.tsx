import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import type { Permissions } from '../../../lib/types';

interface TaskFooterActionsProps {
    permissions: Permissions;
    onOpenEdit: () => void;
    onOpenDelete: () => void;
}

export function TaskFooterActions({
    permissions,
    onOpenEdit,
    onOpenDelete,
}: TaskFooterActionsProps) {
    if (!permissions.canEdit) return null;

    return (
        <div className="border-t bg-muted/30 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={onOpenEdit}>
                    <Pencil className="size-4" />
                    <span className="hidden sm:inline">Edit Task</span>
                    <span className="sm:hidden">Edit</span>
                </Button>
                {permissions.canDelete && (
                    <Button
                        variant="outline"
                        size="icon"
                        className="hover:text-background-foreground text-destructive hover:bg-destructive/10"
                        onClick={onOpenDelete}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
