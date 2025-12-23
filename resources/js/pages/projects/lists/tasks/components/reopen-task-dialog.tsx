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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Form } from '@inertiajs/react';
import { format } from 'date-fns';
import {
    AlertTriangle,
    CalendarIcon,
    ChevronDownIcon,
    Clock,
} from 'lucide-react';
import { useState } from 'react';
import type { Task } from '../../lib/types';

interface Project {
    id: number;
    name: string;
    color: string;
}

interface ReopenTaskDialogProps {
    project: Project;
    task: Task;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ReopenTaskDialog({
    project,
    task,
    open,
    onOpenChange,
}: ReopenTaskDialogProps) {
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
    const [dueTime, setDueTime] = useState<string>('');
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    const handleOpenChange = (isOpen: boolean) => {
        onOpenChange(isOpen);
        // Reset state when closing
        if (!isOpen) {
            setDueDate(undefined);
            setDueTime('');
        }
    };

    // Build reopen URL manually since wayfinder may not have regenerated
    const reopenUrl = `/projects/${project.id}/tasks/${task.id}/reopen`;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <Form
                    action={reopenUrl}
                    method="patch"
                    className="space-y-6"
                    onSuccess={() => {
                        handleOpenChange(false);
                        softToastSuccess('Task reopened with new deadline');
                    }}
                >
                    {({ processing, errors }) => (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10">
                                        <AlertTriangle className="size-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <DialogTitle>
                                            Reopen Overdue Task
                                        </DialogTitle>
                                        <DialogDescription>
                                            This task is overdue. Set a new
                                            deadline to reopen it.
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                                <div className="flex items-start gap-3">
                                    <Clock className="mt-0.5 size-4 text-amber-600" />
                                    <div className="text-sm">
                                        <p className="font-medium text-amber-800 dark:text-amber-400">
                                            {task.title}
                                        </p>
                                        <p className="mt-1 text-amber-700 dark:text-amber-500">
                                            Original deadline:{' '}
                                            {format(
                                                new Date(
                                                    `${task.due_date.split('T')[0]}T${task.due_time}`,
                                                ),
                                                "MMM d, yyyy 'at' HH:mm",
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="due_date">
                                        New Due Date
                                    </Label>
                                    <input
                                        type="hidden"
                                        name="due_date"
                                        value={
                                            dueDate
                                                ? format(dueDate, 'yyyy-MM-dd')
                                                : ''
                                        }
                                    />
                                    <Popover
                                        open={datePickerOpen}
                                        onOpenChange={setDatePickerOpen}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-left font-normal"
                                            >
                                                <CalendarIcon className="mr-2 size-4" />
                                                {dueDate
                                                    ? format(dueDate, 'PPP')
                                                    : 'Select new date'}
                                                <ChevronDownIcon className="ml-auto size-4 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-auto p-0"
                                            align="start"
                                        >
                                            <Calendar
                                                mode="single"
                                                selected={dueDate}
                                                onSelect={(date) => {
                                                    setDueDate(date);
                                                    setDatePickerOpen(false);
                                                }}
                                                disabled={(date) =>
                                                    date <
                                                    new Date(
                                                        new Date().setHours(
                                                            0,
                                                            0,
                                                            0,
                                                            0,
                                                        ),
                                                    )
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <InputError message={errors.due_date} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="due_time">
                                        New Due Time
                                    </Label>
                                    <Input
                                        type="time"
                                        id="due_time"
                                        name="due_time"
                                        value={dueTime}
                                        onChange={(e) =>
                                            setDueTime(e.target.value)
                                        }
                                        className="w-full"
                                    />
                                    <InputError message={errors.due_time} />
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
                                <Button
                                    type="submit"
                                    disabled={
                                        processing || !dueDate || !dueTime
                                    }
                                >
                                    {processing
                                        ? 'Reopening...'
                                        : 'Reopen Task'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
