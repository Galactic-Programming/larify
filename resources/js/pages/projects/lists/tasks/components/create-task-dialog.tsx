import { store } from '@/actions/App/Http/Controllers/Tasks/TaskController';
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
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    useAIGenerateDescription,
    useAIParseTask,
    useAIStatus,
    useAISuggestPriority,
} from '@/hooks/use-ai';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';
import { Form, usePage } from '@inertiajs/react';
import { ListTodo, Plus, Sparkles, Wand2 } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import type { Project, TaskList, TaskPriority, User } from '../../lib/types';
import {
    AssigneeSelect,
    DueDateTimePicker,
    PrioritySelect,
} from './task-form';

interface CreateTaskDialogProps {
    project: Project;
    list: TaskList;
    trigger?: ReactNode;
    canAssignTask?: boolean;
}

export function CreateTaskDialog({
    project,
    list,
    trigger,
    canAssignTask = false,
}: CreateTaskDialogProps) {
    const { auth } = usePage<SharedData>().props;
    const [open, setOpen] = useState(false);
    const [priority, setPriority] = useState<TaskPriority>('none');
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const [dueTime, setDueTime] = useState<string>('');
    const [assigneeId, setAssigneeId] = useState<number | null>(null);

    // AI-related state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [smartInput, setSmartInput] = useState('');
    const [isSmartMode, setIsSmartMode] = useState(false);

    const { status: aiStatus } = useAIStatus();
    const {
        execute: generateDescription,
        isLoading: isGeneratingDescription,
    } = useAIGenerateDescription({
        onError: (error) => {
            console.error('AI error:', error.message);
        },
    });
    const { execute: suggestPriority, isLoading: isSuggestingPriority } =
        useAISuggestPriority({
            onError: (error) => {
                console.error('AI error:', error.message);
            },
        });
    const { execute: parseTask, isLoading: isParsingTask } = useAIParseTask({
        onError: (error) => {
            console.error('AI error:', error.message);
        },
    });

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
    const effectiveAssigneeId =
        isSoloProject || !canAssignTask ? auth.user.id : assigneeId;

    // For editors, get their info for read-only display
    const currentUserInfo =
        allMembers.find((m) => m.id === auth.user.id) ?? auth.user;

    const resetForm = () => {
        setPriority('none');
        setDueDate(undefined);
        setDueTime('');
        setAssigneeId(null);
        setTitle('');
        setDescription('');
        setSmartInput('');
        setIsSmartMode(false);
    };

    const handleGenerateDescription = async () => {
        if (!title.trim()) return;

        const result = await generateDescription(title.trim());
        if (result?.description) {
            setDescription(result.description);
        }
    };

    const handleSuggestPriority = async () => {
        if (!title.trim()) return;

        const result = await suggestPriority(
            title.trim(),
            description.trim() || null,
        );
        if (result?.priority) {
            setPriority(result.priority);
        }
    };

    const handleSmartParse = async () => {
        if (!smartInput.trim()) return;

        const result = await parseTask(smartInput.trim());
        if (result) {
            setTitle(result.title);
            if (result.description) {
                setDescription(result.description);
            }
            if (result.priority) {
                setPriority(result.priority);
            }
            if (result.due_date) {
                setDueDate(new Date(result.due_date));
            }
            if (result.due_time) {
                setDueTime(result.due_time);
            }
            // Auto-match assignee hint with project members
            if (result.assignee_hint && canAssignTask) {
                const hint = result.assignee_hint.toLowerCase();
                const matchedMember = allMembers.find((member) => {
                    const name = member.name.toLowerCase();
                    const email = member.email?.toLowerCase() ?? '';
                    // Match by name contains, starts with, or email contains
                    return (
                        name.includes(hint) ||
                        hint.includes(name.split(' ')[0]) ||
                        email.includes(hint)
                    );
                });
                if (matchedMember) {
                    setAssigneeId(matchedMember.id);
                }
            }
            // Switch to manual mode to show populated fields
            setIsSmartMode(false);
            setSmartInput('');
        }
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
            <DialogContent
                className={cn(
                    'sm:max-w-lg transition-all duration-200',
                    description.length > 200 && 'sm:max-w-2xl',
                )}
            >
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
                                        style={{
                                            backgroundColor: `${project.color}20`,
                                        }}
                                    >
                                        <ListTodo
                                            className="size-5"
                                            style={{ color: project.color }}
                                        />
                                    </div>
                                    <div>
                                        <DialogTitle>
                                            Create New Task
                                        </DialogTitle>
                                        <DialogDescription>
                                            Add a new task to{' '}
                                            <span
                                                className="inline-block max-w-[16ch] truncate align-bottom font-medium"
                                                title={list.name}
                                            >
                                                {list.name}
                                            </span>
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Smart Mode Toggle */}
                                {aiStatus?.can_use && (
                                    <div className="rounded-lg border bg-muted/30 p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Wand2 className="size-4 text-primary" />
                                                <span className="text-sm font-medium">
                                                    Smart Task Creation
                                                </span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant={
                                                    isSmartMode
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() =>
                                                    setIsSmartMode(!isSmartMode)
                                                }
                                            >
                                                {isSmartMode ? 'On' : 'Off'}
                                            </Button>
                                        </div>
                                        {isSmartMode && (
                                            <div className="mt-3 space-y-2">
                                                <Textarea
                                                    value={smartInput}
                                                    onChange={(e) =>
                                                        setSmartInput(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder='Type naturally, e.g., "Review PR for authentication feature by tomorrow, high priority"'
                                                    rows={2}
                                                    className="text-sm"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    className="w-full gap-2"
                                                    onClick={handleSmartParse}
                                                    disabled={
                                                        isParsingTask ||
                                                        !smartInput.trim()
                                                    }
                                                >
                                                    {isParsingTask ? (
                                                        <Spinner className="size-4" />
                                                    ) : (
                                                        <Sparkles className="size-4" />
                                                    )}
                                                    Parse with AI
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Task Title */}
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Task Title</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={title}
                                        onChange={(e) =>
                                            setTitle(e.target.value)
                                        }
                                        placeholder="What needs to be done?"
                                        autoFocus
                                        autoComplete="off"
                                    />
                                    <InputError message={errors.title} />
                                </div>

                                {/* Description */}
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="description">
                                            Description{' '}
                                            <span className="font-normal text-muted-foreground">
                                                (optional)
                                            </span>
                                        </Label>
                                        {aiStatus?.can_use && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-primary"
                                                        onClick={
                                                            handleGenerateDescription
                                                        }
                                                        disabled={
                                                            isGeneratingDescription ||
                                                            !title.trim()
                                                        }
                                                    >
                                                        {isGeneratingDescription ? (
                                                            <Spinner className="size-3" />
                                                        ) : (
                                                            <Sparkles className="size-3" />
                                                        )}
                                                        AI Generate
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {!title.trim()
                                                        ? 'Enter a task title first'
                                                        : 'Generate description with AI'}
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(e.target.value)
                                        }
                                        placeholder="Add more details about this task..."
                                        rows={3}
                                        className="min-h-20 max-h-64 resize-none overflow-y-auto"
                                        style={{
                                            height: description.length > 100 ? 'auto' : undefined,
                                        }}
                                    />
                                    <InputError message={errors.description} />
                                </div>

                                {/* Priority & Assignee */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <PrioritySelect
                                        value={priority}
                                        onChange={setPriority}
                                        error={errors.priority}
                                        showAIButton={aiStatus?.can_use}
                                        onAISuggest={handleSuggestPriority}
                                        isAISuggesting={isSuggestingPriority}
                                        canSuggest={!!title.trim()}
                                    />

                                    <AssigneeSelect
                                        value={assigneeId}
                                        onChange={setAssigneeId}
                                        error={errors.assigned_to}
                                        members={allMembers}
                                        projectOwnerId={project.user_id}
                                        readOnly={isSoloProject || !canAssignTask}
                                        readOnlyUser={currentUserInfo}
                                        readOnlyTooltip={
                                            isSoloProject
                                                ? 'Auto-assigned to you'
                                                : 'Tasks you create are assigned to you'
                                        }
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
