import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Participant } from '@/types/chat';
import { SparklesIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface MentionAutocompleteProps {
    participants: Participant[];
    inputValue: string;
    onSelect: (participant: Participant, mentionStart: number) => void;
    className?: string;
}

export function MentionAutocomplete({
    participants,
    inputValue,
    onSelect,
    className,
}: MentionAutocompleteProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Find @mention trigger in input (look for last @ followed by text)
    const mentionTrigger = useMemo(() => {
        // Find the last @ that's not part of an email
        const atIndex = inputValue.lastIndexOf('@');
        if (atIndex === -1) return null;

        // Check if @ is at start or preceded by whitespace
        if (atIndex > 0 && !/\s/.test(inputValue[atIndex - 1])) {
            return null;
        }

        // Get the search query after @
        const query = inputValue.slice(atIndex + 1);

        // Don't show autocomplete if query contains space (mention completed)
        if (query.includes(' ')) return null;

        return { atIndex, query };
    }, [inputValue]);

    // Calculate filtered participants based on mention trigger
    const filteredParticipants = useMemo(() => {
        if (!mentionTrigger) return [];

        const { query } = mentionTrigger;
        return participants.filter((p) => {
            const lowerQuery = query.toLowerCase();
            return (
                p.name.toLowerCase().includes(lowerQuery) ||
                (p.email && p.email.toLowerCase().includes(lowerQuery))
            );
        });
    }, [mentionTrigger, participants]);

    // Derived state
    const isOpen = filteredParticipants.length > 0;
    const mentionStart = mentionTrigger?.atIndex ?? -1;

    // Ensure selectedIndex is valid when filteredParticipants changes
    const validSelectedIndex = Math.min(
        selectedIndex,
        Math.max(0, filteredParticipants.length - 1),
    );

    // Handle selecting a participant
    const handleSelect = useCallback(
        (participant: Participant) => {
            onSelect(participant, mentionStart);
        },
        [onSelect, mentionStart],
    );

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev < filteredParticipants.length - 1 ? prev + 1 : 0,
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex((prev) =>
                        prev > 0 ? prev - 1 : filteredParticipants.length - 1,
                    );
                    break;
                case 'Enter':
                case 'Tab':
                    if (filteredParticipants[validSelectedIndex]) {
                        e.preventDefault();
                        handleSelect(filteredParticipants[validSelectedIndex]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    // Do nothing - autocomplete will close when input loses @ trigger
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredParticipants, validSelectedIndex, handleSelect]);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (!isOpen) return null;

    return (
        <div
            ref={containerRef}
            className={cn(
                'absolute bottom-full left-0 z-50 mb-2 max-h-48 w-64 overflow-y-auto rounded-md border bg-popover p-1 shadow-lg',
                className,
            )}
        >
            {filteredParticipants.map((participant, index) => (
                <button
                    key={participant.id}
                    type="button"
                    className={cn(
                        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors',
                        index === validSelectedIndex
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent/50',
                        participant.is_ai &&
                            'bg-linear-to-r from-violet-500/10 to-purple-500/10',
                    )}
                    onClick={() => handleSelect(participant)}
                    onMouseEnter={() => setSelectedIndex(index)}
                >
                    {participant.is_ai ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-purple-600">
                            <SparklesIcon className="h-3.5 w-3.5 text-white" />
                        </div>
                    ) : (
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={participant.avatar} />
                            <AvatarFallback className="text-[10px]">
                                {getInitials(participant.name)}
                            </AvatarFallback>
                        </Avatar>
                    )}
                    <div className="min-w-0 flex-1">
                        <div
                            className={cn(
                                'truncate font-medium',
                                participant.is_ai &&
                                    'bg-linear-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent',
                            )}
                        >
                            {participant.name}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                            {participant.is_ai
                                ? 'AI Assistant'
                                : participant.email}
                        </div>
                    </div>
                    {participant.is_ai && (
                        <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400">
                            AI
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
