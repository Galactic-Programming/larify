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
import { store } from '@/actions/App/Http/Controllers/Tasks/TaskController';
import { Form } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    AlertTriangle,
    ArrowDown,
    ArrowRight,
    ArrowUp,
    CalendarIcon,
    ChevronDownIcon,
    ListTodo,
    Minus,
    Plus,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { TaskList, TaskPriority } from '../../lib/types';

interface Project {
    id: number;
    name: string;
    color: string;
}

interface CreateTaskDialogProps {
    project: Project;
    list: TaskList;
    trigger?: ReactNode;
}

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; icon: typeof Minus; color: string }[] = [
    { value: 'none', label: 'None', icon: Minus, color: 'text-muted-foreground' },
    { value: 'low', label: 'Low', icon: ArrowDown, color: 'text-green-500' },
    { value: 'medium', label: 'Medium', icon: ArrowRight, color: 'text-yellow-500' },
    { value: 'high', label: 'High', icon: ArrowUp, color: 'text-orange-500' },
    { value: 'urgent', label: 'Urgent', icon: AlertTriangle, color: 'text-red-500' },
];

export function CreateTaskDialog({ project, list, trigger }: CreateTaskDialogProps) {
    const [open, setOpen] = useState(false);
    const [priority, setPriority] = useState<TaskPriority>('none');
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const [dueTime, setDueTime] = useState<string>('');
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    const resetForm = () => {
        setPriority('none');
        setDueDate(undefined);
        setDueTime('');
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            resetForm();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button variant="ghost" size="sm" className="gap-1">
                        <Plus className="size-4" />
                        Add task
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <Form
                    {...store.form({ project, list })}
                    className="space-y-6"
                    onSuccess={() => {
                        setOpen(false);
                        resetForm();
                        softToastSuccess('Task created successfully');
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
                                        <ListTodo className="size-5" style={{ color: project.color }} />
                                    </div>
                                    <div>
                                        <DialogTitle>Create New Task</DialogTitle>
                                        <DialogDescription>
                                            Add a new task to <span className="font-medium">{list.name}</span>
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Task Title */}
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Task Title</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        placeholder="What needs to be done?"
                                        autoFocus
                                        autoComplete="off"
                                    />
                                    <InputError message={errors.title} />
                                </div>

                                {/* Description */}
                                <div className="grid gap-2">
                                    <Label htmlFor="description">
                                        Description{' '}
                                        <span className="font-normal text-muted-foreground">(optional)</span>
                                    </Label>
                                    <Textarea
                                        id="description"
                                        name="description"
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
                                    {processing ? 'Creating...' : 'Create Task'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
