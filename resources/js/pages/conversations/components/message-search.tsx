import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/chat';
import { format } from 'date-fns';
import { Loader2, Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface MessageSearchProps {
    conversationId: number;
    onSelectMessage?: (message: Message) => void;
}

export function MessageSearch({
    conversationId,
    onSelectMessage,
}: MessageSearchProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Message[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const searchMessages = useCallback(
        async (searchQuery: string) => {
            if (searchQuery.length < 2) {
                setResults([]);
                setTotal(0);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(
                    `/api/conversations/${conversationId}/messages/search?q=${encodeURIComponent(searchQuery)}`,
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-CSRF-TOKEN':
                                document.querySelector<HTMLMetaElement>(
                                    'meta[name="csrf-token"]',
                                )?.content ?? '',
                        },
                    },
                );

                if (!response.ok) {
                    throw new Error('Search failed');
                }

                const data = await response.json();
                setResults(data.messages);
                setTotal(data.total);
            } catch {
                setError('Failed to search messages');
                setResults([]);
                setTotal(0);
            } finally {
                setIsLoading(false);
            }
        },
        [conversationId],
    );

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            if (query) {
                searchMessages(query);
            } else {
                setResults([]);
                setTotal(0);
            }
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, searchMessages]);

    // Focus input when popover opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setTotal(0);
        inputRef.current?.focus();
    };

    const handleSelectMessage = (message: Message) => {
        onSelectMessage?.(message);
        setIsOpen(false);
        setQuery('');
        setResults([]);
    };

    const highlightMatch = (text: string, searchQuery: string) => {
        if (!searchQuery) return text;
        const regex = new RegExp(`(${searchQuery})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? (
                <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">
                    {part}
                </mark>
            ) : (
                part
            ),
        );
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" title="Search messages">
                    <Search className="h-5 w-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-80 p-0"
                align="end"
                sideOffset={8}
            >
                <div className="flex flex-col">
                    {/* Search input */}
                    <div className="flex items-center gap-2 border-b p-3">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search messages..."
                            className="h-8 border-0 p-0 focus-visible:ring-0"
                        />
                        {query && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={handleClear}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>

                    {/* Results */}
                    <ScrollArea className="max-h-80">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : error ? (
                            <div className="px-4 py-8 text-center text-sm text-destructive">
                                {error}
                            </div>
                        ) : query.length > 0 && query.length < 2 ? (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                Type at least 2 characters to search
                            </div>
                        ) : results.length === 0 && query.length >= 2 ? (
                            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                                No messages found
                            </div>
                        ) : results.length > 0 ? (
                            <div className="py-1">
                                {total > results.length && (
                                    <div className="px-3 py-2 text-xs text-muted-foreground">
                                        Showing {results.length} of {total}{' '}
                                        results
                                    </div>
                                )}
                                {results.map((message) => (
                                    <button
                                        key={message.id}
                                        onClick={() =>
                                            handleSelectMessage(message)
                                        }
                                        className={cn(
                                            'w-full px-3 py-2 text-left transition-colors hover:bg-muted',
                                            'focus:bg-muted focus:outline-none',
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {message.sender?.name ??
                                                    'Unknown'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(
                                                    new Date(
                                                        message.created_at,
                                                    ),
                                                    'MMM d, yyyy',
                                                )}
                                            </span>
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-sm">
                                            {highlightMatch(
                                                message.content,
                                                query,
                                            )}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </ScrollArea>
                </div>
            </PopoverContent>
        </Popover>
    );
}
