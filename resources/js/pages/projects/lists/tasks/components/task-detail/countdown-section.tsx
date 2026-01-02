import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, CircleAlert, Clock } from 'lucide-react';
import type { Permissions, Task } from '../../../lib/types';
import type { CountdownStyles } from './types';

interface CountdownSectionProps {
    task: Task;
    permissions: Permissions;
    isCompleted: boolean;
    isOverdue: boolean;
    completedLate: boolean;
    isProcessing: boolean;
    timeRemaining: number;
    lateBySeconds: number;
    urgencyLevel: 'overdue' | 'urgent' | 'warning' | 'normal';
    countdownStyles: CountdownStyles;
    deadlineDisplay: { date: string; time: string };
    formatTimeHHMMSS: (seconds: number) => string;
    formatTimeHumanReadable: (seconds: number) => string;
    onToggleComplete: () => void;
    canReopen: boolean;
}

export function CountdownSection({
    task,
    permissions,
    isCompleted,
    isOverdue,
    completedLate,
    isProcessing,
    timeRemaining,
    lateBySeconds,
    urgencyLevel,
    countdownStyles,
    deadlineDisplay,
    formatTimeHHMMSS,
    formatTimeHumanReadable,
    onToggleComplete,
    canReopen,
}: CountdownSectionProps) {
    return (
        <div className={`overflow-hidden rounded-xl ${countdownStyles.bg}`}>
            <div className="p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            {!isCompleted && urgencyLevel === 'urgent' && (
                                <div className="absolute inset-0 animate-ping rounded-full bg-red-500/30" />
                            )}
                            <div
                                className={`relative flex size-10 items-center justify-center rounded-full ${countdownStyles.iconBg} text-white`}
                            >
                                {isCompleted ? (
                                    completedLate ? (
                                        <CircleAlert className="size-5" />
                                    ) : (
                                        <CheckCircle2 className="size-5" />
                                    )
                                ) : (
                                    <Clock className="size-5" />
                                )}
                            </div>
                        </div>
                        <div>
                            <p
                                className={`text-xs font-medium tracking-wider uppercase ${countdownStyles.textSecondary}`}
                            >
                                {isCompleted
                                    ? completedLate
                                        ? 'Completed Late'
                                        : 'Completed On Time'
                                    : isOverdue
                                        ? 'Overdue'
                                        : 'Time Remaining'}
                            </p>
                            {isCompleted ? (
                                <>
                                    <p
                                        className={`text-lg font-semibold ${countdownStyles.textPrimary}`}
                                    >
                                        {format(
                                            parseISO(task.completed_at!),
                                            'MMM d, yyyy • HH:mm',
                                        )}
                                    </p>
                                    {completedLate && (
                                        <p
                                            className={`text-sm ${countdownStyles.textSecondary}`}
                                        >
                                            {formatTimeHumanReadable(-lateBySeconds).replace(
                                                ' left',
                                                ' late',
                                            )}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <p
                                        className={`text-2xl font-bold tabular-nums ${countdownStyles.textPrimary}`}
                                    >
                                        {formatTimeHHMMSS(timeRemaining)}
                                    </p>
                                    <p
                                        className={`text-sm ${countdownStyles.textSecondary}`}
                                    >
                                        {formatTimeHumanReadable(timeRemaining)}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                    {/* Complete button - Only for users with edit permission */}
                    {!isCompleted && permissions.canEdit && (
                        <Button
                            size="sm"
                            className="gap-1.5 bg-emerald-500 text-white hover:bg-emerald-600"
                            onClick={onToggleComplete}
                            disabled={isProcessing}
                        >
                            <CheckCircle2 className="size-3.5" />
                            Complete
                        </Button>
                    )}
                    {/* Reopen button - Only for owners (canReopen) */}
                    {isCompleted && canReopen && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={onToggleComplete}
                            disabled={isProcessing}
                        >
                            Reopen
                        </Button>
                    )}
                </div>

                {/* Deadline info */}
                <div className="mt-3 flex flex-col gap-1 border-t border-current/10 pt-3 text-xs text-muted-foreground sm:flex-row sm:gap-4">
                    <div>
                        <span className="font-medium">Deadline:</span> {deadlineDisplay.date}{' '}
                        at {deadlineDisplay.time}
                    </div>
                    {task.completed_at && (
                        <div>
                            <span className="font-medium">Completed:</span>{' '}
                            {format(parseISO(task.completed_at), 'MMM d, HH:mm')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
