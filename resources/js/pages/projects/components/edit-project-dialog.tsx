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
import { Form } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useState } from 'react';

// Preset colors for project
const PRESET_COLORS = [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Lime', value: '#84cc16' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Slate', value: '#64748b' },
];

interface Project {
    id: number;
    name: string;
    description: string | null;
    color: string;
}

interface EditProjectDialogProps {
    project: Project;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
    const [selectedColor, setSelectedColor] = useState(project.color);

    const handleOpenChange = (isOpen: boolean) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            // Reset to project's original color when closing without save
            setSelectedColor(project.color);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
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
                                <DialogDescription>
                                    Update project details and settings.
                                </DialogDescription>
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
                                        <span className="text-muted-foreground font-normal">(optional)</span>
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
                                    <div className="flex flex-wrap gap-2">
                                        {PRESET_COLORS.map((color) => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => setSelectedColor(color.value)}
                                                className={cn(
                                                    'flex size-8 items-center justify-center rounded-full transition-all hover:scale-110',
                                                    selectedColor === color.value &&
                                                    'ring-2 ring-offset-2 ring-offset-background'
                                                )}
                                                style={{
                                                    backgroundColor: color.value,
                                                    '--tw-ring-color': color.value,
                                                } as React.CSSProperties}
                                                title={color.name}
                                            >
                                                {selectedColor === color.value && (
                                                    <Check className="size-4 text-white" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <input type="hidden" name="color" value={selectedColor} />
                                    <InputError message={errors.color} />
                                </div>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
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
