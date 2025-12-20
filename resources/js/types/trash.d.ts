// Trash item types (for actual items - no 'all')
export type TrashItemType = 'project' | 'list' | 'task';

// Filter types (includes 'all' option)
export type TrashFilterType = 'all' | 'project' | 'list' | 'task';

// For project trash (no projects, just lists/tasks)
export type ProjectTrashItemType = 'all' | 'lists' | 'tasks';

export type TrashSortBy = 'recent' | 'type' | 'remaining' | 'expiring';

export type TrashFilter = 'all' | 'projects' | 'lists' | 'tasks';

// Base trashed item interface
export interface BaseTrashedItem {
    id: number;
    deleted_at: string;
    days_remaining: number;
}

// Trashed Project
export interface TrashedProject extends BaseTrashedItem {
    type: 'project';
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
    is_archived: boolean;
    lists_count: number;
    tasks_count: number;
}

// Trashed List
export interface TrashedList extends BaseTrashedItem {
    type: 'list';
    name: string;
    color: string | null;
    project_id: number;
    project_name: string;
    project_color: string;
    tasks_count: number;
    expires_at: string;
}

// Trashed Task
export interface TrashedTask extends BaseTrashedItem {
    type: 'task';
    title: string;
    description: string | null;
    priority: 'low' | 'medium' | 'high' | 'critical';
    due_date: string | null;
    due_time: string | null;
    project_id: number;
    project_name: string;
    project_color: string;
    list_id: number;
    list_name: string;
    list_deleted: boolean;
    expires_at: string;
    list?: {
        id: number;
        name: string;
        color: string | null;
    };
}

// Union type for all trashed items
export type TrashedItem = TrashedProject | TrashedList | TrashedTask;

// Props for trash page
export interface TrashPageProps {
    trashedProjects: TrashedProject[];
    trashedLists: TrashedList[];
    trashedTasks: TrashedTask[];
    retentionDays: number;
}

// Props for project trash
export interface ProjectTrashProps {
    trashedLists: TrashedList[];
    trashedTasks: TrashedTask[];
    retentionDays: number;
}

// Helper to normalize items to a common format for display
export interface NormalizedTrashItem {
    id: number;
    type: TrashItemType; // 'project' | 'list' | 'task' (never 'all')
    title: string;
    subtitle: string | null;
    color: string;
    icon: string | null;
    deletedAt: string;
    daysRemaining: number;
    metadata: {
        projectId?: number;
        projectName?: string;
        listId?: number;
        listName?: string;
        listDeleted?: boolean;
        listsCount?: number;
        tasksCount?: number;
        priority?: string;
    };
}
