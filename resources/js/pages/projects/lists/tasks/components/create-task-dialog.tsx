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
import type { SharedData } from '@/types';
import { store } from '@/actions/App/Http/Controllers/Tasks/TaskController';
import { Form, usePage } from '@inertiajs/react';
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
    UserCircle,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import type { Project, TaskList, TaskPriority, User } from '../../lib/types';

interface CreateTaskDialogProps {
    project: Project;
    list: TaskList;
    trigger?: ReactNode;
    canAssignTask?: boolean;
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

export function CreateTaskDialog({ project, list, trigger, canAssignTask = false }: CreateTaskDialogProps) {
    const { auth } = usePage<SharedData>().props;
    const [open, setOpen] = useState(false);
    const [priority, setPriority] = useState<TaskPriority>('none');
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const [dueTime, setDueTime] = useState<string>('');
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [assigneeId, setAssigneeId] = useState<number | null>(null);

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

    // Auto-assign logic:
    // - Solo project: assign to current user
    // - Editor (cannot assign): assign to current user (themselves)
    // - Owner (can assign): use selected assignee from dropdown
    const effectiveAssigneeId = isSoloProject || !canAssignTask ? auth.user.id : assigneeId;

    // Get the selected assignee for display
    const selectedAssignee = allMembers.find((m) => m.id === effectiveAssigneeId);

    // For editors, get their info for read-only display
    const currentUserInfo = allMembers.find((m) => m.id === auth.user.id) ?? auth.user;

    const resetForm = () => {
        setPriority('none');
        setDueDate(undefined);
        setDueTime('');
        setAssigneeId(null);
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

                                {/* Priority & Assignee */}
                                <div className="grid grid-cols-2 gap-4">
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
                                        {/* Solo project or Editor: show read-only current user */}
                                        {(isSoloProject || !canAssignTask) ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex h-9 items-center gap-2 rounded-md border bg-muted/50 px-3">
                                                        <Avatar className="size-5">
                                                            <AvatarImage src={currentUserInfo?.avatar ?? undefined} />
                                                            <AvatarFallback className="text-[10px]">
                                                                {currentUserInfo ? getInitials(currentUserInfo.name) : '?'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="truncate text-sm">
                                                            {currentUserInfo?.name ?? 'You'}
                                                        </span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {isSoloProject ? 'Auto-assigned to you' : 'Tasks you create are assigned to you'}
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
                                        <input type="hidden" name="assigned_to" value={effectiveAssigneeId ?? ''} />
                                        <InputError message={errors.assigned_to} />
                                    </div>
                                </div>

                                {/* Due Date & Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Due Date</Label>
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
                                        <Label>Due Time</Label>
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
