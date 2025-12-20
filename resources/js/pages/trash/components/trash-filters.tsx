import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TrashFilter, TrashSortBy } from '@/types/trash.d';
import { ArrowDownWideNarrow, Clock, FolderKanban, LayoutList, ListTodo, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface TrashFiltersProps {
    filter: TrashFilter;
    onFilterChange: (filter: TrashFilter) => void;
    sortBy: TrashSortBy;
    onSortChange: (sort: TrashSortBy) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    counts: {
        all: number;
        projects: number;
        lists: number;
        tasks: number;
    };
}

export function TrashFilters({
    filter,
    onFilterChange,
    sortBy,
    onSortChange,
    searchQuery,
    onSearchChange,
    counts,
}: TrashFiltersProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-4"
        >
            {/* Search and Sort Row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search trash..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select value={sortBy} onValueChange={(value) => onSortChange(value as TrashSortBy)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <ArrowDownWideNarrow className="mr-2 size-4" />
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="recent">
                            <div className="flex items-center gap-2">
                                <Clock className="size-4" />
                                Most Recent
                            </div>
                        </SelectItem>
                        <SelectItem value="type">
                            <div className="flex items-center gap-2">
                                <FolderKanban className="size-4" />
                                By Type
                            </div>
                        </SelectItem>
                        <SelectItem value="remaining">
                            <div className="flex items-center gap-2">
                                <Clock className="size-4 text-destructive" />
                                Time Remaining
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Filter Tabs */}
            <Tabs value={filter} onValueChange={(value) => onFilterChange(value as TrashFilter)}>
                <TabsList className="grid w-full grid-cols-4 sm:w-auto sm:grid-cols-none">
                    <TabsTrigger value="all" className="gap-2">
                        All
                        <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">
                            {counts.all}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="projects" className="gap-2">
                        <FolderKanban className="size-4 sm:hidden" />
                        <span className="hidden sm:inline">Projects</span>
                        <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">
                            {counts.projects}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="lists" className="gap-2">
                        <LayoutList className="size-4 sm:hidden" />
                        <span className="hidden sm:inline">Lists</span>
                        <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">
                            {counts.lists}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="tasks" className="gap-2">
                        <ListTodo className="size-4 sm:hidden" />
                        <span className="hidden sm:inline">Tasks</span>
                        <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">
                            {counts.tasks}
                        </Badge>
                    </TabsTrigger>
                </TabsList>
            </Tabs>
        </motion.div>
    );
}
