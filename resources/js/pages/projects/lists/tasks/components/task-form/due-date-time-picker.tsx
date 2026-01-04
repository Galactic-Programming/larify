import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { CalendarIcon, ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';

interface DueDateTimePickerProps {
    dueDate: Date | undefined;
    dueTime: string;
    onDateChange: (date: Date | undefined) => void;
    onTimeChange: (time: string) => void;
    dateError?: string;
    timeError?: string;
    readOnly?: boolean;
    readOnlyTooltip?: string;
}

export function DueDateTimePicker({
    dueDate,
    dueTime,
    onDateChange,
    onTimeChange,
    dateError,
    timeError,
    readOnly = false,
    readOnlyTooltip = 'You cannot change the deadline for this task',
}: DueDateTimePickerProps) {
    const [datePickerOpen, setDatePickerOpen] = useState(false);

    return (
        <div className="grid gap-4 sm:grid-cols-2">
            {/* Due Date */}
            <div className="grid gap-2">
                <Label>Due Date</Label>
                {readOnly ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex h-9 items-center gap-2 rounded-md border bg-muted/50 px-3">
                                <CalendarIcon className="size-4 text-muted-foreground" />
                                <span className="text-sm">
                                    {dueDate
                                        ? format(dueDate, 'MMM d, yyyy')
                                        : 'No date'}
                                </span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>{readOnlyTooltip}</TooltipContent>
                    </Tooltip>
                ) : (
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-between font-normal"
                            >
                                <span className="flex items-center gap-2">
                                    <CalendarIcon className="size-4 text-muted-foreground" />
                                    {dueDate
                                        ? format(dueDate, 'MMM d, yyyy')
                                        : 'Select date'}
                                </span>
                                <ChevronDownIcon className="size-4 text-muted-foreground" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-auto overflow-hidden p-0"
                            align="start"
                        >
                            <Calendar
                                mode="single"
                                selected={dueDate}
                                captionLayout="dropdown"
                                disabled={(date) =>
                                    date <
                                    new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                onSelect={(date) => {
                                    onDateChange(date);
                                    setDatePickerOpen(false);
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                )}
                <input
                    type="hidden"
                    name="due_date"
                    value={dueDate ? format(dueDate, 'yyyy-MM-dd') : ''}
                />
                <InputError message={dateError} />
            </div>

            {/* Due Time */}
            <div className="grid gap-2">
                <Label>Due Time</Label>
                {readOnly ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex h-9 items-center gap-2 rounded-md border bg-muted/50 px-3">
                                <span className="text-sm">
                                    {dueTime ? dueTime.slice(0, 5) : 'No time'}
                                </span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>{readOnlyTooltip}</TooltipContent>
                    </Tooltip>
                ) : (
                    <Input
                        type="time"
                        value={dueTime}
                        onChange={(e) => onTimeChange(e.target.value)}
                        className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />
                )}
                <input type="hidden" name="due_time" value={dueTime} />
                <InputError message={timeError} />
            </div>
        </div>
    );
}
