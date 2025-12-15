// Task and List types for the Lists page

export type TaskPriority = 'none' | 'low' | 'medium' | 'high' | 'urgent';

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
}

export interface Task {
    id: number;
    project_id: number;
    list_id: number;
    assigned_to: number | null;
    assignee: User | null;
    title: string;
    description: string | null;
    position: number;
    priority: TaskPriority;
    due_date: string | null;
    due_time: string | null;
    started_at: string | null;
    paused_at: string | null;
    total_paused_seconds: number;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface TaskList {
    id: number;
    project_id: number;
    name: string;
    position: number;
    tasks_count: number;
    tasks: Task[];
    created_at: string;
    updated_at: string;
}

export interface Project {
    id: number;
    user_id: number;
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
