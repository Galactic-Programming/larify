import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { MessageReaction } from '@/types/chat';
import { SmilePlus } from 'lucide-react';
import { memo, useState } from 'react';

// Common emoji reactions
const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🎉', '🔥', '👏'];

interface ReactionPickerProps {
    onSelect: (emoji: string) => void;
    className?: string;
}

export function ReactionPicker({ onSelect, className }: ReactionPickerProps) {
    const [open, setOpen] = useState(false);

    const handleSelect = (emoji: string) => {
        onSelect(emoji);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn('h-7 w-7', className)}
                            >
                                <SmilePlus className="h-3.5 w-3.5" />
                            </Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Add reaction</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-auto p-2" align="center">
                <div className="flex gap-1">
                    {EMOJI_LIST.map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => handleSelect(emoji)}
                            className="rounded p-1.5 text-lg transition-colors hover:bg-muted"
                            type="button"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}

interface MessageReactionsProps {
    reactions: MessageReaction[];
    onToggle: (emoji: string) => void;
    isMine?: boolean;
}

/**
 * Display reactions for a message with counts and tooltips
 */
export const MessageReactions = memo(function MessageReactions({
    reactions,
    onToggle,
    isMine,
}: MessageReactionsProps) {
    if (!reactions || reactions.length === 0) {
        return null;
    }

    return (
        <div
            className={cn(
                'mt-1 flex flex-wrap gap-1',
                isMine && 'justify-end',
            )}
        >
            {reactions.map((reaction) => (
                <TooltipProvider key={reaction.emoji}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => onToggle(reaction.emoji)}
                                className={cn(
                                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
                                    reaction.reacted_by_me
                                        ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                                        : 'border-border bg-muted hover:bg-muted/80',
                                )}
                                type="button"
                            >
                                <span>{reaction.emoji}</span>
                                <span className="font-medium">
                                    {reaction.count}
                                </span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="text-xs">
                                {reaction.users
                                    .slice(0, 10)
                                    .map((u) => u.name)
                                    .join(', ')}
                                {reaction.users.length > 10 &&
                                    ` and ${reaction.users.length - 10} more`}
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ))}
        </div>
    );
});
