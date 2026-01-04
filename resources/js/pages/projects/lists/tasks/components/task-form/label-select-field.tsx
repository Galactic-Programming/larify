import { store } from '@/actions/App/Http/Controllers/Projects/LabelController';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAISuggestLabels } from '@/hooks/use-ai';
import { cn } from '@/lib/utils';
import type { AIGeneratedLabelSuggestion } from '@/types/ai';
import { router } from '@inertiajs/react';
import { Check, Plus, Sparkles, Tag, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import {
    LABEL_BG_CLASSES,
    LABEL_SOLID_CLASSES,
} from '../../../components/labels/label-badge';
import type {
    Label as LabelType,
    LabelColorName,
    Project,
} from '../../../lib/types';

interface LabelSelectFieldProps {
    project: Project;
    selectedLabelIds: number[];
    onChange: (labelIds: number[]) => void;
    showAIButton?: boolean;
    canSuggest?: boolean;
    /** Whether user can create new labels (only Owner can create labels) */
    canCreateLabel?: boolean;
    title: string;
    description: string;
    className?: string;
}

// Helper to check if a color is a preset color name
const ALL_PRESET_COLORS = Object.keys(LABEL_BG_CLASSES) as LabelColorName[];
const isPresetColor = (color: string): color is LabelColorName =>
    ALL_PRESET_COLORS.includes(color as LabelColorName);

/**
 * LabelSelectField component for task creation form
 * Supports AI suggestions for both existing labels and generating new labels
 */
export function LabelSelectField({
    project,
    selectedLabelIds,
    onChange,
    showAIButton = false,
    canSuggest = true,
    canCreateLabel = false,
    title,
    description,
    className,
}: LabelSelectFieldProps) {
    const [open, setOpen] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<{
        type: 'existing' | 'generated' | 'none';
        labels: string[] | AIGeneratedLabelSuggestion[];
        message?: string;
    } | null>(null);
    const [isCreatingLabel, setIsCreatingLabel] = useState(false);

    const {
        execute: suggestLabels,
        isLoading: isSuggestingLabels,
    } = useAISuggestLabels(project.id, {
        onError: (error) => {
            console.error('AI error:', error.message);
        },
    });

    const projectLabels = useMemo(
        () => project.labels ?? [],
        [project.labels],
    );

    const selectedLabels = useMemo(
        () => projectLabels.filter((l) => selectedLabelIds.includes(l.id)),
        [projectLabels, selectedLabelIds],
    );

    const handleToggleLabel = useCallback(
        (labelId: number) => {
            const isSelected = selectedLabelIds.includes(labelId);
            if (isSelected) {
                onChange(selectedLabelIds.filter((id) => id !== labelId));
            } else {
                onChange([...selectedLabelIds, labelId]);
            }
        },
        [selectedLabelIds, onChange],
    );

    const handleAISuggest = async () => {
        if (!title.trim()) return;

        const result = await suggestLabels(title.trim(), description.trim() || null);
        if (result) {
            // Handle 'none' type (no labels and user can't create)
            if (result.type === 'none') {
                setAiSuggestions({
                    type: 'none',
                    labels: [],
                    message: result.message,
                });
                return;
            }

            setAiSuggestions({
                type: result.type,
                labels: result.labels,
            });

            // If existing labels, auto-select them
            if (result.type === 'existing' && Array.isArray(result.labels)) {
                const suggestedLabelIds = projectLabels
                    .filter((l) => (result.labels as string[]).includes(l.name))
                    .map((l) => l.id);

                // Add to current selection (don't replace)
                const newSelection = [...new Set([...selectedLabelIds, ...suggestedLabelIds])];
                onChange(newSelection);
            }
        }
    };

    const handleCreateLabel = (labelSuggestion: AIGeneratedLabelSuggestion) => {
        setIsCreatingLabel(true);
        router.post(
            store(project).url,
            { name: labelSuggestion.name, color: labelSuggestion.color },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    // Remove from suggestions after creating
                    if (aiSuggestions?.type === 'generated') {
                        const remaining = (aiSuggestions.labels as AIGeneratedLabelSuggestion[])
                            .filter((l) => l.name !== labelSuggestion.name);
                        if (remaining.length === 0) {
                            setAiSuggestions(null);
                        } else {
                            setAiSuggestions({
                                type: 'generated',
                                labels: remaining,
                            });
                        }
                    }
                },
                onFinish: () => setIsCreatingLabel(false),
            },
        );
    };

    const clearSuggestions = () => {
        setAiSuggestions(null);
    };

    const getLabelClasses = (label: LabelType) => {
        if (isPresetColor(label.color)) {
            return LABEL_BG_CLASSES[label.color];
        }
        return 'bg-gray-500/15 text-gray-700 dark:text-gray-300';
    };

    const getSolidClasses = (color: string) => {
        if (isPresetColor(color)) {
            return LABEL_SOLID_CLASSES[color];
        }
        return 'bg-gray-500 text-white';
    };

    return (
        <div className={cn('grid gap-2', className)}>
            <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                    <Tag className="size-3.5" />
                    Labels
                </Label>
                {showAIButton && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-primary"
                                onClick={handleAISuggest}
                                disabled={isSuggestingLabels || !canSuggest}
                            >
                                {isSuggestingLabels ? (
                                    <Spinner className="size-3" />
                                ) : (
                                    <Sparkles className="size-3" />
                                )}
                                Suggest
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {!canSuggest
                                ? 'Enter a task title first'
                                : projectLabels.length === 0
                                    ? 'AI will suggest labels to create'
                                    : 'Suggest labels with AI'}
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>

            {/* AI Generated Label Suggestions (when project has no labels) */}
            <AnimatePresence>
                {aiSuggestions?.type === 'none' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5 p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-amber-700 dark:text-amber-400">
                                    {aiSuggestions.message || 'No labels available for this project.'}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0"
                                    onClick={clearSuggestions}
                                >
                                    <X className="size-3" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
                {aiSuggestions?.type === 'generated' && canCreateLabel && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="rounded-lg border border-dashed border-primary/50 bg-primary/5 p-3">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-medium text-primary">
                                    ✨ AI suggests creating these labels:
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0"
                                    onClick={clearSuggestions}
                                >
                                    <X className="size-3" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(aiSuggestions.labels as AIGeneratedLabelSuggestion[]).map(
                                    (suggestion) => (
                                        <Button
                                            key={suggestion.name}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                                'h-7 gap-1.5 text-xs',
                                                getSolidClasses(suggestion.color),
                                            )}
                                            onClick={() => handleCreateLabel(suggestion)}
                                            disabled={isCreatingLabel}
                                        >
                                            <Plus className="size-3" />
                                            {suggestion.name}
                                        </Button>
                                    ),
                                )}
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Click to create a label for this project
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Label Selector */}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="h-auto min-h-9 w-full justify-start font-normal"
                    >
                        {selectedLabels.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {selectedLabels.map((label) => (
                                    <Badge
                                        key={label.id}
                                        variant="secondary"
                                        className={cn(
                                            'text-xs',
                                            getLabelClasses(label),
                                        )}
                                    >
                                        {label.name}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <span className="text-muted-foreground">
                                {projectLabels.length === 0
                                    ? 'No labels yet - use AI to suggest'
                                    : 'Select labels...'}
                            </span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-50 p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search labels..." />
                        <CommandList>
                            {projectLabels.length === 0 ? (
                                <CommandEmpty>
                                    <div className="py-2 text-center">
                                        <Tag className="mx-auto mb-2 size-8 text-muted-foreground/50" />
                                        <p className="text-sm text-muted-foreground">
                                            No labels in this project
                                        </p>
                                        {showAIButton && (
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Use AI Suggest to create some!
                                            </p>
                                        )}
                                    </div>
                                </CommandEmpty>
                            ) : (
                                <>
                                    <CommandEmpty>No label found.</CommandEmpty>
                                    <CommandGroup>
                                        {projectLabels.map((label) => {
                                            const isSelected = selectedLabelIds.includes(label.id);
                                            return (
                                                <CommandItem
                                                    key={label.id}
                                                    value={label.name}
                                                    onSelect={() => handleToggleLabel(label.id)}
                                                >
                                                    <div
                                                        className={cn(
                                                            'mr-2 flex size-4 items-center justify-center rounded-sm border',
                                                            isSelected
                                                                ? 'border-primary bg-primary text-primary-foreground'
                                                                : 'border-muted-foreground/30',
                                                        )}
                                                    >
                                                        {isSelected && <Check className="size-3" />}
                                                    </div>
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            'text-xs',
                                                            getLabelClasses(label),
                                                        )}
                                                    >
                                                        {label.name}
                                                    </Badge>
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                        {selectedLabelIds.length > 0 && (
                            <>
                                <CommandSeparator />
                                <div className="p-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-center text-xs"
                                        onClick={() => onChange([])}
                                    >
                                        Clear selection
                                    </Button>
                                </div>
                            </>
                        )}
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Hidden inputs for form submission */}
            {selectedLabelIds.map((id) => (
                <input key={id} type="hidden" name="label_ids[]" value={id} />
            ))}
        </div>
    );
}
