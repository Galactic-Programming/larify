import {
    destroy,
    store,
    update,
} from '@/actions/App/Http/Controllers/Projects/LabelController';
import InputError from '@/components/input-error';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { router } from '@inertiajs/react';
import { Check, Lock, Palette, Pencil, Plus, Tag, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import {
    FREE_LABEL_COLORS,
    LABEL_COLORS,
    type Label as LabelType,
    type LabelColorName,
    type Permissions,
    type Project,
    PRO_LABEL_COLORS,
} from '../../lib/types';

// Helper to check if a color is a preset color name
const ALL_PRESET_COLORS = [...FREE_LABEL_COLORS, ...PRO_LABEL_COLORS];
const isPresetColor = (color: string): color is LabelColorName =>
    ALL_PRESET_COLORS.includes(color as LabelColorName);
import { LABEL_BG_CLASSES, LABEL_SOLID_CLASSES } from './label-badge';

interface LabelManagerSheetProps {
    project: Project;
    permissions: Permissions;
    trigger?: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function LabelManagerSheet({
    project,
    permissions,
    trigger,
    open: controlledOpen,
    onOpenChange,
}: LabelManagerSheetProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [editingLabel, setEditingLabel] = useState<LabelType | null>(null);
    const [labelToDelete, setLabelToDelete] = useState<LabelType | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [color, setColor] = useState<string>('blue');
    const [customColor, setCustomColor] = useState('#3b82f6'); // Default blue hex
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isProcessing, setIsProcessing] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;

    const projectLabels = project.labels ?? [];
    const canCreateMore = permissions.canCreateLabel;
    const hasExtendedColors = permissions.hasExtendedColors;

    const availableColors = hasExtendedColors
        ? [...FREE_LABEL_COLORS, ...PRO_LABEL_COLORS]
        : FREE_LABEL_COLORS;

    const handleOpenChange = (isOpen: boolean) => {
        if (isControlled) {
            onOpenChange?.(isOpen);
        } else {
            setInternalOpen(isOpen);
        }

        // Reset state when closing
        if (!isOpen) {
            resetForm();
        }
    };

    const resetForm = () => {
        setName('');
        setColor('blue');
        setCustomColor('#3b82f6');
        setErrors({});
        setEditingLabel(null);
    };

    const handleCreate = () => {
        if (!name.trim()) return;

        setIsProcessing(true);
        setErrors({});

        router.post(
            store(project).url,
            { name: name.trim(), color },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    resetForm();
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                },
                onFinish: () => setIsProcessing(false),
            },
        );
    };

    const handleUpdate = () => {
        if (!editingLabel || !name.trim()) return;

        setIsProcessing(true);
        setErrors({});

        router.patch(
            update({ project, label: editingLabel }).url,
            { name: name.trim(), color },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    resetForm();
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                },
                onFinish: () => setIsProcessing(false),
            },
        );
    };

    const handleDelete = (label: LabelType) => {
        setLabelToDelete(label);
    };

    const confirmDelete = () => {
        if (!labelToDelete) return;

        router.delete(destroy({ project, label: labelToDelete }).url, {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => setLabelToDelete(null),
        });
    };

    const startEditing = (label: LabelType) => {
        setEditingLabel(label);
        setName(label.name);
        // Check if the label has a custom color (hex) or preset
        if (isPresetColor(label.color)) {
            setColor(label.color);
            setCustomColor(LABEL_COLORS[label.color]);
        } else {
            // Custom hex color
            setColor(label.color);
            setCustomColor(label.color);
        }
        setErrors({});
    };

    const handleSubmit = () => {
        if (editingLabel) {
            handleUpdate();
        } else {
            handleCreate();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && name.trim()) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
            <SheetContent className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
                <SheetHeader className="border-b px-4 py-4 sm:px-6">
                    <SheetTitle className="flex items-center gap-2">
                        <Tag className="size-5" />
                        Manage Labels
                    </SheetTitle>
                    <SheetDescription>
                        Create and manage labels for this project.
                        {permissions.maxLabels !== null && (
                            <span className="mt-1 block">
                                {projectLabels.length} / {permissions.maxLabels}{' '}
                                labels used
                            </span>
                        )}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Create/Edit Form - Always visible at top */}
                    {(canCreateMore || editingLabel) && (
                        <div className="border-b bg-muted/30 px-4 py-4 sm:px-6">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                        {editingLabel
                                            ? 'Edit Label'
                                            : 'Create New Label'}
                                    </span>
                                    {editingLabel && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-6"
                                            onClick={resetForm}
                                        >
                                            <X className="size-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="label-name">Name</Label>
                                    <Input
                                        id="label-name"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        onKeyDown={handleKeyDown}
                                        placeholder="Enter label name..."
                                        maxLength={30}
                                        autoComplete="off"
                                    />
                                    {errors.name && (
                                        <InputError message={errors.name} />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Color</Label>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {availableColors.map((c) => (
                                            <motion.button
                                                key={c}
                                                type="button"
                                                onClick={() => setColor(c)}
                                                className={cn(
                                                    'size-6 rounded-full',
                                                    LABEL_SOLID_CLASSES[c],
                                                    color === c
                                                        ? 'ring-2 ring-primary ring-offset-2'
                                                        : '',
                                                )}
                                                whileHover={{ scale: 1.15 }}
                                                whileTap={{ scale: 0.95 }}
                                                animate={{
                                                    scale: color === c ? [1, 1.1, 1] : 1,
                                                }}
                                                transition={{
                                                    duration: 0.2,
                                                    ease: 'easeOut',
                                                }}
                                                title={c}
                                            />
                                        ))}
                                        {/* Custom color picker - Pro only */}
                                        {hasExtendedColors ? (
                                            <motion.div
                                                className="relative"
                                                whileHover={{ scale: 1.15 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                <input
                                                    type="color"
                                                    value={customColor}
                                                    onChange={(e) => {
                                                        setCustomColor(e.target.value);
                                                        setColor(e.target.value);
                                                    }}
                                                    className="absolute inset-0 size-6 cursor-pointer opacity-0"
                                                    title="Pick custom color"
                                                />
                                                <div
                                                    className={cn(
                                                        'flex size-6 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/50 transition-colors hover:border-foreground',
                                                        !isPresetColor(color) &&
                                                        'ring-2 ring-primary ring-offset-2',
                                                    )}
                                                    style={{
                                                        backgroundColor: !isPresetColor(color)
                                                            ? color
                                                            : 'transparent',
                                                    }}
                                                >
                                                    {isPresetColor(color) ? (
                                                        <Palette className="size-3 text-muted-foreground" />
                                                    ) : (
                                                        <Check className="size-3 text-white" />
                                                    )}
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex size-6 cursor-not-allowed items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 opacity-50">
                                                        <Palette className="size-3 text-muted-foreground" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Custom colors - Upgrade to Pro</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                    {!hasExtendedColors && (
                                        <p className="text-xs text-muted-foreground">
                                            Upgrade to Pro for more colors
                                        </p>
                                    )}
                                    {errors.color && (
                                        <InputError message={errors.color} />
                                    )}
                                </div>

                                {/* Preview and Submit */}
                                <div className="flex items-center justify-between gap-3 pt-1">
                                    <div className="flex items-center gap-2">
                                        <AnimatePresence mode="wait">
                                            {name && (
                                                <motion.div
                                                    className="flex items-center gap-2"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    transition={{ duration: 0.15 }}
                                                >
                                                    <span className="text-sm text-muted-foreground">
                                                        Preview:
                                                    </span>
                                                    <Badge
                                                        className={cn(
                                                            'border',
                                                            isPresetColor(color)
                                                                ? LABEL_BG_CLASSES[color]
                                                                : 'text-white border-transparent',
                                                        )}
                                                        style={
                                                            !isPresetColor(color)
                                                                ? {
                                                                    backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`,
                                                                    color: color,
                                                                    borderColor: `color-mix(in srgb, ${color} 30%, transparent)`,
                                                                }
                                                                : undefined
                                                        }
                                                    >
                                                        {name}
                                                    </Badge>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {editingLabel && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={resetForm}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            onClick={handleSubmit}
                                            disabled={
                                                !name.trim() || isProcessing
                                            }
                                        >
                                            {isProcessing ? (
                                                'Saving...'
                                            ) : editingLabel ? (
                                                'Update'
                                            ) : (
                                                <>
                                                    <Plus className="mr-1 size-3" />
                                                    Create
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Labels List */}
                    <div className="flex flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6">
                        <div className="mb-3 flex items-center justify-between">
                            <Label className="text-sm font-medium">
                                Labels ({projectLabels.length})
                            </Label>
                        </div>

                        {projectLabels.length === 0 ? (
                            <motion.div
                                className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Tag className="mx-auto size-10 text-muted-foreground/50" />
                                <p className="mt-3 text-sm text-muted-foreground">
                                    No labels yet
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Create your first label above to get started
                                </p>
                            </motion.div>
                        ) : (
                            <ScrollArea className="flex-1 -mx-4 px-4 sm:-mx-6 sm:px-6">
                                <div className="space-y-1">
                                    <AnimatePresence mode="popLayout">
                                        {projectLabels.map((label, index) => (
                                            <motion.div
                                                key={label.id}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                                                transition={{
                                                    duration: 0.2,
                                                    delay: index * 0.03,
                                                }}
                                                className={cn(
                                                    'group flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors',
                                                    editingLabel?.id === label.id
                                                        ? 'bg-accent'
                                                        : 'hover:bg-muted/50',
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <motion.span
                                                        className={cn(
                                                            'inline-flex size-4 rounded-full',
                                                            LABEL_SOLID_CLASSES[
                                                            label.color
                                                            ],
                                                        )}
                                                        whileHover={{ scale: 1.2 }}
                                                        transition={{ duration: 0.15 }}
                                                    />
                                                    <span className="text-sm font-medium">
                                                        {label.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7"
                                                        onClick={() =>
                                                            startEditing(label)
                                                        }
                                                    >
                                                        <Pencil className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-7 text-destructive hover:text-destructive"
                                                        onClick={() =>
                                                            handleDelete(label)
                                                        }
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </ScrollArea>
                        )}

                        {!canCreateMore && projectLabels.length > 0 && (
                            <>
                                <Separator className="my-3" />
                                <p className="text-center text-xs text-muted-foreground">
                                    Label limit reached. Upgrade to Pro for
                                    unlimited labels.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </SheetContent>

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={!!labelToDelete}
                onOpenChange={(open) => !open && setLabelToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Label</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the label{' '}
                            <span className="font-medium text-foreground">
                                "{labelToDelete?.name}"
                            </span>
                            ? This will remove it from all tasks that use it.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Sheet>
    );
}
