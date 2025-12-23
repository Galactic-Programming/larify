import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTaskRealtime } from '@/hooks/use-task-realtime';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Circle, Clock, MoreHorizontal, Pencil, Plus, Search, Trash2, User, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useCallback, useMemo } from 'react';
import type { Permissions, Project, Task } from '../../lib/types';
import { getPriorityColor, getTaskStatusIcon } from '../../lib/utils';
import { CreateTaskDialog } from '../../tasks/components/create-task-dialog';
import { DeleteTaskDialog } from '../../tasks/components/delete-task-dialog';
import { EditTaskDialog } from '../../tasks/components/edit-task-dialog';
import { TaskDetailSheet } from '../../tasks/components/task-detail-sheet';
import { CreateListDialog } from '../create-list-dialog';

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;

interface TableViewProps {
    project: Project;
    permissions: Permissions;
}

function TaskRowActions({ project, task, permissions }: { project: Project; task: Task; permissions: Permissions }) {
    const { auth } = usePage<SharedData>().props;
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    // Check if user can update deadline
    const canUpdateDeadline = permissions.role === 'owner' || task.created_by === auth.user.id;

    // Hide actions menu for viewers
    if (!permissions.canEdit) return null;

    return (
        // Stop propagation to prevent row click from opening task detail sheet
        <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Pencil className="mr-2 size-4" />
                        Edit
                    </DropdownMenuItem>
                    {permissions.canDelete && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteOpen(true)}
                            >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
            <EditTaskDialog project={project} task={task} open={editOpen} onOpenChange={setEditOpen} canAssignTask={permissions.canAssignTask} canUpdateDeadline={canUpdateDeadline} />
            {permissions.canDelete && (
                <DeleteTaskDialog project={project} task={task} open={deleteOpen} onOpenChange={setDeleteOpen} />
            )}
        </div>
    );
}

