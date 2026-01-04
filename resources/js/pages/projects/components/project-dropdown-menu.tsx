import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { index as membersIndex } from '@/routes/projects/members';
import { Link } from '@inertiajs/react';
import {
    Archive,
    ArchiveRestore,
    Eye,
    MoreHorizontal,
    Pencil,
    Trash2,
    Users,
} from 'lucide-react';
import type { Project } from '../lib/types';

interface ProjectDropdownMenuProps {
    project: Project;
    onView: (project: Project) => void;
    onEdit: (project: Project) => void;
    onArchive: (project: Project) => void;
    onDelete: (project: Project) => void;
    triggerClassName?: string;
}

export function ProjectDropdownMenu({
    project,
    onView,
    onEdit,
    onArchive,
    onDelete,
    triggerClassName,
}: ProjectDropdownMenuProps) {
    const isOwner = project.is_owner;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className={
                        triggerClassName ??
                        'opacity-0 transition-opacity group-hover:opacity-100'
                    }
                >
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(project)}>
                    <Eye className="mr-2 size-4" />
                    View Details
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={membersIndex(project).url}>
                        <Users className="mr-2 size-4" />
                        Members
                    </Link>
                </DropdownMenuItem>
                {isOwner && (
                    <DropdownMenuItem onClick={() => onEdit(project)}>
                        <Pencil className="mr-2 size-4" />
                        Edit
                    </DropdownMenuItem>
                )}
                {isOwner && (
                    <>
                        <DropdownMenuItem onClick={() => onArchive(project)}>
                            {project.is_archived ? (
                                <>
                                    <ArchiveRestore className="mr-2 size-4" />
                                    Restore
                                </>
                            ) : (
                                <>
                                    <Archive className="mr-2 size-4" />
                                    Archive
                                </>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onDelete(project)}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
