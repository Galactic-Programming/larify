import { update } from '@/actions/App/Http/Controllers/Tasks/TaskController';
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
import { Textarea } from '@/components/ui/textarea';
import { Form } from '@inertiajs/react';
import { parseISO } from 'date-fns';
import { Pencil } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import type { Project, Task, TaskPriority, User } from '../../lib/types';
import {
    AssigneeSelect,
    DueDateTimePicker,
    PrioritySelect,
} from './task-form';

interface EditTaskDialogProps {
    project: Project;
    task: Task;
    trigger?: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    canAssignTask?: boolean;
    canUpdateDeadline?: boolean;
}

export function EditTaskDialog({
    project,
    task,
    trigger,
    open: controlledOpen,
    onOpenChange,
    canAssignTask = false,
    canUpdateDeadline = true,
}: EditTaskDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [priority, setPriority] = useState<TaskPriority>(task.priority);
    const [dueDate, setDueDate] = useState<Date | undefined>(
        task.due_date ? parseISO(task.due_date) : undefined,
    );
    const [dueTime, setDueTime] = useState<string>(task.due_time ?? '');
    const [assigneeId, setAssigneeId] = useState<number | null>(
        task.assigned_to,
    );

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;

    // Combine owner and members into a single list
    const allMembers = useMemo((): User[] => {
        const members: User[] = [];
        if (project.user) {
            members.push(project.user);
        }
        if (project.members) {
            project.members.forEach((member) => {
                if (member.id !== project.user_id) {
                    members.push(member);
                }
            });
        }
        return members;
    }, [project.user, project.members, project.user_id]);

    // Check if there's only one member (owner only)
    const isSoloProject = allMembers.length <= 1;

    // For editing:
    // - Solo project: keep existing assignment or use owner
    // - Editor (cannot assign): keep existing assignment (read-only)
    // - Owner (can assign): use selected assignee from dropdown
    const effectiveAssigneeId = isSoloProject
        ? (task.assigned_to ?? project.user_id)
        : !canAssignTask
          ? task.assigned_to
          : assigneeId;

    // Get current task assignee info for read-only display
    const currentAssignee =
        task.assignee ?? allMembers.find((m) => m.id === task.assigned_to);

    const handleOpenChange = (isOpen: boolean) => {
        if (isControlled) {
            onOpenChange?.(isOpen);
        } else {
            setInternalOpen(isOpen);
        }

        // Reset to task values when opening
        if (isOpen) {
            setPriority(task.priority);
            setDueDate(task.due_date ? parseISO(task.due_date) : undefined);
            setDueTime(task.due_time ?? '');
            setAssigneeId(task.assigned_to);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            {!trigger && !isControlled && (
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                        <Pencil className="size-4" />
                    </Button>
                </DialogTrigger>
            )}
            {open && (
                <DialogContent className="sm:max-w-lg">
                    <Form
                        {...update.form({ project, task })}
                        className="space-y-6"
                        onSuccess={() => {
                            handleOpenChange(false);
                            softToastSuccess('Task updated successfully');
                        }}
                    >
                        {({ processing, errors }) => (
                            <>
                                <DialogHeader>
                                    <DialogTitle>Edit Task</DialogTitle>
                                    <DialogDescription>
                                        Update the task details below.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                    {/* Task Title */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-title">
                                            Task Title
                                        </Label>
                                        <Input
                                            id="edit-title"
                                            name="title"
                                            defaultValue={task.title}
                                            placeholder="What needs to be done?"
                                            autoFocus
                                            autoComplete="off"
                                        />
                                        <InputError message={errors.title} />
                                    </div>

                                    {/* Description */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-description">
                                            Description{' '}
                                            <span className="font-normal text-muted-foreground">
                                                (optional)
                                            </span>
                                        </Label>
                                        <Textarea
                                            id="edit-description"
                                            name="description"
                                            defaultValue={
                                                task.description ?? ''
                                            }
                                            placeholder="Add more details about this task..."
                                            rows={3}
                                        />
                                        <InputError
                                            message={errors.description}
                                        />
                                    </div>

                                    {/* Priority & Assignee */}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <PrioritySelect
                                            value={priority}
                                            onChange={setPriority}
                                            error={errors.priority}
                                        />

                                        <AssigneeSelect
                                            value={assigneeId}
                                            onChange={setAssigneeId}
                                            error={errors.assigned_to}
                                            members={allMembers}
                                            projectOwnerId={project.user_id}
                                            readOnly={isSoloProject || !canAssignTask}
                                            readOnlyUser={currentAssignee}
                                            readOnlyTooltip={
                                                isSoloProject
                                                    ? 'Auto-assigned to owner'
                                                    : 'Only the project owner can change assignee'
                                            }
                                            includeHiddenInput={canAssignTask && !isSoloProject}
                                            effectiveAssigneeId={effectiveAssigneeId}
                                        />
                                    </div>

                                    {/* Due Date & Time */}
                                    <DueDateTimePicker
                                        dueDate={dueDate}
                                        dueTime={dueTime}
                                        onDateChange={setDueDate}
                                        onTimeChange={setDueTime}
                                        dateError={errors.due_date}
                                        timeError={errors.due_time}
                                        readOnly={!canUpdateDeadline}
                                    />
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleOpenChange(false)}
                                        disabled={processing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing
                                            ? 'Saving...'
                                            : 'Save Changes'}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                </DialogContent>
            )}
        </Dialog>
    );
}
