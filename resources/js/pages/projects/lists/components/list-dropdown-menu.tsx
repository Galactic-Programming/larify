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
import type { Project, TaskList } from '../lib/types';
import { EditStatusesDialog } from './edit-statuses-dialog';

interface ListDropdownMenuProps {
    project: Project;
    list: TaskList;
    onEdit: (list: TaskList) => void;
    onDelete: (list: TaskList) => void;
    triggerClassName?: string;
    triggerSize?: 'default' | 'sm' | 'icon-sm';
    onClick?: (e: React.MouseEvent) => void;
}

export function ListDropdownMenu({
    project,
    list,
    onEdit,
    onDelete,
    triggerClassName,
    triggerSize = 'icon-sm',
    onClick,
}: ListDropdownMenuProps) {
    const [editStatusesOpen, setEditStatusesOpen] = useState(false);

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
                    <DropdownMenuItem onClick={() => onEdit(list)}>
                        <Pencil className="mr-2 size-4" />
                        Edit List
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditStatusesOpen(true)}>
                        <Settings2 className="mr-2 size-4" />
                        Edit Statuses
                    </DropdownMenuItem>
                    {!list.is_done_list && (
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

            <EditStatusesDialog
                project={project}
                open={editStatusesOpen}
                onOpenChange={setEditStatusesOpen}
            />
        </>
    );
}
