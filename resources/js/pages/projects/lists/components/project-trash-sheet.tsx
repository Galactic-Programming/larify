import {
    forceDeleteList,
    forceDeleteTask,
    index as projectTrashIndex,
    restoreList,
    restoreTask,
} from '@/actions/App/Http/Controllers/Projects/ProjectTrashController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ProjectTrashItemType, TrashSortBy } from '@/types/trash';
import { router } from '@inertiajs/react';
import {
    ArrowDownUp,
    Calendar,
    CheckSquare,
    Clock,
    ListTodo,
    RotateCcw,
    Search,
    Trash2,
    Undo2,
    X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import * as React from 'react';

// Local interface matching backend response (ProjectTrashController)
interface ApiTrashedList {
    id: number;
    type: 'list';
    name: string;
    deleted_at: string;
    deleted_at_human: string;
    expires_at: string;
    expires_at_human: string;
    tasks_count: number;
}

interface ApiTrashedTask {
    id: number;
    type: 'task';
    title: string;
    description: string | null;
    priority: string | null;
    due_date: string | null;
    list: { id: number; name: string } | null;
    assignee: { id: number; name: string; avatar: string | null } | null;
    deleted_at: string;
    deleted_at_human: string;
    expires_at: string;
    expires_at_human: string;
}

interface ProjectTrashData {
    trashedLists: ApiTrashedList[];
    trashedTasks: ApiTrashedTask[];
    retentionDays: number;
}

interface ProjectTrashSheetProps {
    projectId: number;
}

type NormalizedItem = {
    id: number;
    type: 'list' | 'task';
    name: string;
    color: string | null;
    icon: React.ReactNode;
    deletedAt: Date;
    expiresAt: Date;
    parentInfo?: string;
    tasksCount?: number;
    original: ApiTrashedList | ApiTrashedTask;
};

function normalizeList(list: ApiTrashedList): NormalizedItem {
    return {
        id: list.id,
        type: 'list',
        name: list.name,
        color: null,
        icon: <ListTodo className="size-4" />,
        deletedAt: new Date(list.deleted_at),
        expiresAt: new Date(list.expires_at),
        tasksCount: list.tasks_count,
        original: list,
    };
}

function normalizeTask(task: ApiTrashedTask): NormalizedItem {
    return {
        id: task.id,
        type: 'task',
        name: task.title,
        color: null,
        icon: <CheckSquare className="size-4" />,
        deletedAt: new Date(task.deleted_at),
        expiresAt: new Date(task.expires_at),
        parentInfo: task.list ? `in ${task.list.name}` : undefined,
        original: task,
    };
}

function getTimeRemaining(expiresAt: Date): {
    text: string;
    isUrgent: boolean;
} {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 1) {
        return { text: `${days} days left`, isUrgent: false };
    } else if (hours > 1) {
        return { text: `${hours} hours left`, isUrgent: hours < 24 };
    } else if (hours === 1) {
        return { text: '1 hour left', isUrgent: true };
    } else {
        return { text: 'Expiring soon', isUrgent: true };
    }
}

