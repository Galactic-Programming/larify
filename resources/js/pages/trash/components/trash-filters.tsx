import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { TrashFilter, TrashSortBy } from '@/types/trash.d';
import {
    CheckSquare,
    Clock,
    FolderKanban,
    LayoutList,
    Search,
} from 'lucide-react';
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
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4"
        >
            {/* Filter Buttons */}
            <div className="flex w-full gap-1 rounded-lg border bg-muted/30 p-1 sm:w-auto">
                <Button
                    variant={filter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onFilterChange('all')}
                    className="flex-1 gap-1 text-xs sm:flex-initial sm:gap-1.5 sm:text-sm"
                >
                    All
                    <Badge
                        variant={filter === 'all' ? 'secondary' : 'outline'}
                        className="ml-0.5 sm:ml-1"
                    >
                        {counts.all}
                    </Badge>
                </Button>
                <Button
                    variant={filter === 'projects' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onFilterChange('projects')}
                    className="flex-1 gap-1 text-xs sm:flex-initial sm:gap-1.5 sm:text-sm"
                >
                    <FolderKanban className="size-4" />
                    <span className="xs:inline hidden">Projects</span>
                    <Badge
                        variant={
                            filter === 'projects' ? 'secondary' : 'outline'
                        }
                        className="ml-0.5 sm:ml-1"
                    >
                        {counts.projects}
                    </Badge>
                </Button>
                <Button
                    variant={filter === 'lists' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onFilterChange('lists')}
                    className="flex-1 gap-1 text-xs sm:flex-initial sm:gap-1.5 sm:text-sm"
                >
                    <LayoutList className="size-4" />
                    <span className="xs:inline hidden">Lists</span>
                    <Badge
                        variant={filter === 'lists' ? 'secondary' : 'outline'}
                        className="ml-0.5 sm:ml-1"
                    >
                        {counts.lists}
                    </Badge>
                </Button>
                <Button
                    variant={filter === 'tasks' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onFilterChange('tasks')}
                    className="flex-1 gap-1 text-xs sm:flex-initial sm:gap-1.5 sm:text-sm"
                >
                    <CheckSquare className="size-4" />
                    <span className="xs:inline hidden">Tasks</span>
                    <Badge
                        variant={filter === 'tasks' ? 'secondary' : 'outline'}
                        className="ml-0.5 sm:ml-1"
                    >
                        {counts.tasks}
                    </Badge>
                </Button>
            </div>

            {/* Sort & Search */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Select
                    value={sortBy}
                    onValueChange={(value) =>
                        onSortChange(value as TrashSortBy)
                    }
                >
                    <SelectTrigger className="h-9 w-full sm:w-40">
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

                <div className="group relative">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                        type="text"
                        placeholder="Search deleted items..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="h-9 w-full pl-9 transition-all duration-200 sm:w-50 sm:focus:w-65"
                    />
                </div>
            </div>
        </motion.div>
    );
}
