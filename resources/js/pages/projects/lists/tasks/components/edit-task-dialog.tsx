import InputError from '@/components/input-error';
import { softToastSuccess } from '@/components/shadcn-studio/soft-sonner';
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
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { Task, TaskPriority } from '../../lib/types';

interface Project {
    id: number;
    name: string;
    color: string;
}

interface EditTaskDialogProps {
    project: Project;
    task: Task;
    trigger?: ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; icon: typeof Minus; color: string }[] = [
    { value: 'none', label: 'None', icon: Minus, color: 'text-muted-foreground' },
    { value: 'low', label: 'Low', icon: ArrowDown, color: 'text-green-500' },
    { value: 'medium', label: 'Medium', icon: ArrowRight, color: 'text-yellow-500' },
    { value: 'high', label: 'High', icon: ArrowUp, color: 'text-orange-500' },
    { value: 'urgent', label: 'Urgent', icon: AlertTriangle, color: 'text-red-500' },
];

export function EditTaskDialog({ project, task, trigger, open: controlledOpen, onOpenChange }: EditTaskDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [priority, setPriority] = useState<TaskPriority>(task.priority);
    const [dueDate, setDueDate] = useState<Date | undefined>(task.due_date ? parseISO(task.due_date) : undefined);
    const [dueTime, setDueTime] = useState<string>(task.due_time ?? '');
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;

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

                                    {/* Due Date & Time */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>
                                                Due Date{' '}
                                                <span className="font-normal text-muted-foreground">(optional)</span>
                                            </Label>
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
                                                        onSelect={(date) => {
                                                            setDueDate(date);
                                                            setDatePickerOpen(false);
                                                        }}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <input
                                                type="hidden"
                                                name="due_date"
                                                value={dueDate ? format(dueDate, 'yyyy-MM-dd') : ''}
                                            />
                                            <InputError message={errors.due_date} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>
                                                Due Time{' '}
                                                <span className="font-normal text-muted-foreground">(optional)</span>
                                            </Label>
                                            <Input
                                                type="time"
                                                value={dueTime}
                                                onChange={(e) => setDueTime(e.target.value)}
                                                className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                            />
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