function ProjectTrashItem({
    item,
    projectId,
    onAction,
}: {
    item: NormalizedItem;
    projectId: number;
    onAction: () => void;
}) {
    const [isRestoring, setIsRestoring] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const timeRemaining = getTimeRemaining(item.expiresAt);

    const handleRestore = () => {
        setIsRestoring(true);
        const route =
            item.type === 'list'
                ? restoreList([projectId, item.id])
                : restoreTask([projectId, item.id]);

        router.patch(
            route.url,
            {},
            {
                preserveScroll: true,
                onSuccess: onAction,
                onFinish: () => setIsRestoring(false),
            },
        );
    };

    const handleForceDelete = () => {
        setIsDeleting(true);
        const route =
            item.type === 'list'
                ? forceDeleteList([projectId, item.id])
                : forceDeleteTask([projectId, item.id]);

        router.delete(route.url, {
            preserveScroll: true,
            onSuccess: onAction,
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="group relative flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
        >
            {/* Color accent */}
            {item.color && (
                <div
                    className="absolute top-0 left-0 h-full w-1 rounded-l-lg"
                    style={{ backgroundColor: item.color }}
                />
            )}

            {/* Icon */}
            <div
                className="flex size-8 shrink-0 items-center justify-center rounded-md"
                style={{
                    backgroundColor: item.color
                        ? `${item.color}20`
                        : 'hsl(var(--muted))',
                    color: item.color || 'hsl(var(--muted-foreground))',
                }}
            >
                {item.icon}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{item.type}</span>
                    {item.type === 'list' &&
                        item.tasksCount !== undefined &&
                        item.tasksCount > 0 && (
                            <>
                                <span>•</span>
                                <span>
                                    {item.tasksCount}{' '}
                                    {item.tasksCount === 1 ? 'task' : 'tasks'}{' '}
                                    included
                                </span>
                            </>
                        )}
                    {item.parentInfo && (
                        <>
                            <span>•</span>
                            <span className="truncate">{item.parentInfo}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Time remaining */}
            <Badge
                variant={timeRemaining.isUrgent ? 'destructive' : 'secondary'}
                className="shrink-0 text-xs"
            >
                <Clock className="mr-1 size-3" />
                {timeRemaining.text}
            </Badge>

            {/* Actions */}
            <div className="flex items-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={handleRestore}
                            disabled={isRestoring || isDeleting}
                        >
                            {isRestoring ? (
                                <RotateCcw className="size-4 animate-spin" />
                            ) : (
                                <Undo2 className="size-4" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {item.type === 'list' &&
                        item.tasksCount &&
                        item.tasksCount > 0
                            ? `Restore list and ${item.tasksCount} ${item.tasksCount === 1 ? 'task' : 'tasks'}`
                            : 'Restore'}
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={handleForceDelete}
                            disabled={isRestoring || isDeleting}
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete Permanently</TooltipContent>
                </Tooltip>
            </div>
        </motion.div>
    );
}

export function ProjectTrashSheet({ projectId }: ProjectTrashSheetProps) {
    const [open, setOpen] = React.useState(false);
    const [trashData, setTrashData] = React.useState<ProjectTrashData | null>(
        null,
    );
    const [isLoading, setIsLoading] = React.useState(false);
    const [filter, setFilter] = React.useState<ProjectTrashItemType>('all');
    const [sortBy, setSortBy] = React.useState<TrashSortBy>('recent');
    const [searchQuery, setSearchQuery] = React.useState('');

    const loadTrashData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(projectTrashIndex(projectId).url, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            const data = await response.json();
            setTrashData(data);
        } catch (error) {
            console.error('Failed to load trash data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    React.useEffect(() => {
        if (open) {
            loadTrashData();
        }
    }, [open, loadTrashData]);

    // Normalize and combine items
    const normalizedItems = React.useMemo(() => {
        if (!trashData) return [];

        const items: NormalizedItem[] = [
            ...(trashData.trashedLists || []).map(normalizeList),
            ...(trashData.trashedTasks || []).map(normalizeTask),
        ];

        return items;
    }, [trashData]);

    // Filter items
    const filteredItems = React.useMemo(() => {
        let items = normalizedItems;

        // Type filter
        if (filter === 'lists') {
            items = items.filter((item) => item.type === 'list');
        } else if (filter === 'tasks') {
            items = items.filter((item) => item.type === 'task');
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter(
                (item) =>
                    item.name.toLowerCase().includes(query) ||
                    item.parentInfo?.toLowerCase().includes(query),
            );
        }

        // Sort
        items.sort((a, b) => {
            switch (sortBy) {
                case 'recent':
                    return b.deletedAt.getTime() - a.deletedAt.getTime();
                case 'type':
                    return a.type.localeCompare(b.type);
                case 'expiring':
                    return a.expiresAt.getTime() - b.expiresAt.getTime();
                default:
                    return 0;
            }
        });

        return items;
    }, [normalizedItems, filter, sortBy, searchQuery]);

    // Counts
    const counts = React.useMemo(() => {
        return {
            all: normalizedItems.length,
            lists: normalizedItems.filter((i) => i.type === 'list').length,
            tasks: normalizedItems.filter((i) => i.type === 'task').length,
        };
    }, [normalizedItems]);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <SheetTrigger asChild>
                        <Button>
                            <Trash2 className="size-4" />
                            Trash
                        </Button>
                    </SheetTrigger>
                </TooltipTrigger>
                <TooltipContent>View Deleted Items</TooltipContent>
            </Tooltip>

            <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                <SheetHeader className="border-b px-4 py-4 sm:px-6">
                    <SheetTitle className="flex items-center gap-2">
                        <Trash2 className="size-5" />
                        Project Trash
                    </SheetTitle>
                    <SheetDescription>
                        Deleted lists and tasks from this project. Items are
                        automatically removed after 7 days. When a list is
                        deleted, its tasks are included and will be restored
                        together.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-1 flex-col gap-4 overflow-hidden px-4 py-4 sm:px-6">
                    {/* Filters */}
                    <div className="flex flex-col gap-3">
                        {/* Tabs */}
                        <Tabs
                            value={filter}
                            onValueChange={(v) =>
                                setFilter(v as ProjectTrashItemType)
                            }
                            className="w-full"
                        >
                            <TabsList className="w-full">
                                <TabsTrigger
                                    value="all"
                                    className="flex-1 gap-1.5"
                                >
                                    All
                                    {counts.all > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="ml-1 h-5 px-1.5"
                                        >
                                            {counts.all}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="lists"
                                    className="flex-1 gap-1.5"
                                >
                                    <ListTodo className="size-3.5" />
                                    Lists
                                    {counts.lists > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="ml-1 h-5 px-1.5"
                                        >
                                            {counts.lists}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger
                                    value="tasks"
                                    className="flex-1 gap-1.5"
                                >
                                    <CheckSquare className="size-3.5" />
                                    Tasks
                                    {counts.tasks > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="ml-1 h-5 px-1.5"
                                        >
                                            {counts.tasks}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Search and Sort */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search deleted items..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="pr-9 pl-9"
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        <X className="size-4" />
                                    </Button>
                                )}
                            </div>
                            <Select
                                value={sortBy}
                                onValueChange={(v) =>
                                    setSortBy(v as TrashSortBy)
                                }
                            >
                                <SelectTrigger className="w-40">
                                    <ArrowDownUp className="mr-2 size-4" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="recent">
                                        <span className="flex items-center gap-2">
                                            <Calendar className="size-4" />
                                            Recent
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="type">
                                        <span className="flex items-center gap-2">
                                            <ListTodo className="size-4" />
                                            Type
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="expiring">
                                        <span className="flex items-center gap-2">
                                            <Clock className="size-4" />
                                            Expiring Soon
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Content */}
                    <ScrollArea className="-mx-4 flex-1 sm:-mx-6">
                        <div className="flex flex-col gap-2 px-4 sm:px-6">
                            {isLoading ? (
                                <div className="flex flex-col gap-2">
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="h-16 animate-pulse rounded-lg bg-muted"
                                        />
                                    ))}
                                </div>
                            ) : filteredItems.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center py-12 text-center"
                                >
                                    <div className="mb-4 rounded-full bg-muted p-4">
                                        <Trash2 className="size-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="font-semibold">
                                        {searchQuery
                                            ? 'No matches found'
                                            : 'Trash is empty'}
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {searchQuery
                                            ? `No items match "${searchQuery}"`
                                            : 'Deleted items from this project will appear here'}
                                    </p>
                                </motion.div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredItems.map((item) => (
                                        <ProjectTrashItem
                                            key={`${item.type}-${item.id}`}
                                            item={item}
                                            projectId={projectId}
                                            onAction={loadTrashData}
                                        />
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </SheetContent>
        </Sheet>
    );
}
