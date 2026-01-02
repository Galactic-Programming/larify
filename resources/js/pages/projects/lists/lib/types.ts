// Task and List types for the Lists page

export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

// Label color names (matches backend Label::COLORS keys)
export type LabelColorName =
    | 'gray'
    | 'red'
    | 'yellow'
    | 'green'
    | 'blue'
    | 'purple'
    | 'pink'
    | 'indigo'
    | 'cyan'
    | 'teal'
    | 'orange'
    | 'lime';

export interface Label {
    id: number;
    project_id: number;
    name: string;
    color: LabelColorName | string; // Can be preset name or custom hex
    created_at: string;
    updated_at: string;
}

// Color definitions matching backend Label::COLORS
export const LABEL_COLORS: Record<LabelColorName, string> = {
    // Basic (Free plan)
    gray: '#6b7280',
    red: '#ef4444',
    yellow: '#f59e0b',
    green: '#22c55e',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    // Extended (Pro plan)
    pink: '#ec4899',
    indigo: '#6366f1',
    cyan: '#06b6d4',
    teal: '#14b8a6',
    orange: '#f97316',
    lime: '#84cc16',
};

// Free plan color names
export const FREE_LABEL_COLORS: LabelColorName[] = [
    'gray',
    'red',
    'yellow',
    'green',
    'blue',
    'purple',
];

// Pro plan additional colors
export const PRO_LABEL_COLORS: LabelColorName[] = [
    'pink',
    'indigo',
    'cyan',
    'teal',
    'orange',
    'lime',
];

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
}

export interface ProjectMember extends User {
    pivot?: {
        role: 'owner' | 'admin' | 'editor' | 'viewer';
        joined_at: string;
    };
}

export interface Task {
    id: number;
    project_id: number;
    list_id: number;
    original_list_id: number | null;
    created_by: number | null;
    assigned_to: number | null;
    assignee: User | null;
    title: string;
    description: string | null;
    position: number;
    priority: TaskPriority;
    due_date: string;
    due_time: string;
    completed_at: string | null;
    labels?: Label[];
    created_at: string;
    updated_at: string;
}

export interface TaskList {
    id: number;
    project_id: number;
    name: string;
    position: number;
    is_done_list: boolean;
    tasks_count: number;
    tasks: Task[];
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: number;
    user_id: number;
    user?: User;
    members?: ProjectMember[];
    labels?: Label[];
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
    is_archived: boolean;
    lists: TaskList[];
    created_at: string;
    updated_at: string;
}

export type ViewMode = 'board' | 'list' | 'table';

export type TaskFilter =
    | 'all'
    | 'overdue'
    | 'due-soon'
    | 'completed'
    | 'completed-late';

// Permissions object returned from backend
export interface Permissions {
    canEdit: boolean;
    canDelete: boolean;
    canManageSettings: boolean;
    canManageMembers: boolean;
    canAssignTask: boolean;
    canSetDoneList: boolean;
    canReopen: boolean;
    role: 'owner' | 'editor' | 'viewer';
    // List limit info
    canCreateList: boolean;
    maxLists: number | null;
    currentLists: number;
    // Label permissions
    canCreateLabel: boolean;
    maxLabels: number | null;
    currentLabels: number;
    hasExtendedColors: boolean;
}
