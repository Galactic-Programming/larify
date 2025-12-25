'use client';

import * as React from 'react';
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type Row,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    CircleCheck,
    Columns3,
    Ellipsis,
    GripVertical,
    Loader2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { motion } from 'motion/react';
import type { DashboardTask } from './types';

// Drag Handle Component
function DragHandle({ id }: { id: number }) {
    const { attributes, listeners } = useSortable({ id });

    return (
        <Button
            {...attributes}
            {...listeners}
            variant="ghost"
            size="icon"
            className="text-muted-foreground size-7 hover:bg-transparent"
        >
            <GripVertical className="text-muted-foreground size-3" />
            <span className="sr-only">Drag to reorder</span>
        </Button>
    );
}

// Priority badge colors
const priorityConfig: Record<
    string,
    { label: string; className: string }
> = {
    low: {
        label: 'Low',
        className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    medium: {
        label: 'Medium',
        className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    },
    high: {
        label: 'High',
        className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    },
    urgent: {
        label: 'Urgent',
        className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    },
};

// Status badge config
const statusConfig: Record<string, { icon: React.ReactNode; className: string }> = {
    completed: {
        icon: <CircleCheck className="size-3 fill-green-500 text-white dark:fill-green-400" />,
        className: 'text-green-600 dark:text-green-400',
    },
    'in progress': {
        icon: <Loader2 className="size-3" />,
        className: 'text-blue-600 dark:text-blue-400',
    },
    default: {
        icon: <Loader2 className="size-3" />,
        className: 'text-muted-foreground',
    },
};

// Format due date
function formatDueDate(dueDate: string | null, dueTime: string | null): string {
    if (!dueDate) return '—';

    const date = new Date(dueTime ? `${dueDate}T${dueTime}` : dueDate);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const timeStr = dueTime
        ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : '';

    if (isToday) return `Today${timeStr ? `, ${timeStr}` : ''}`;
    if (isTomorrow) return `Tomorrow${timeStr ? `, ${timeStr}` : ''}`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        ...(timeStr && { hour: 'numeric', minute: '2-digit' }),
    });
}

// Create columns
function createColumns(
    onComplete: (task: DashboardTask) => void,
    onDelete: (task: DashboardTask) => void,
    processingIds: Set<number>,
): ColumnDef<DashboardTask>[] {
    return [
        {
            id: 'drag',
            header: () => null,
            cell: ({ row }) => <DragHandle id={row.original.id} />,
            size: 40,
        },
        {
            accessorKey: 'title',
            header: 'Task',
            cell: ({ row }) => {
                const task = row.original;
                return (
                    <Link
                        href={`/projects/${task.project?.id}/lists`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                        {task.title}
                    </Link>
                );
            },
            enableHiding: false,
        },
        {
            accessorKey: 'project',
            header: 'Project',
            cell: ({ row }) => {
                const project = row.original.project;
                if (!project) return <span className="text-muted-foreground">—</span>;

                return (
                    <Badge variant="outline" className="text-muted-foreground px-1.5">
                        <span
                            className="mr-1.5 size-2 rounded-full"
                            style={{ backgroundColor: project.color }}
                        />
                        <span className="max-w-24 truncate">{project.name}</span>
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'due_date',
            header: 'Due Date',
            cell: ({ row }) => {
                const task = row.original;
                const isOverdue = task.is_overdue;

                return (
                    <span
                        className={cn(
                            'text-sm',
                            isOverdue && 'font-medium text-destructive',
                        )}
                    >
                        {formatDueDate(task.due_date, task.due_time)}
                    </span>
                );
            },
        },
        {
            accessorKey: 'list',
            header: 'Status',
            cell: ({ row }) => {
                const list = row.original.list;
                const statusName = list?.name?.toLowerCase() || 'default';
                const config =
                    statusConfig[statusName] || statusConfig.default;

                return (
                    <Badge
                        variant="outline"
                        className={cn('px-1.5', config.className)}
                    >
                        {config.icon}
                        {list?.name || 'No Status'}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'priority',
            header: 'Priority',
            cell: ({ row }) => {
                const priority = row.original.priority;
                if (!priority) {
                    return (
                        <Badge variant="outline" className="text-muted-foreground px-1.5">
                            None
                        </Badge>
                    );
                }

                const config = priorityConfig[priority];
                return (
                    <Badge
                        variant="outline"
                        className={cn('px-1.5 capitalize', config?.className)}
                    >
                        {config?.label || priority}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const task = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                                size="icon"
                            >
                                <Ellipsis className="size-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem
                                onClick={() => onComplete(task)}
                            >
                                Complete
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                variant="destructive"
                                onClick={() => onDelete(task)}
                            >
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
            size: 40,
        },
    ];
}

// Draggable Row Component
function DraggableRow({ row, index }: { row: Row<DashboardTask>; index: number }) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
        id: row.original.id,
    });

    return (
        <motion.tr
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            data-state={row.getIsSelected() && 'selected'}
            data-dragging={isDragging}
            ref={setNodeRef}
            className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
            style={{
                transform: CSS.Transform.toString(transform),
                transition: transition,
            }}
        >
            {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
            ))}
        </motion.tr>
    );
}

type TaskGroup = 'all' | 'overdue' | 'today' | 'later';

interface GroupedTaskData {
    all: DashboardTask[];
    overdue: DashboardTask[];
    today: DashboardTask[];
    later: DashboardTask[];
}

interface MyTasksTableProps {
    data: DashboardTask[];
    groupedData?: GroupedTaskData;
}

// Storage key for persisting table preferences
const STORAGE_KEY = 'dashboard-my-tasks-preferences';

interface TablePreferences {
    activeTab: TaskGroup;
    pageSize: number;
    columnVisibility: VisibilityState;
}

function getStoredPreferences(): Partial<TablePreferences> {
    if (typeof window === 'undefined') return {};
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch {
        return {};
    }
}

function savePreferences(prefs: Partial<TablePreferences>) {
    if (typeof window === 'undefined') return;
    try {
        const current = getStoredPreferences();
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...prefs }));
    } catch {
        // Ignore storage errors
    }
}

