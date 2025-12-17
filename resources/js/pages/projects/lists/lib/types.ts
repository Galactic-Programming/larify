// Task and List types for the Lists page

export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

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
    assigned_to: number | null;
    assignee: User | null;
    title: string;
    description: string | null;
    position: number;
    priority: TaskPriority;
    due_date: string;
    due_time: string;
    completed_at: string | null;
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
    canReopen: boolean;
    role: 'owner' | 'editor' | 'viewer';
}
