import {
    attach,
    detach,
} from '@/actions/App/Http/Controllers/Tasks/TaskLabelController';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Check, Plus, Tag } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import type { Label, Project, Task } from '../../lib/types';
import { LabelList, LABEL_SOLID_CLASSES } from './label-badge';

interface LabelFieldProps {
    project: Project;
    task: Task;
    selectedLabels: Label[];
    disabled?: boolean;
    onCreateLabel?: () => void;
    className?: string;
}

/**
 * LabelField component - Combines label display and selector
 * with optimistic UI updates for smooth UX
 */
export function LabelField({
    project,
    task,
    selectedLabels,
    disabled = false,
    onCreateLabel,
    className,
}: LabelFieldProps) {
    const [open, setOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Create a stable key from selectedLabels for sync detection
    const serverSelectedKey = useMemo(
        () => selectedLabels.map((l) => l.id).sort().join(','),
        [selectedLabels],
    );

    // Optimistic UI: Local state for immediate feedback
    // Reset when server state changes (tracked by serverSelectedKey)
    const [optimisticSelectedIds, setOptimisticSelectedIds] = useState<
        Set<number>
    >(() => new Set(selectedLabels.map((l) => l.id)));
    const [lastSyncedKey, setLastSyncedKey] = useState(serverSelectedKey);

    // Sync with server state when selectedLabels changes
    if (serverSelectedKey !== lastSyncedKey) {
        setLastSyncedKey(serverSelectedKey);
        setOptimisticSelectedIds(new Set(selectedLabels.map((l) => l.id)));
    }

    const projectLabels = useMemo(
        () => project.labels ?? [],
        [project.labels],
    );

    // Display labels based on optimistic state
    const displayLabels = useMemo(() => {
        return projectLabels.filter((l) => optimisticSelectedIds.has(l.id));
    }, [projectLabels, optimisticSelectedIds]);

    const handleToggleLabel = useCallback(
        (label: Label) => {
            if (isUpdating) return;

            const isSelected = optimisticSelectedIds.has(label.id);

            // Optimistic update: Update UI immediately
            setOptimisticSelectedIds((prev) => {
                const newSet = new Set(prev);
                if (isSelected) {
                    newSet.delete(label.id);
                } else {
                    newSet.add(label.id);
                }
                return newSet;
            });

            setIsUpdating(true);

            // Use attach/detach for single label toggle
            const action = isSelected ? detach : attach;

            router.post(
                action({ project, task }).url,
                { label_id: label.id },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onError: () => {
                        // Rollback on error
                        setOptimisticSelectedIds((prev) => {
                            const newSet = new Set(prev);
                            if (isSelected) {
                                newSet.add(label.id);
                            } else {
                                newSet.delete(label.id);
                            }
                            return newSet;
                        });
                    },
                    onFinish: () => setIsUpdating(false),
                },
            );
        },
        [project, task, optimisticSelectedIds, isUpdating],
    );

    return (
        <div className={cn('flex items-center gap-2', className)}>
            {/* Display selected labels with optimistic state */}
            {displayLabels.length > 0 ? (
                <LabelList labels={displayLabels} size="sm" maxVisible={3} />
            ) : (
                <span className="text-sm text-muted-foreground/60">
                    No labels
                </span>
            )}

            {/* Label selector popover - just icon trigger */}
            {!disabled && (
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-foreground"
                        >
                            <Tag className="size-4" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0" align="end">
                        <Command>
                            <CommandInput placeholder="Search labels..." />
                            <CommandList>
                                <CommandEmpty>No labels found.</CommandEmpty>
                                {projectLabels.length > 0 && (
                                    <CommandGroup>
                                        <ScrollArea className="max-h-48">
                                            {projectLabels.map((label) => {
                                                const isSelected =
                                                    optimisticSelectedIds.has(
                                                        label.id,
                                                    );
                                                return (
                                                    <CommandItem
                                                        key={label.id}
                                                        value={label.name}
                                                        onSelect={() =>
                                                            handleToggleLabel(
                                                                label,
                                                            )
                                                        }
                                                        className={cn(
                                                            'flex items-center gap-2 transition-colors duration-150',
                                                            isSelected &&
                                                            'bg-accent',
                                                        )}
                                                    >
                                                        <motion.div
                                                            className={cn(
                                                                'flex size-4 items-center justify-center rounded-sm border',
                                                                isSelected
                                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                                    : 'border-muted-foreground/30 bg-background',
                                                            )}
                                                            animate={{
                                                                scale: isSelected
                                                                    ? [1, 1.15, 1]
                                                                    : 1,
                                                            }}
                                                            transition={{
                                                                duration: 0.2,
                                                                ease: 'easeOut',
                                                            }}
                                                        >
                                                            <AnimatePresence mode="wait">
                                                                {isSelected && (
                                                                    <motion.div
                                                                        initial={{
                                                                            scale: 0,
                                                                            opacity: 0,
                                                                        }}
                                                                        animate={{
                                                                            scale: 1,
                                                                            opacity: 1,
                                                                        }}
                                                                        exit={{
                                                                            scale: 0,
                                                                            opacity: 0,
                                                                        }}
                                                                        transition={{
                                                                            duration: 0.15,
                                                                            ease: 'easeOut',
                                                                        }}
                                                                    >
                                                                        <Check className="size-3" />
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </motion.div>
                                                        <span
                                                            className={cn(
                                                                'inline-flex size-3.5 rounded-full',
                                                                LABEL_SOLID_CLASSES[
                                                                label.color
                                                                ],
                                                            )}
                                                        />
                                                        <span
                                                            className={cn(
                                                                'flex-1 truncate transition-all duration-150',
                                                                isSelected &&
                                                                'font-medium',
                                                            )}
                                                        >
                                                            {label.name}
                                                        </span>
                                                    </CommandItem>
                                                );
                                            })}
                                        </ScrollArea>
                                    </CommandGroup>
                                )}
                                {onCreateLabel && (
                                    <>
                                        <CommandSeparator />
                                        <CommandGroup>
                                            <CommandItem
                                                onSelect={() => {
                                                    setOpen(false);
                                                    onCreateLabel();
                                                }}
                                                className="flex items-center gap-2"
                                            >
                                                <Plus className="size-4" />
                                                <span>Create new label</span>
                                            </CommandItem>
                                        </CommandGroup>
                                    </>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            )}
        </div>
    );
}
