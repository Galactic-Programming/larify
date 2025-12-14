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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store } from '@/actions/App/Http/Controllers/TaskLists/TaskListController';
import { Form } from '@inertiajs/react';
import { LayoutList, Plus } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface Project {
    id: number;
    name: string;
    color: string;
}

interface CreateListDialogProps {
    project: Project;
    trigger?: ReactNode;
}

export function CreateListDialog({ project, trigger }: CreateListDialogProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button>
                        <Plus className="size-4" />
                        New List
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <Form
                    {...store.form(project)}
                    className="space-y-6"
                    onSuccess={() => {
                        setOpen(false);
                        softToastSuccess('List created successfully');
                    }}
                >
                    {({ processing, errors }) => (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex size-10 items-center justify-center rounded-lg"
                                        style={{ backgroundColor: `${project.color}20` }}
                                    >
                                        <LayoutList className="size-5" style={{ color: project.color }} />
                                    </div>
                                    <div>
                                        <DialogTitle>Create New List</DialogTitle>
                                        <DialogDescription>
                                            Add a new list to organize tasks in {project.name}.
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">List Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="e.g., To Do, In Progress, Done"
                                        autoFocus
                                        autoComplete="off"
                                    />
                                    <InputError message={errors.name} />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Creating...' : 'Create List'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
