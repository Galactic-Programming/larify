import {
    attach,
    detach,
} from '@/actions/App/Http/Controllers/Tasks/TaskLabelController';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, Tag } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import type { Label, Project, Task } from '../../lib/types';
import { LabelList, LABEL_BG_CLASSES } from './label-badge';

interface LabelSelectorProps {
    project: Project;
    task: Task;
    selectedLabels: Label[];
    disabled?: boolean;
    onCreateLabel?: () => void;
    className?: string;
}

export function LabelSelector({
    project,
    task,
    selectedLabels,
    disabled = false,
    onCreateLabel,
    className,
}: LabelSelectorProps) {
    const [open, setOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const projectLabels = project.labels ?? [];
    const selectedIds = useMemo(
        () => new Set(selectedLabels.map((l) => l.id)),
        [selectedLabels],
    );

    const handleToggleLabel = useCallback(
        (label: Label) => {
            if (isUpdating) return;

            setIsUpdating(true);
            const isSelected = selectedIds.has(label.id);

            // Use attach/detach for single label toggle (more efficient)
            const action = isSelected ? detach : attach;

            router.post(
                action({ project, task }).url,
                { label_id: label.id },
                {
                    preserveScroll: true,
                    onFinish: () => setIsUpdating(false),
                },
            );
        },
        [project, task, selectedIds, isUpdating],
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        'h-8 justify-start gap-2',
                        selectedLabels.length === 0 && 'text-muted-foreground',
                        className,
                    )}
                    disabled={disabled}
                >
                    <Tag className="size-4" />
                    {selectedLabels.length === 0 ? (
                        <span>Add labels</span>
                    ) : (
                        <LabelList
                            labels={selectedLabels}
                            size="sm"
                            maxVisible={2}
                        />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search labels..." />
                    <CommandList>
                        <CommandEmpty>No labels found.</CommandEmpty>
                        {projectLabels.length > 0 && (
                            <CommandGroup>
                                <ScrollArea className="max-h-48">
                                    {projectLabels.map((label) => {
                                        const isSelected = selectedIds.has(
                                            label.id,
                                        );
                                        return (
                                            <CommandItem
                                                key={label.id}
                                                value={label.name}
                                                onSelect={() =>
                                                    handleToggleLabel(label)
                                                }
                                                className="flex items-center gap-2"
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    className="pointer-events-none"
                                                />
                                                <span
                                                    className={cn(
                                                        'inline-flex h-3 w-3 rounded-full',
                                                        LABEL_BG_CLASSES[
                                                            label.color
                                                        ],
                                                    )}
                                                />
                                                <span className="truncate flex-1">
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
    );
}

// Compact version for task cards (just an icon with popover)
interface LabelSelectorCompactProps {
    project: Project;
    task: Task;
    selectedLabels: Label[];
    disabled?: boolean;
    onCreateLabel?: () => void;
}

export function LabelSelectorCompact({
    project,
    task,
    selectedLabels,
    disabled = false,
    onCreateLabel,
}: LabelSelectorCompactProps) {
    const [open, setOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const projectLabels = project.labels ?? [];
    const selectedIds = useMemo(
        () => new Set(selectedLabels.map((l) => l.id)),
        [selectedLabels],
    );

    const handleToggleLabel = useCallback(
        (label: Label) => {
            if (isUpdating) return;

            setIsUpdating(true);
            const isSelected = selectedIds.has(label.id);

            const action = isSelected ? detach : attach;

            router.post(
                action({ project, task }).url,
                { label_id: label.id },
                {
                    preserveScroll: true,
                    onFinish: () => setIsUpdating(false),
                },
            );
        },
        [project, task, selectedIds, isUpdating],
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={disabled}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Tag className="size-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-56 p-0"
                align="start"
                onClick={(e) => e.stopPropagation()}
            >
                <Command>
                    <CommandInput placeholder="Search labels..." />
                    <CommandList>
                        <CommandEmpty>No labels found.</CommandEmpty>
                        {projectLabels.length > 0 && (
                            <CommandGroup>
                                <ScrollArea className="max-h-48">
                                    {projectLabels.map((label) => {
                                        const isSelected = selectedIds.has(
                                            label.id,
                                        );
                                        return (
                                            <CommandItem
                                                key={label.id}
                                                value={label.name}
                                                onSelect={() =>
                                                    handleToggleLabel(label)
                                                }
                                                className="flex items-center gap-2"
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    className="pointer-events-none"
                                                />
                                                <span
                                                    className={cn(
                                                        'inline-flex h-3 w-3 rounded-full',
                                                        LABEL_BG_CLASSES[
                                                            label.color
                                                        ],
                                                    )}
                                                />
                                                <span className="truncate flex-1">
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
    );
}
