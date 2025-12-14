"use client";

import {
    CheckCircle,
    FileTextIcon,
    Loader2,
    PauseIcon,
    PlayIcon,
    Trash2Icon,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export type TaskStatus = "pending" | "in-progress" | "completed" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskActionType = "start" | "pause" | "complete" | "delete" | "view";

export interface Task {
    id: string;
    title: string;
    assignee: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    notes: string;
}

export interface TableColumn {
    key: keyof Task | "actions";
    label: string;
    width?: string;
}

export interface StatusBadgeConfig {
    label: string;
    className: string;
}

export interface TableWithActionProps {
    /** Tasks data */
    tasks: Task[];
    /** Columns to display */
    columns?: TableColumn[];
    /** Callback when an action is performed */
    onAction?: (task: Task, actionType: TaskActionType) => void;
    /** Custom status badge renderer */
    statusBadgeConfig?: Record<TaskStatus, StatusBadgeConfig>;
    /** Whether actions are async (show loading) */
    asyncActions?: boolean;
    /** Action timeout in ms (for demo) */
    actionTimeout?: number;
    /** Custom class name */
    className?: string;
    /** Whether to show start action for pending/blocked */
    showStartAction?: boolean;
    /** Whether to show pause/complete for in-progress */
    showPauseCompleteActions?: boolean;
    /** Whether to show delete action */
    showDeleteAction?: boolean;
    /** Whether to show view action */
    showViewAction?: boolean;
}

const defaultColumns: TableColumn[] = [
    { key: "title", label: "Title" },
    { key: "assignee", label: "Assignee" },
    { key: "status", label: "Status", width: "w-[120px]" },
    { key: "dueDate", label: "Due Date" },
    { key: "notes", label: "Notes" },
    { key: "actions", label: "Actions", width: "w-[180px]" },
];

const defaultStatusConfig: Record<TaskStatus, StatusBadgeConfig> = {
    pending: {
        label: "Pending",
        className: "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20 border-0",
    },
    "in-progress": {
        label: "In Progress",
        className: "bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 border-0",
    },
    completed: {
        label: "Completed",
        className: "bg-green-500/15 text-green-700 hover:bg-green-500/25 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20 border-0",
    },
    blocked: {
        label: "Blocked",
        className: "bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 border-0",
    },
};

export default function TableWithAction({
    tasks,
    columns = defaultColumns,
    onAction,
    statusBadgeConfig = defaultStatusConfig,
    asyncActions = true,
    actionTimeout = 1000,
    className,
    showStartAction = true,
    showPauseCompleteActions = true,
    showDeleteAction = true,
    showViewAction = true,
}: TableWithActionProps) {
    const [pendingAction, setPendingAction] = useState<{
        id: string;
        type: TaskActionType;
    } | null>(null);

    const isTaskActionPending = (action: TaskActionType, taskId: string) =>
        pendingAction?.id === taskId && pendingAction.type === action;

    const isTaskBusy = (taskId: string) => pendingAction?.id === taskId;

    const handleAction = (task: Task, actionType: TaskActionType) => {
        if (asyncActions) {
            setPendingAction({ id: task.id, type: actionType });
            setTimeout(() => {
                setPendingAction(null);
                onAction?.(task, actionType);
            }, actionTimeout);
        } else {
            onAction?.(task, actionType);
        }
    };

    const getStatusBadge = (status: TaskStatus) => {
        const config = statusBadgeConfig[status];
        if (!config) {
            return <Badge variant="secondary">{status}</Badge>;
        }
        return (
            <Badge variant="outline" className={config.className}>
                {config.label}
            </Badge>
        );
    };

    const renderCellContent = (task: Task, columnKey: keyof Task | "actions") => {
        if (columnKey === "actions") {
            return renderActions(task);
        }
        if (columnKey === "status") {
            return getStatusBadge(task.status);
        }
        if (columnKey === "notes") {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="block cursor-help truncate">{task.notes}</span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-md">{task.notes}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        }
        return task[columnKey];
    };

    const renderActions = (task: Task) => {
        const busy = isTaskBusy(task.id);
        const startPending = isTaskActionPending("start", task.id);
        const pausePending = isTaskActionPending("pause", task.id);
        const completePending = isTaskActionPending("complete", task.id);
        const deletePending = isTaskActionPending("delete", task.id);

        return (
            <TooltipProvider>
                <div className="flex items-center gap-1">
                    {showStartAction && (task.status === "pending" || task.status === "blocked") && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleAction(task, "start")}
                                    disabled={busy}
                                >
                                    {startPending ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <PlayIcon className="size-4" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Start</TooltipContent>
                        </Tooltip>
                    )}
                    {showPauseCompleteActions && task.status === "in-progress" && (
                        <>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleAction(task, "pause")}
                                        disabled={busy}
                                    >
                                        {pausePending ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <PauseIcon className="size-4" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Pause</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleAction(task, "complete")}
                                        disabled={busy}
                                    >
                                        {completePending ? (
                                            <Loader2 className="size-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="size-4" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Complete</TooltipContent>
                            </Tooltip>
                        </>
                    )}
                    {showDeleteAction && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white"
                                    onClick={() => handleAction(task, "delete")}
                                    disabled={busy}
                                >
                                    {deletePending ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Trash2Icon className="size-4" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                    )}
                    {showViewAction && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleAction(task, "view")}
                                    disabled={busy}
                                >
                                    <FileTextIcon className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </TooltipProvider>
        );
    };

    return (
        <div className={`rounded-lg border bg-card ${className ?? "w-[95%]"}`}>
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b">
                        {columns.map((column) => (
                            <TableHead
                                key={column.key}
                                className={`h-12 px-4 font-medium ${column.width ?? ""}`}
                            >
                                {column.label}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks.map((task) => (
                        <TableRow key={task.id} className="hover:bg-muted/50">
                            {columns.map((column) => (
                                <TableCell
                                    key={`${task.id}-${column.key}`}
                                    className={`h-16 px-4 ${column.key === "title" ? "font-medium" : ""
                                        } ${column.key === "notes" ? "max-w-75" : ""
                                        } ${["assignee", "dueDate", "notes"].includes(column.key)
                                            ? "text-sm text-muted-foreground"
                                            : ""
                                        }`}
                                >
                                    {renderCellContent(task, column.key)}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
