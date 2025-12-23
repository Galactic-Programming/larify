import InputError from '@/components/input-error';
import { softToastSuccess } from '@/components/shadcn-studio/soft-sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { update } from '@/actions/App/Http/Controllers/Tasks/TaskController';
import { Form } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import {
    AlertTriangle,
    ArrowDown,
    ArrowRight,
    ArrowUp,
    CalendarIcon,
    ChevronDownIcon,
    Minus,
    Pencil,
    UserCircle,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import type { Project, Task, TaskPriority, User } from '../../lib/types';

interface EditTaskDialogProps {
    project: Project;
    task: Task;
    trigger?: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    canAssignTask?: boolean;
    canUpdateDeadline?: boolean;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; icon: typeof Minus; color: string }[] = [
    { value: 'none', label: 'None', icon: Minus, color: 'text-muted-foreground' },
    { value: 'low', label: 'Low', icon: ArrowDown, color: 'text-green-500' },
    { value: 'medium', label: 'Medium', icon: ArrowRight, color: 'text-yellow-500' },
    { value: 'high', label: 'High', icon: ArrowUp, color: 'text-orange-500' },
    { value: 'urgent', label: 'Urgent', icon: AlertTriangle, color: 'text-red-500' },
];

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function EditTaskDialog({ project, task, trigger, open: controlledOpen, onOpenChange, canAssignTask = false, canUpdateDeadline = true }: EditTaskDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [priority, setPriority] = useState<TaskPriority>(task.priority);
    const [dueDate, setDueDate] = useState<Date | undefined>(task.due_date ? parseISO(task.due_date) : undefined);
    const [dueTime, setDueTime] = useState<string>(task.due_time ?? '');
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [assigneeId, setAssigneeId] = useState<number | null>(task.assigned_to);

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
        : (!canAssignTask ? task.assigned_to : assigneeId);

    // Get the selected/current assignee for display
    const selectedAssignee = allMembers.find((m) => m.id === effectiveAssigneeId);

    // Get current task assignee info for read-only display
    const currentAssignee = task.assignee ?? allMembers.find((m) => m.id === task.assigned_to);

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
                                    <DialogDescription>Update the task details below.</DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                    {/* Task Title */}
                                    <div className="grid gap-2">
                                        <Label htmlFor="edit-title">Task Title</Label>
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
                                            <span className="font-normal text-muted-foreground">(optional)</span>
                                        </Label>
                                        <Textarea
                                            id="edit-description"
                                            name="description"
                                            defaultValue={task.description ?? ''}
                                            placeholder="Add more details about this task..."
                                            rows={3}
                                        />
                                        <InputError message={errors.description} />
                                    </div>

                                    {/* Priority & Assignee */}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {/* Priority */}
                                        <div className="grid gap-2">
                                            <Label>Priority</Label>
                                            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PRIORITY_OPTIONS.map((option) => {
                                                        const Icon = option.icon;
                                                        return (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                <div className="flex items-center gap-2">
                                                                    <Icon className={`size-4 ${option.color}`} />
                                                                    <span>{option.label}</span>
                                                                </div>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                            <input type="hidden" name="priority" value={priority} />
                                            <InputError message={errors.priority} />
                                        </div>

                                        {/* Assignee */}
                                        <div className="grid gap-2">
                                            <Label>Assignee</Label>
                                            {/* Solo project or Editor: show read-only current assignee */}
                                            {(isSoloProject || !canAssignTask) ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex h-9 items-center gap-2 rounded-md border bg-muted/50 px-3">
                                                            {currentAssignee ? (
                                                                <>
                                                                    <Avatar className="size-5">
                                                                        <AvatarImage src={currentAssignee.avatar ?? undefined} />
                                                                        <AvatarFallback className="text-[10px]">
                                                                            {getInitials(currentAssignee.name)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="truncate text-sm">
                                                                        {currentAssignee.name}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <UserCircle className="size-5 text-muted-foreground" />
                                                                    <span className="truncate text-sm text-muted-foreground">
                                                                        Unassigned
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {isSoloProject
                                                            ? 'Auto-assigned to owner'
                                                            : 'Only the project owner can change assignee'}
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : (
                                                /* Owner: show dropdown to select assignee */
                                                <Select
                                                    value={assigneeId?.toString() ?? 'unassigned'}
                                                    onValueChange={(v) => setAssigneeId(v === 'unassigned' ? null : parseInt(v, 10))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select assignee">
                                                            {selectedAssignee ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Avatar className="size-5">
                                                                        <AvatarImage src={selectedAssignee.avatar ?? undefined} />
                                                                        <AvatarFallback className="text-[10px]">
                                                                            {getInitials(selectedAssignee.name)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="truncate">{selectedAssignee.name}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <UserCircle className="size-5 text-muted-foreground" />
                                                                    <span>Unassigned</span>
                                                                </div>
                                                            )}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="unassigned">
                                                            <div className="flex items-center gap-2">
                                                                <UserCircle className="size-5 text-muted-foreground" />
                                                                <span>Unassigned</span>
                                                            </div>
                                                        </SelectItem>
                                                        {allMembers.map((member) => (
                                                            <SelectItem key={member.id} value={member.id.toString()}>
                                                                <div className="flex items-center gap-2">
                                                                    <Avatar className="size-5">
                                                                        <AvatarImage src={member.avatar ?? undefined} />
                                                                        <AvatarFallback className="text-[10px]">
                                                                            {getInitials(member.name)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span>{member.name}</span>
                                                                    {member.id === project.user_id && (
                                                                        <span className="text-xs text-muted-foreground">(Owner)</span>
                                                                    )}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                            {/* Only send assigned_to if owner can change it, otherwise don't include in form */}
                                            {canAssignTask && !isSoloProject && (
                                                <input type="hidden" name="assigned_to" value={effectiveAssigneeId ?? ''} />
                                            )}
                                            <InputError message={errors.assigned_to} />
                                        </div>
                                    </div>

                                    {/* Due Date & Time */}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label>Due Date</Label>
                                            {canUpdateDeadline ? (
                                                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full justify-between font-normal"
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <CalendarIcon className="size-4 text-muted-foreground" />
                                                                {dueDate ? format(dueDate, 'MMM d, yyyy') : 'Select date'}
                                                            </span>
                                                            <ChevronDownIcon className="size-4 text-muted-foreground" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={dueDate}
                                                            captionLayout="dropdown"
                                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                                            onSelect={(date) => {
                                                                setDueDate(date);
                                                                setDatePickerOpen(false);
                                                            }}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            ) : (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex h-9 items-center gap-2 rounded-md border bg-muted/50 px-3">
                                                            <CalendarIcon className="size-4 text-muted-foreground" />
                                                            <span className="text-sm">
                                                                {dueDate ? format(dueDate, 'MMM d, yyyy') : 'No date'}
                                                            </span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        You cannot change the deadline for this task
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                            <input
                                                type="hidden"
                                                name="due_date"
                                                value={dueDate ? format(dueDate, 'yyyy-MM-dd') : ''}
                                            />
                                            <InputError message={errors.due_date} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Due Time</Label>
                                            {canUpdateDeadline ? (
                                                <Input
                                                    type="time"
                                                    value={dueTime}
                                                    onChange={(e) => setDueTime(e.target.value)}
                                                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                                />
                                            ) : (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex h-9 items-center gap-2 rounded-md border bg-muted/50 px-3">
                                                            <span className="text-sm">
                                                                {dueTime ? dueTime.slice(0, 5) : 'No time'}
                                                            </span>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        You cannot change the deadline for this task
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                            <input type="hidden" name="due_time" value={dueTime} />
                                            <InputError message={errors.due_time} />
                                        </div>
                                    </div>
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
                                        {processing ? 'Saving...' : 'Save Changes'}
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
