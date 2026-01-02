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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Pencil, Plus, Tag, Trash2, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
    FREE_LABEL_COLORS,
    type Label as LabelType,
    type LabelColorName,
    type Permissions,
    type Project,
    PRO_LABEL_COLORS,
} from '../../lib/types';
import { LABEL_BG_CLASSES, LABEL_SOLID_CLASSES } from './label-badge';

interface LabelManagerDialogProps {
    project: Project;
    permissions: Permissions;
    trigger?: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function LabelManagerDialog({
    project,
    permissions,
    trigger,
    open: controlledOpen,
    onOpenChange,
}: LabelManagerDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [editingLabel, setEditingLabel] = useState<LabelType | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [labelToDelete, setLabelToDelete] = useState<LabelType | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [color, setColor] = useState<LabelColorName>('blue');
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
        setErrors({});
        setEditingLabel(null);
        setIsCreating(false);
    };

    const handleCreate = () => {
        setIsProcessing(true);
        setErrors({});

        router.post(
            store(project).url,
            { name, color },
            {
                preserveScroll: true,
                preserveState: false,
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
        if (!editingLabel) return;

        setIsProcessing(true);
        setErrors({});

        router.patch(
            update({ project, label: editingLabel }).url,
            { name, color },
            {
                preserveScroll: true,
                preserveState: false,
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
            preserveState: false,
            onFinish: () => setLabelToDelete(null),
        });
    };

    const startEditing = (label: LabelType) => {
        setEditingLabel(label);
        setName(label.name);
        setColor(label.color);
        setIsCreating(false);
    };

    const startCreating = () => {
        setEditingLabel(null);
        setName('');
        setColor('blue');
        setIsCreating(true);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Tag className="size-5" />
                        Manage Labels
                    </DialogTitle>
                    <DialogDescription>
                        Create and manage labels for this project.
                        {permissions.maxLabels !== null && (
                            <span className="block mt-1">
                                {projectLabels.length} / {permissions.maxLabels}{' '}
                                labels used
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Create/Edit Form */}
                    {(isCreating || editingLabel) && (
                        <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                    {editingLabel
                                        ? 'Edit Label'
                                        : 'Create Label'}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6"
                                    onClick={resetForm}
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="label-name">Name</Label>
                                <Input
                                    id="label-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Label name..."
                                    maxLength={30}
                                />
                                {errors.name && (
                                    <InputError message={errors.name} />
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Color</Label>
                                <div className="flex flex-wrap gap-1.5">
                                    {availableColors.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            className={cn(
                                                'size-6 rounded-full transition-all',
                                                LABEL_SOLID_CLASSES[c],
                                                color === c
                                                    ? 'ring-2 ring-offset-2 ring-primary'
                                                    : 'hover:scale-110',
                                            )}
                                            title={c}
                                        />
                                    ))}
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

                            {/* Preview */}
                            {name && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        Preview:
                                    </span>
                                    <Badge
                                        className={cn(
                                            'border',
                                            LABEL_BG_CLASSES[color],
                                        )}
                                    >
                                        {name}
                                    </Badge>
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={resetForm}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={
                                        editingLabel
                                            ? handleUpdate
                                            : handleCreate
                                    }
                                    disabled={!name.trim() || isProcessing}
                                >
                                    {isProcessing
                                        ? 'Saving...'
                                        : editingLabel
                                            ? 'Update'
                                            : 'Create'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Labels List */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Labels ({projectLabels.length})</Label>
                            {!isCreating && !editingLabel && canCreateMore && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={startCreating}
                                    className="h-7 gap-1"
                                >
                                    <Plus className="size-3" />
                                    Add
                                </Button>
                            )}
                        </div>

                        {projectLabels.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-4 text-center">
                                <Tag className="mx-auto size-8 text-muted-foreground/50" />
                                <p className="mt-2 text-sm text-muted-foreground">
                                    No labels yet
                                </p>
                                {canCreateMore && !isCreating && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                        onClick={startCreating}
                                    >
                                        <Plus className="mr-1 size-3" />
                                        Create first label
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <ScrollArea className="max-h-48">
                                <div className="space-y-1">
                                    {projectLabels.map((label) => (
                                        <div
                                            key={label.id}
                                            className={cn(
                                                'flex items-center justify-between rounded-md px-2 py-1.5 transition-colors',
                                                editingLabel?.id === label.id
                                                    ? 'bg-accent'
                                                    : 'hover:bg-muted/50',
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'inline-flex h-3 w-3 rounded-full',
                                                        LABEL_SOLID_CLASSES[
                                                        label.color
                                                        ],
                                                    )}
                                                />
                                                <span className="text-sm">
                                                    {label.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-6"
                                                    onClick={() =>
                                                        startEditing(label)
                                                    }
                                                >
                                                    <Pencil className="size-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-6 text-destructive hover:text-destructive"
                                                    onClick={() =>
                                                        handleDelete(label)
                                                    }
                                                >
                                                    <Trash2 className="size-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}

                        {!canCreateMore && projectLabels.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                Label limit reached. Upgrade to Pro for unlimited
                                labels.
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                    >
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>

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
        </Dialog>
    );
}
