import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TrashFilter, TrashSortBy } from '@/types/trash.d';
import { ArrowDownWideNarrow, CheckSquare, Clock, FolderKanban, LayoutList, Search } from 'lucide-react';
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
            {/* Filter Buttons */}
            <div className="grid grid-cols-4 gap-1 rounded-lg border bg-muted/30 p-1">
                <Button
                    variant={filter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onFilterChange('all')}
                    className="gap-1.5 text-xs sm:text-sm"
                >
                    All
                    {counts.all > 0 && (
                        <Badge variant={filter === 'all' ? 'secondary' : 'outline'} className="ml-0.5">
                            {counts.all}
                        </Badge>
                    )}
                </Button>
                <Button
                    variant={filter === 'projects' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onFilterChange('projects')}
                    className="gap-1.5 text-xs sm:text-sm"
                >
                    <FolderKanban className="size-4" />
                    <span className="hidden xs:inline">Projects</span>
                    {counts.projects > 0 && (
                        <Badge variant={filter === 'projects' ? 'secondary' : 'outline'} className="ml-0.5">
                            {counts.projects}
                        </Badge>
                    )}
                </Button>
                <Button
                    variant={filter === 'lists' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onFilterChange('lists')}
                    className="gap-1.5 text-xs sm:text-sm"
                >
                    <LayoutList className="size-4" />
                    <span className="hidden xs:inline">Lists</span>
                    {counts.lists > 0 && (
                        <Badge variant={filter === 'lists' ? 'secondary' : 'outline'} className="ml-0.5">
                            {counts.lists}
                        </Badge>
                    )}
                </Button>
                <Button
                    variant={filter === 'tasks' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onFilterChange('tasks')}
                    className="gap-1.5 text-xs sm:text-sm"
                >
                    <CheckSquare className="size-4" />
                    <span className="hidden xs:inline">Tasks</span>
                    {counts.tasks > 0 && (
                        <Badge variant={filter === 'tasks' ? 'secondary' : 'outline'} className="ml-0.5">
                            {counts.tasks}
                        </Badge>
                    )}
                </Button>
            </div>

            {/* Search and Sort Row */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search deleted items..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select value={sortBy} onValueChange={(value) => onSortChange(value as TrashSortBy)}>
                    <SelectTrigger className="w-full sm:w-64">
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
        </motion.div>
    );
}
