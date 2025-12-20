import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import type { TrashFilter } from '@/types/trash.d';
import { FolderKanban, LayoutList, ListTodo, Search, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { createElement, useMemo } from 'react';

interface TrashEmptyStateProps {
    filter: TrashFilter;
    searchQuery: string;
    onClearSearch: () => void;
}

export function TrashEmptyState({ filter, searchQuery, onClearSearch }: TrashEmptyStateProps) {
    const FilterIcon = useMemo(() => {
        switch (filter) {
            case 'projects':
                return FolderKanban;
            case 'lists':
                return LayoutList;
            case 'tasks':
                return ListTodo;
            default:
                return Trash2;
        }
    }, [filter]);

    const getFilterLabel = () => {
        switch (filter) {
            case 'projects':
                return 'projects';
            case 'lists':
                return 'lists';
            case 'tasks':
                return 'tasks';
            default:
                return 'items';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
        >
            {searchQuery ? (
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Search />
                        </EmptyMedia>
                        <EmptyTitle>No results found</EmptyTitle>
                        <EmptyDescription>
                            No deleted items found matching "{searchQuery}". Try a different search term.
                        </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                        <Button variant="outline" onClick={onClearSearch}>
                            Clear search
                        </Button>
                    </EmptyContent>
                </Empty>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-20">
                    <div className="relative mb-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                            className="flex size-24 items-center justify-center rounded-2xl bg-muted shadow-xl"
                        >
                            {createElement(FilterIcon, { className: 'size-12 text-muted-foreground' })}
                        </motion.div>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
                            className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full bg-green-500 text-white shadow-lg"
                        >
                            ✓
                        </motion.div>
                    </div>
                    <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-2 text-xl font-semibold"
                    >
                        Trash is empty
                    </motion.h3>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="max-w-sm text-center text-muted-foreground"
                    >
                        {filter === 'all'
                            ? 'No deleted items. When you delete projects, lists, or tasks, they will appear here.'
                            : `No deleted ${getFilterLabel()} found.`}
                    </motion.p>
                </div>
            )}
        </motion.div>
    );
}