export function MyTasksTable({ data: initialData, groupedData }: MyTasksTableProps) {
    // Load stored preferences on mount
    const storedPrefs = React.useMemo(() => getStoredPreferences(), []);

    const [activeTab, setActiveTab] = React.useState<TaskGroup>(
        storedPrefs.activeTab || 'all'
    );
    const [data, setData] = React.useState(() => initialData);
    const [rowSelection, setRowSelection] = React.useState({});
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
        storedPrefs.columnVisibility || {}
    );
    const [processingIds, setProcessingIds] = React.useState<Set<number>>(
        new Set(),
    );
    const [pagination, setPagination] = React.useState({
        pageIndex: 0,
        pageSize: storedPrefs.pageSize || 10,
    });

    // Save activeTab to localStorage when it changes
    React.useEffect(() => {
        savePreferences({ activeTab });
    }, [activeTab]);

    // Save pageSize to localStorage when it changes
    React.useEffect(() => {
        savePreferences({ pageSize: pagination.pageSize });
    }, [pagination.pageSize]);

    // Save columnVisibility to localStorage when it changes
    React.useEffect(() => {
        savePreferences({ columnVisibility });
    }, [columnVisibility]);

    // Get filtered data based on active tab
    const filteredData = React.useMemo(() => {
        if (activeTab === 'all' || !groupedData) return data;
        return groupedData[activeTab] || [];
    }, [activeTab, data, groupedData]);

    // Get counts for each tab
    const tabCounts = React.useMemo(() => {
        if (!groupedData) {
            return { all: data.length, overdue: 0, today: 0, later: 0 };
        }
        return {
            all: data.length,
            overdue: groupedData.overdue.length,
            today: groupedData.today.length,
            later: groupedData.later.length,
        };
    }, [data, groupedData]);
    const sortableId = React.useId();
    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {}),
    );

    // Update data when initialData changes
    React.useEffect(() => {
        setData(initialData);
    }, [initialData]);

    const dataIds = React.useMemo<UniqueIdentifier[]>(
        () => data?.map(({ id }) => id) || [],
        [data],
    );

    const handleComplete = React.useCallback((task: DashboardTask) => {
        setProcessingIds((prev) => new Set(prev).add(task.id));
        router.patch(
            `/projects/${task.project?.id}/tasks/${task.id}/complete`,
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessingIds((prev) => {
                        const next = new Set(prev);
                        next.delete(task.id);
                        return next;
                    });
                },
            },
        );
    }, []);

    const handleDelete = React.useCallback((task: DashboardTask) => {
        setProcessingIds((prev) => new Set(prev).add(task.id));
        router.delete(
            `/projects/${task.project?.id}/tasks/${task.id}`,
            {
                preserveScroll: true,
                onFinish: () => {
                    setProcessingIds((prev) => {
                        const next = new Set(prev);
                        next.delete(task.id);
                        return next;
                    });
                },
            },
        );
    }, []);

    const columns = React.useMemo(
        () => createColumns(handleComplete, handleDelete, processingIds),
        [handleComplete, handleDelete, processingIds],
    );

    const table = useReactTable({
        data: filteredData,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            pagination,
        },
        getRowId: (row) => row.id.toString(),
        enableRowSelection: true,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (active && over && active.id !== over.id) {
            setData((data) => {
                const oldIndex = dataIds.indexOf(active.id);
                const newIndex = dataIds.indexOf(over.id);
                return arrayMove(data, oldIndex, newIndex);
            });
        }
    }

    return (
        <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TaskGroup)}
            className="flex w-full flex-1 flex-col justify-start gap-4"
        >
            {/* Toolbar with Tabs and Customize Columns */}
            <div className="flex items-center justify-between gap-4">
                <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
                    <TabsTrigger value="all">All Tasks</TabsTrigger>
                    <TabsTrigger value="overdue">
                        Overdue
                        {tabCounts.overdue > 0 && (
                            <Badge variant="secondary">{tabCounts.overdue}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="today">
                        Today
                        {tabCounts.today > 0 && (
                            <Badge variant="secondary">{tabCounts.today}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="later" className="hidden sm:inline-flex">
                        Later
                        {tabCounts.later > 0 && (
                            <Badge variant="secondary">{tabCounts.later}</Badge>
                        )}
                    </TabsTrigger>
                </TabsList>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <Columns3 className="size-4" />
                            <span className="hidden lg:inline">Customize Columns</span>
                            <span className="lg:hidden">Columns</span>
                            <ChevronDown className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        {table
                            .getAllColumns()
                            .filter(
                                (column) =>
                                    typeof column.accessorFn !== 'undefined' &&
                                    column.getCanHide(),
                            )
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id === 'due_date'
                                            ? 'Due Date'
                                            : column.id}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <TabsContent value={activeTab} className="relative flex min-h-0 flex-1 flex-col gap-4 mt-0">
                <ScrollArea className="min-h-0 flex-1 rounded-lg border">
                    <DndContext
                        collisionDetection={closestCenter}
                        modifiers={[restrictToVerticalAxis]}
                        onDragEnd={handleDragEnd}
                        sensors={sensors}
                        id={sortableId}
                    >
                        <Table>
                            <TableHeader className="bg-muted sticky top-0 z-10">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                colSpan={header.colSpan}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext(),
                                                    )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody className="**:data-[slot=table-cell]:first:w-8">
                                {table.getRowModel().rows?.length ? (
                                    <SortableContext
                                        items={dataIds}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {table.getRowModel().rows.map((row, index) => (
                                            <DraggableRow key={row.id} row={row} index={index} />
                                        ))}
                                    </SortableContext>
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            No tasks found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </DndContext>
                </ScrollArea>

                {/* Pagination */}
                <div className="flex items-center justify-between px-2">
                    <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                        {table.getFilteredSelectedRowModel().rows.length} of{' '}
                        {table.getFilteredRowModel().rows.length} row(s) selected.
                    </div>
                    <div className="flex w-full items-center gap-8 lg:w-fit">
                        <div className="hidden items-center gap-2 lg:flex">
                            <Label
                                htmlFor="rows-per-page"
                                className="text-sm font-medium"
                            >
                                Rows per page
                            </Label>
                            <Select
                                value={`${table.getState().pagination.pageSize}`}
                                onValueChange={(value) => {
                                    table.setPageSize(Number(value));
                                }}
                            >
                                <SelectTrigger
                                    size="sm"
                                    className="w-20"
                                    id="rows-per-page"
                                >
                                    <SelectValue
                                        placeholder={
                                            table.getState().pagination.pageSize
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 30, 40, 50].map((pageSize) => (
                                        <SelectItem
                                            key={pageSize}
                                            value={`${pageSize}`}
                                        >
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex w-fit items-center justify-center text-sm font-medium">
                            Page {table.getState().pagination.pageIndex + 1} of{' '}
                            {table.getPageCount() || 1}
                        </div>
                        <div className="ml-auto flex items-center gap-2 lg:ml-0">
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to first page</span>
                                <ChevronsLeft className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="size-8"
                                size="icon"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to previous page</span>
                                <ChevronLeft className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="size-8"
                                size="icon"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to next page</span>
                                <ChevronRight className="size-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="hidden size-8 lg:flex"
                                size="icon"
                                onClick={() =>
                                    table.setPageIndex(table.getPageCount() - 1)
                                }
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to last page</span>
                                <ChevronsRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    );
}
