import { store } from '@/actions/App/Http/Controllers/TaskLists/TaskListController';
import InputError from '@/components/input-error';
import { UpgradePromptDialog } from '@/components/plan/upgrade-prompt-dialog';
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
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
    canCreateList?: boolean;
    maxLists?: number | null;
    currentLists?: number;
}

export function CreateListDialog({
    project,
    trigger,
    canCreateList = true,
    maxLists,
    currentLists,
}: CreateListDialogProps) {
    const [open, setOpen] = useState(false);
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

    const handleTriggerClick = () => {
        if (canCreateList === false) {
            setShowUpgradeDialog(true);
        } else {
            setOpen(true);
        }
    };

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <span onClick={handleTriggerClick} className="cursor-pointer">
                        {trigger ?? (
                            <Button>
                                <Plus className="size-4" />
                                New List
                            </Button>
                        )}
                    </span>
                </TooltipTrigger>
                <TooltipContent>
                    {canCreateList
                        ? 'Create New List'
                        : `List limit reached (${currentLists}/${maxLists})`}
                </TooltipContent>
            </Tooltip>

            {/* Upgrade Dialog for Free users at limit */}
            <UpgradePromptDialog
                open={showUpgradeDialog}
                onOpenChange={setShowUpgradeDialog}
                title="List Limit Reached"
                description={`You've reached your limit of ${maxLists} lists per project. Upgrade to Pro for unlimited lists.`}
                feature="Unlimited Lists"
            />

            {/* Create List Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
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
                                            style={{
                                                backgroundColor: `${project.color}20`,
                                            }}
                                        >
                                            <LayoutList
                                                className="size-5"
                                                style={{ color: project.color }}
                                            />
                                        </div>
                                        <div>
                                            <DialogTitle>
                                                Create New List
                                            </DialogTitle>
                                            <DialogDescription>
                                                Add a new list to organize tasks
                                                in {project.name}.
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
                                        {processing
                                            ? 'Creating...'
                                            : 'Create List'}
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