export function TableView({ project, permissions }: TableViewProps) {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState<number>(20);

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [listFilter, setListFilter] = useState<string>('all');

    // Flatten all tasks from all lists
    const allTasks = useMemo(() => {
        return project.lists.flatMap((list) =>
            list.tasks.map((task) => ({ task, list }))
        );
    }, [project.lists]);

    // Filter tasks based on search query and list filter
    const filteredTasks = useMemo(() => {
        return allTasks.filter(({ task, list }) => {
            // Filter by list
            if (listFilter !== 'all' && list.id !== Number(listFilter)) {
                return false;
            }

            // Filter by search query (title or description)
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim();
                const matchesTitle = task.title.toLowerCase().includes(query);
                const matchesDescription = task.description?.toLowerCase().includes(query) ?? false;
                if (!matchesTitle && !matchesDescription) {
                    return false;
                }
            }

            return true;
        });
    }, [allTasks, searchQuery, listFilter]);

    // Check if any filter is active
    const hasActiveFilters = searchQuery.trim() !== '' || listFilter !== 'all';

    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setListFilter('all');
        setCurrentPage(1);
    };

    // Pagination calculations - use filtered tasks
    const totalAllTasks = allTasks.length;
    const totalFilteredTasks = filteredTasks.length;
    const totalPages = Math.ceil(totalFilteredTasks / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalFilteredTasks);
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

    // Reset to first page when rowsPerPage changes, filters change, or tasks change significantly
    const handleRowsPerPageChange = (value: string) => {
        setRowsPerPage(Number(value));
        setCurrentPage(1);
    };

    // Reset page when filters change
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleListFilterChange = (value: string) => {
        setListFilter(value);
        setCurrentPage(1);
    };

    // Handle task deletion from real-time updates - close sheet if viewing deleted task
    const handleTaskDeleted = useCallback((taskId: number) => {
        if (selectedTask?.id === taskId) {
            setSelectedTask(null);
        }
    }, [selectedTask?.id]);

    // Real-time updates with task deletion handler
    useTaskRealtime({
        projectId: project.id,
        autoRefresh: true,
        onTaskDeleted: handleTaskDeleted,
    });

    return (
        <>
            <ScrollArea className="flex-1">
                {/* Search and Filter Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mb-4 rounded-lg border bg-card p-3 sm:p-4"
                >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="pl-9 pr-9"
                            />
                            {searchQuery && (
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleSearchChange('')}
                                >
                                    <X className="size-4" />
                                </Button>
                            )}
                        </div>

                        {/* List Filter */}
                        <Select value={listFilter} onValueChange={handleListFilterChange}>
                            <SelectTrigger className="w-full sm:w-44">
                                <SelectValue placeholder="All lists" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All lists</SelectItem>
                                {project.lists.map((list) => (
                                    <SelectItem key={list.id} value={String(list.id)}>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="size-2 shrink-0 rounded-full"
                                                style={{ backgroundColor: project.color }}
                                            />
                                            <span className="truncate">{list.name}</span>
                                            <span className="text-muted-foreground">({list.tasks.length})</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearFilters}
                                        className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="size-4" />
                                        <span className="hidden sm:inline">Clear</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Clear all filters</TooltipContent>
                            </Tooltip>
                        )}
                    </div>

                    {/* Results Count */}
                    {hasActiveFilters && (
                        <div className="mt-2 text-sm text-muted-foreground">
                            Showing {totalFilteredTasks} of {totalAllTasks} tasks
                            {searchQuery && (
                                <span> matching "<span className="font-medium text-foreground">{searchQuery}</span>"</span>
                            )}
                        </div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-lg border bg-card"
                >
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-10"></TableHead>
                                <TableHead>Task</TableHead>
                                <TableHead className="hidden w-32 sm:table-cell">Status</TableHead>
                                <TableHead className="hidden w-24 md:table-cell">Priority</TableHead>
                                <TableHead className="hidden w-36 lg:table-cell">Due Date</TableHead>
                                <TableHead className="hidden w-32 lg:table-cell">Assignee</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedTasks.map(({ task, list }) => (
                                <TableRow
                                    key={task.id}
                                    className="group cursor-pointer"
                                    onClick={() => setSelectedTask(task)}
                                >
                                    <TableCell className="pr-0">{getTaskStatusIcon(task)}</TableCell>
                                    <TableCell className="max-w-md">
                                        <div className="flex flex-col">
                                            <span
                                                className={`truncate font-medium ${task.completed_at ? 'text-muted-foreground line-through' : ''}`}
                                            >
                                                {task.title}
                                            </span>
                                            {task.description && (
                                                <span className="truncate text-xs text-muted-foreground">
                                                    {task.description}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <Badge variant="outline" className="max-w-[18ch] gap-1.5 font-normal" title={list.name}>
                                            <div
                                                className="size-2 rounded-full shrink-0"
                                                style={{ backgroundColor: project.color }}
                                            />
                                            <span className="truncate">{list.name}</span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {task.priority !== 'none' ? (
                                            <Badge
                                                variant="secondary"
                                                className={`text-xs ${getPriorityColor(task.priority)}`}
                                            >
                                                {task.priority}
                                            </Badge>
                                        ) : (
                                            <span className="text-sm text-muted-foreground/50">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                        {task.due_date ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                        <span>{new Date(task.due_date).toLocaleDateString()}</span>
                                                        {task.due_time && (
                                                            <span className="flex items-center gap-0.5 text-xs">
                                                                <Clock className="size-3" />
                                                                {task.due_time.slice(0, 5)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {new Date(task.due_date).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                    {task.due_time && ` at ${task.due_time.slice(0, 5)}`}
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            <span className="text-sm text-muted-foreground/50">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                        {task.assignee ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="size-6">
                                                            <AvatarImage src={task.assignee.avatar ?? undefined} />
                                                            <AvatarFallback className="text-xs">
                                                                {task.assignee.name.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="truncate text-sm">{task.assignee.name}</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>{task.assignee.email}</TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            <div className="flex items-center gap-2 text-muted-foreground/50">
                                                <User className="size-4" />
                                                <span className="text-sm">Unassigned</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <TaskRowActions project={project} task={task} permissions={permissions} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {/* No tasks at all */}
                            {totalAllTasks === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Circle className="size-8 text-muted-foreground/30" />
                                            <p className="text-sm text-muted-foreground">No tasks yet</p>
                                            {project.lists.length > 0 && permissions.canEdit && (
                                                <CreateTaskDialog
                                                    project={project}
                                                    list={project.lists[0]}
                                                    canAssignTask={permissions.canAssignTask}
                                                    trigger={
                                                        <Button variant="outline" size="sm" className="mt-2 gap-1">
                                                            <Plus className="size-3" />
                                                            Add first task
                                                        </Button>
                                                    }
                                                />
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {/* No results from filter */}
                            {totalAllTasks > 0 && totalFilteredTasks === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="size-8 text-muted-foreground/30" />
                                            <p className="text-sm text-muted-foreground">No tasks match your filters</p>
                                            <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2 gap-1">
                                                <X className="size-3" />
                                                Clear filters
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalFilteredTasks > 0 && (
                        <div className="flex flex-col items-center gap-3 border-t px-4 py-3 sm:flex-row sm:justify-between">
                            <div className="text-sm text-muted-foreground">
                                Showing {startIndex + 1}-{endIndex} of {totalFilteredTasks} tasks
                                {hasActiveFilters && <span className="text-muted-foreground/70"> (filtered)</span>}
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                                    <Select value={String(rowsPerPage)} onValueChange={handleRowsPerPageChange}>
                                        <SelectTrigger className="h-8 w-17.5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROWS_PER_PAGE_OPTIONS.map((option) => (
                                                <SelectItem key={option} value={String(option)}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon-sm"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="size-4" />
                                    </Button>
                                    <div className="flex items-center gap-1 px-2">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum: number;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? 'default' : 'ghost'}
                                                    size="icon-sm"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className="size-8"
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon-sm"
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Lists summary and add button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="mt-4 rounded-lg border bg-muted/30 p-3 sm:p-4"
                >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="flex-1">
                            <h4 className="mb-2 text-sm font-medium text-muted-foreground sm:mb-3">Lists</h4>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {project.lists.map((list) => (
                                    <div key={list.id} className="flex items-center">
                                        <Badge variant="outline" className="max-w-[16ch] gap-1 pr-1 text-xs sm:max-w-[20ch] sm:gap-1.5 sm:text-sm" title={list.name}>
                                            <div
                                                className="size-2 rounded-full shrink-0"
                                                style={{ backgroundColor: project.color }}
                                            />
                                            <span className="truncate">{list.name}</span>
                                            <span className="shrink-0 text-muted-foreground">({list.tasks.length})</span>
                                            {permissions.canEdit && !list.is_done_list && (
                                                <CreateTaskDialog
                                                    project={project}
                                                    list={list}
                                                    canAssignTask={permissions.canAssignTask}
                                                    trigger={
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button variant="ghost" size="icon-sm" className="ml-0.5 size-5 rounded-full hover:bg-primary/10">
                                                                    <Plus className="size-3" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Add task to {list.name}</TooltipContent>
                                                        </Tooltip>
                                                    }
                                                />
                                            )}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {permissions.canEdit && <CreateListDialog project={project} />}
                    </div>
                </motion.div>
            </ScrollArea>

            {/* Task Detail Sheet */}
            <TaskDetailSheet
                task={selectedTask}
                project={project}
                permissions={permissions}
                open={!!selectedTask}
                onOpenChange={(open) => !open && setSelectedTask(null)}
            />
        </>
    );
}
