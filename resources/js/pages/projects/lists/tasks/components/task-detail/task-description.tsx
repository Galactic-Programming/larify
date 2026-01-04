import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface TaskDescriptionProps {
    description: string | null;
}

const COLLAPSED_HEIGHT = 128; // max-h-32 = 8rem = 128px

export function TaskDescription({ description }: TaskDescriptionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [needsExpansion, setNeedsExpansion] = useState(false);
    const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            const scrollHeight = contentRef.current.scrollHeight;
            setNeedsExpansion(scrollHeight > COLLAPSED_HEIGHT);
            setContentHeight(scrollHeight);
        }
    }, [description]);

    if (!description) return null;

    return (
        <div className="space-y-2">
            <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Description
            </h4>
            <div className="overflow-hidden rounded-lg bg-muted/30 p-3 sm:p-4">
                <div
                    ref={contentRef}
                    className={cn(
                        'text-sm leading-relaxed text-foreground/80 overflow-hidden transition-all duration-200',
                        !isExpanded && needsExpansion && 'max-h-32',
                    )}
                    style={{
                        maxHeight: isExpanded ? contentHeight : undefined,
                    }}
                >
                    <MarkdownRenderer>{description}</MarkdownRenderer>
                </div>
                {needsExpansion && (
                    <div className={cn(
                        'relative',
                        !isExpanded && '-mt-6 pt-6 bg-linear-to-t from-muted/30 to-transparent',
                    )}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-full gap-1 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? (
                                <>
                                    <ChevronUp className="size-3" />
                                    Show less
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="size-3" />
                                    Show more
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
