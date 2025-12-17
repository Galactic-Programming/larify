import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { setDoneList } from '@/actions/App/Http/Controllers/TaskLists/TaskListController';
import { router } from '@inertiajs/react';
import { CheckCircle2, Circle, MoreHorizontal, Pencil, Settings2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Permissions, Project, TaskList } from '../lib/types';
import { EditStatusesDialog } from './edit-statuses-dialog';

interface ListDropdownMenuProps {
    project: Project;
    list: TaskList;
    permissions: Permissions;
    onEdit: (list: TaskList) => void;
    onDelete: (list: TaskList) => void;
    triggerClassName?: string;
    triggerSize?: 'default' | 'sm' | 'icon-sm';
    onClick?: (e: React.MouseEvent) => void;
}

export function ListDropdownMenu({
    project,
    list,
    permissions,
    onEdit,
    onDelete,
    triggerClassName,
    triggerSize = 'icon-sm',
    onClick,
}: ListDropdownMenuProps) {
    const [editStatusesOpen, setEditStatusesOpen] = useState(false);

    // Check if another list is already the done list
    const hasDoneListElsewhere = project.lists.some((l) => l.is_done_list && l.id !== list.id);

    // If user has no edit permission, don't render menu at all
    if (!permissions.canEdit) {
        return null;
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size={triggerSize}
                        className={triggerClassName}
                        onClick={onClick}
                    >
                        <MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {/* Show done list option only if: this list is already done list OR no other list is done list */}
                    {(list.is_done_list || !hasDoneListElsewhere) && (
                        <>
                            <DropdownMenuItem
                                onClick={() => {
                                    router.patch(setDoneList.url({ project: project.id, list: list.id }));
                                }}
                            >
                                {list.is_done_list ? (
                                    <>
                                        <Circle className="mr-2 size-4" />
                                        Unset as Done List
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 size-4" />
                                        Set as Done List
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}
                    <DropdownMenuItem onClick={() => onEdit(list)}>
                        <Pencil className="mr-2 size-4" />
                        Edit List
                    </DropdownMenuItem>
                    {/* Edit Statuses - Only for project owners/managers */}
                    {permissions.canManageSettings && (
                        <DropdownMenuItem onClick={() => setEditStatusesOpen(true)}>
                            <Settings2 className="mr-2 size-4" />
                            Edit Statuses
                        </DropdownMenuItem>
                    )}
                    {/* Delete - Only for owners (canDelete) */}
                    {!list.is_done_list && permissions.canDelete && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onDelete(list)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 size-4" />
                                Delete List
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {permissions.canManageSettings && (
                <EditStatusesDialog
                    project={project}
                    open={editStatusesOpen}
                    onOpenChange={setEditStatusesOpen}
                />
            )}
        </>
    );
}
