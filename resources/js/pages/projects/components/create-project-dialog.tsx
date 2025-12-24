import InputError from '@/components/input-error';
import { ProBadge, UpgradePromptDialog } from '@/components/plan';
import { softToastSuccess } from '@/components/shadcn-studio/soft-sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePlanFeatures } from '@/hooks/use-plan-limits';
import { cn } from '@/lib/utils';
import { getAvailableColors, isPresetColor, PRESET_COLORS } from '@/pages/projects/lib/constants';
import { getAvailableIcons, PROJECT_ICONS } from '@/pages/projects/lib/project-icons';
import { store } from '@/routes/projects';
import { Form } from '@inertiajs/react';
import { Check, Lock, Palette, Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface CreateProjectDialogProps {
    trigger?: ReactNode;
}

export function CreateProjectDialog({ trigger }: CreateProjectDialogProps) {
    const [open, setOpen] = useState(false);
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);
    const [selectedIcon, setSelectedIcon] = useState(PROJECT_ICONS[0].name);

    const { canCreateProject, maxProjects, hasFullPalette } =
        usePlanFeatures();

    // Get available colors and icons based on plan
    const availableColors = getAvailableColors(hasFullPalette);
    const availableIcons = getAvailableIcons(hasFullPalette);

    const resetForm = () => {
        setSelectedColor(PRESET_COLORS[0].value);
        setSelectedIcon(PROJECT_ICONS[0].name);
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            resetForm();
        }
    };

    const handleTriggerClick = () => {
        if (canCreateProject) {
            setOpen(true);
        } else {
            setUpgradeOpen(true);
        }
    };

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span onClick={handleTriggerClick}>
                        {trigger ?? (
                            <Button>
                                <Plus className="size-4" />
                                New Project
                            </Button>
                        )}
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    {canCreateProject
                        ? 'Create New Project'
                        : `Project limit reached (${maxProjects})`}
                </TooltipContent>
            </Tooltip>

            <UpgradePromptDialog
                open={upgradeOpen}
                onOpenChange={setUpgradeOpen}
                title="Project Limit Reached"
                description={`You've reached your limit of ${maxProjects} projects. Upgrade to Pro for unlimited projects.`}
                feature="Unlimited Projects"
            />

            <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <Form
                    {...store.form()}
                    className="space-y-6"
                    onSuccess={() => {
                        setOpen(false);
                        resetForm();
                        softToastSuccess('Project created successfully');
                    }}
                >
                    {({ processing, errors }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Create New Project</DialogTitle>
                                <DialogDescription>
                                    Create a new project to organize your tasks
                                    with Kanban boards.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Project Name */}
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Project Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="My Awesome Project"
                                        autoFocus
                                        autoComplete="off"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                {/* Project Description */}
                                <div className="grid gap-2">
                                    <Label htmlFor="description">
                                        Description{' '}
                                        <span className="font-normal text-muted-foreground">
                                            (optional)
                                        </span>
                                    </Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        placeholder="Describe what this project is about..."
                                        rows={3}
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                {/* Color Picker */}
                                <div className="grid gap-2">
                                    <div className="flex items-center gap-2">
                                        <Label>Color</Label>
                                        {!hasFullPalette && (
                                            <ProBadge size="sm" />
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {availableColors.map((color) => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedColor(
                                                        color.value,
                                                    )
                                                }
                                                className={cn(
                                                    'flex size-8 items-center justify-center rounded-full transition-all hover:scale-110',
                                                    selectedColor.toLowerCase() ===
                                                        color.value.toLowerCase() &&
                                                        'ring-2 ring-offset-2 ring-offset-background',
                                                )}
                                                style={
                                                    {
                                                        backgroundColor:
                                                            color.value,
                                                        '--tw-ring-color':
                                                            color.value,
                                                    } as React.CSSProperties
                                                }
                                                title={color.name}
                                            >
                                                {selectedColor.toLowerCase() ===
                                                    color.value.toLowerCase() && (
                                                    <Check className="size-4 text-white" />
                                                )}
                                            </button>
                                        ))}
                                        {/* Show locked Pro colors for Free users */}
                                        {!hasFullPalette && PRESET_COLORS.filter((c) => c.isPro).slice(0, 3).map((color) => (
                                            <Tooltip key={color.value}>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className="relative flex size-8 cursor-not-allowed items-center justify-center rounded-full opacity-50"
                                                        style={{ backgroundColor: color.value }}
                                                    >
                                                        <Lock className="size-3 text-white" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{color.name} - Upgrade to Pro</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        ))}
                                        {/* Custom color picker - Pro only */}
                                        {hasFullPalette ? (
                                            <div className="relative">
                                                <input
                                                    type="color"
                                                    value={selectedColor}
                                                    onChange={(e) =>
                                                        setSelectedColor(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="absolute inset-0 size-8 cursor-pointer opacity-0"
                                                    title="Pick custom color"
                                                />
                                                <div
                                                    className={cn(
                                                        'flex size-8 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/50 transition-all hover:scale-110 hover:border-foreground',
                                                        !isPresetColor(
                                                            selectedColor,
                                                        ) &&
                                                            'ring-2 ring-offset-2 ring-offset-background',
                                                    )}
                                                    style={
                                                        {
                                                            backgroundColor:
                                                                !isPresetColor(
                                                                    selectedColor,
                                                                )
                                                                    ? selectedColor
                                                                    : 'transparent',
                                                            '--tw-ring-color':
                                                                selectedColor,
                                                        } as React.CSSProperties
                                                    }
                                                >
                                                    {isPresetColor(
                                                        selectedColor,
                                                    ) ? (
                                                        <Palette className="size-4 text-muted-foreground" />
                                                    ) : (
                                                        <Check className="size-4 text-white" />
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex size-8 cursor-not-allowed items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 opacity-50">
                                                        <Palette className="size-4 text-muted-foreground" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Custom colors - Upgrade to Pro</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                    <input
                                        type="hidden"
                                        name="color"
                                        value={selectedColor}
                                    />
                                    <InputError message={errors.color} />
                                </div>

                                {/* Icon Picker */}
                                <div className="grid gap-2">
                                    <div className="flex items-center gap-2">
                                        <Label>Icon</Label>
                                        {!hasFullPalette && (
                                            <ProBadge size="sm" />
                                        )}
                                    </div>
                                    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-10">
                                        {availableIcons.map((icon) => {
                                            const IconComponent = icon.icon;
                                            const isSelected =
                                                selectedIcon === icon.name;
                                            return (
                                                <button
                                                    key={icon.name}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedIcon(
                                                            icon.name,
                                                        )
                                                    }
                                                    className={cn(
                                                        'group relative flex size-8 items-center justify-center rounded-lg transition-all duration-200',
                                                        isSelected
                                                            ? 'bg-primary text-primary-foreground shadow-md'
                                                            : 'hover:bg-muted hover:shadow-sm',
                                                    )}
                                                    title={icon.label}
                                                >
                                                    <IconComponent
                                                        className={cn(
                                                            'size-4 transition-transform duration-200',
                                                            !isSelected &&
                                                                'group-hover:scale-110',
                                                        )}
                                                    />
                                                    {isSelected && (
                                                        <div className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-primary-foreground shadow-sm">
                                                            <Check className="size-2 text-primary" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                        {/* Show locked Pro icons for Free users */}
                                        {!hasFullPalette && PROJECT_ICONS.filter((i) => i.isPro).slice(0, 4).map((icon) => {
                                            const IconComponent = icon.icon;
                                            return (
                                                <Tooltip key={icon.name}>
                                                    <TooltipTrigger asChild>
                                                        <div className="relative flex size-8 cursor-not-allowed items-center justify-center rounded-lg opacity-40">
                                                            <IconComponent className="size-4" />
                                                            <div className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-muted shadow-sm">
                                                                <Lock className="size-2" />
                                                            </div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{icon.label} - Upgrade to Pro</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            );
                                        })}
                                    </div>
                                    <input
                                        type="hidden"
                                        name="icon"
                                        value={selectedIcon}
                                    />
                                </div>
                            </div>

                            <DialogFooter className="gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Creating...'
                                        : 'Create Project'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
        </>
    );
}
