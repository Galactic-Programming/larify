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
import type { FilterType, SortType } from '@/pages/projects/lib/types';
import { Search } from 'lucide-react';
import { motion } from 'motion/react';

interface ProjectsFiltersProps {
    filter: FilterType;
    onFilterChange: (filter: FilterType) => void;
    sortBy: SortType;
    onSortChange: (sort: SortType) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    activeCount: number;
    archivedCount: number;
    totalCount: number;
}

export function ProjectsFilters({
    filter,
    onFilterChange,
    sortBy,
    onSortChange,
    searchQuery,
    onSearchChange,
    activeCount,
    archivedCount,
    totalCount,
}: ProjectsFiltersProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4"
        >
            {/* Status Filter */}
            <div className="flex w-full gap-1 rounded-lg border bg-muted/30 p-1 sm:w-auto">
                <Button
                    variant={filter === 'active' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onFilterChange('active')}
                    className="flex-1 gap-1 text-xs sm:flex-initial sm:gap-1.5 sm:text-sm"
                >
                    Active
                    <Badge variant={filter === 'active' ? 'secondary' : 'outline'} className="ml-0.5 sm:ml-1">
                        {activeCount}
                    </Badge>
                </Button>
                <Button
                    variant={filter === 'archived' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onFilterChange('archived')}
                    className="flex-1 gap-1 text-xs sm:flex-initial sm:gap-1.5 sm:text-sm"
                >
                    Archived
                    <Badge variant={filter === 'archived' ? 'secondary' : 'outline'} className="ml-0.5 sm:ml-1">
                        {archivedCount}
                    </Badge>
                </Button>
                <Button
                    variant={filter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onFilterChange('all')}
                    className="flex-1 gap-1 text-xs sm:flex-initial sm:gap-1.5 sm:text-sm"
                >
                    All
                    <Badge variant={filter === 'all' ? 'secondary' : 'outline'} className="ml-0.5 sm:ml-1">
                        {totalCount}
                    </Badge>
                </Button>
            </div>

            {/* Sort & Search */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortType)}>
                    <SelectTrigger className="h-9 w-full sm:w-44">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="recent">Recently Updated</SelectItem>
                        <SelectItem value="created">Date Created</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                </Select>

                <div className="group relative">
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="h-9 w-full pl-9 transition-all duration-200 sm:w-50 sm:focus:w-65"
                    />
                </div>
            </div>
        </motion.div>
    );
}
