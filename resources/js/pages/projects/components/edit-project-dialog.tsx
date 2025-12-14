import ProjectController from '@/actions/App/Http/Controllers/Projects/ProjectController';
import InputError from '@/components/input-error';
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
import { cn } from '@/lib/utils';
import { isPresetColor, PRESET_COLORS } from '@/pages/projects/lib/constants';
import { PROJECT_ICONS } from '@/pages/projects/lib/project-icons';
import type { Project } from '@/pages/projects/lib/types';
import { Form } from '@inertiajs/react';
import { Check, Palette } from 'lucide-react';
import { useState } from 'react';

interface EditProjectDialogProps {
    project: Project;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
    const [selectedColor, setSelectedColor] = useState(project.color);
    const [selectedIcon, setSelectedIcon] = useState(project.icon ?? PROJECT_ICONS[0].name);

    const handleOpenChange = (isOpen: boolean) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            // Reset to project's original values when closing without save
            setSelectedColor(project.color);
            setSelectedIcon(project.icon ?? PROJECT_ICONS[0].name);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <Form
                    {...ProjectController.update.form(project)}
                    className="space-y-6"
                    onSuccess={() => {
                        onOpenChange(false);
                        softToastSuccess('Project updated successfully');
                    }}
                >
                    {({ processing, errors }) => (
                        <>
                            <DialogHeader>
                                <DialogTitle>Edit Project</DialogTitle>
                                <DialogDescription>Update project details and settings.</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Project Name */}
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-name">Project Name</Label>
                                    <Input
                                        id="edit-name"
                                        name="name"
                                        defaultValue={project.name}
                                        placeholder="My Awesome Project"
                                        autoFocus
                                        autoComplete="off"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                {/* Project Description */}
                                <div className="grid gap-2">
                                    <Label htmlFor="edit-description">
                                        Description{' '}
                                        <span className="font-normal text-muted-foreground">(optional)</span>
                                    </Label>
                                    <Textarea
                                        id="edit-description"
                                        name="description"
                                        defaultValue={project.description ?? ''}
                                        placeholder="Describe what this project is about..."
                                        rows={3}
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                {/* Color Picker */}
                                <div className="grid gap-2">
                                    <Label>Color</Label>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {PRESET_COLORS.map((color) => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => setSelectedColor(color.value)}
                                                className={cn(
                                                    'flex size-8 items-center justify-center rounded-full transition-all hover:scale-110',
                                                    selectedColor.toLowerCase() === color.value.toLowerCase() &&
                                                    'ring-2 ring-offset-2 ring-offset-background',
                                                )}
                                                style={
                                                    {
                                                        backgroundColor: color.value,
                                                        '--tw-ring-color': color.value,
                                                    } as React.CSSProperties
                                                }
                                                title={color.name}
                                            >
                                                {selectedColor.toLowerCase() === color.value.toLowerCase() && (
                                                    <Check className="size-4 text-white" />
                                                )}
                                            </button>
                                        ))}
                                        {/* Custom color picker */}
                                        <div className="relative">
                                            <input
                                                type="color"
                                                value={selectedColor}
                                                onChange={(e) => setSelectedColor(e.target.value)}
                                                className="absolute inset-0 size-8 cursor-pointer opacity-0"
                                                title="Pick custom color"
                                            />
                                            <div
                                                className={cn(
                                                    'flex size-8 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/50 transition-all hover:scale-110 hover:border-foreground',
                                                    !isPresetColor(selectedColor) &&
                                                    'ring-2 ring-offset-2 ring-offset-background',
                                                )}
                                                style={
                                                    {
                                                        backgroundColor: !isPresetColor(selectedColor)
                                                            ? selectedColor
                                                            : 'transparent',
                                                        '--tw-ring-color': selectedColor,
                                                    } as React.CSSProperties
                                                }
                                            >
                                                {isPresetColor(selectedColor) ? (
                                                    <Palette className="size-4 text-muted-foreground" />
                                                ) : (
                                                    <Check className="size-4 text-white" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <input type="hidden" name="color" value={selectedColor} />
                                    <InputError message={errors.color} />
                                </div>

                                {/* Icon Picker */}
                                <div className="grid gap-2">
                                    <Label>Icon</Label>
                                    <div className="grid grid-cols-10 gap-1.5">
                                        {PROJECT_ICONS.map((icon) => {
                                            const IconComponent = icon.icon;
                                            const isSelected = selectedIcon === icon.name;
                                            return (
                                                <button
                                                    key={icon.name}
                                                    type="button"
                                                    onClick={() => setSelectedIcon(icon.name)}
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
                                                            !isSelected && 'group-hover:scale-110',
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
                                    </div>
                                    <input type="hidden" name="icon" value={selectedIcon} />
                                </div>
                            </div>

                            <DialogFooter className="gap-3">
                                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
