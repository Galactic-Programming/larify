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
import { Switch } from '@/components/ui/switch';
import { update, setDoneList } from '@/actions/App/Http/Controllers/TaskLists/TaskListController';
import { Form, router } from '@inertiajs/react';
import { LayoutList } from 'lucide-react';

interface Project {
    id: number;
    name: string;
    color: string;
}

interface TaskList {
    id: number;
    name: string;
    position: number;
    is_done_list: boolean;
}

interface EditListDialogProps {
    project: Project;
    list: TaskList;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditListDialog({ project, list, open, onOpenChange }: EditListDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <Form
                    {...update.form({ project: project.id, list: list.id })}
                    className="space-y-6"
                    onSuccess={() => {
                        onOpenChange(false);
                        softToastSuccess('List updated successfully');
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
                                        <DialogTitle>Edit List</DialogTitle>
                                        <DialogDescription>
                                            Update the list name.
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
                                        defaultValue={list.name}
                                        placeholder="e.g., To Do, In Progress, Done"
                                        autoFocus
                                        autoComplete="off"
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="is_done_list" className="text-base">Done List</Label>
                                        <p className="text-muted-foreground text-sm">
                                            Completed tasks will automatically move to this list.
                                        </p>
                                    </div>
                                    <Switch
                                        id="is_done_list"
                                        checked={list.is_done_list}
                                        onCheckedChange={() => {
                                            router.patch(setDoneList.url({ project: project.id, list: list.id }));
                                        }}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={processing}
                                >
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
