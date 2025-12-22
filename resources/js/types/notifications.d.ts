// Notification types
export interface NotificationData {
    task_id?: number;
    task_title?: string;
    project_id?: number;
    project_name?: string;
    project_color?: string;
    project_icon?: string;
    assigned_by_id?: number;
    assigned_by_name?: string;
    assigned_by_avatar?: string;
    completed_by_id?: number;
    completed_by_name?: string;
    completed_by_avatar?: string;
    invited_by_id?: number;
    invited_by_name?: string;
    invited_by_avatar?: string;
    changed_by_id?: number;
    changed_by_name?: string;
    changed_by_avatar?: string;
    removed_by_id?: number;
    removed_by_name?: string;
    due_date?: string;
    due_time?: string;
    time_until_due?: string;
    reminder_hours?: number;
    overdue_by?: string;
    overdue_hours?: number;
    role?: string;
    role_label?: string;
    old_role?: string;
    old_role_label?: string;
    new_role?: string;
    new_role_label?: string;
    message?: string;
    [key: string]: unknown;
}

export interface Notification {
    id: string;
    type: string;
    data: NotificationData;
    read_at: string | null;
    is_read: boolean;
    created_at: string;
    created_at_human: string;
}

export type NotificationFilter = 'all' | 'unread' | 'read';
export type NotificationSortBy = 'recent' | 'oldest' | 'type';

// Notification type constants
export const NOTIFICATION_TYPES = {
    TASK_ASSIGNED: 'task.assigned',
    TASK_COMPLETED: 'task.completed',
    TASK_DUE_SOON: 'task.due_soon',
    TASK_OVERDUE: 'task.overdue',
    PROJECT_INVITATION: 'project.invitation',
    PROJECT_REMOVED: 'project.removed',
    MEMBER_ROLE_CHANGED: 'member.role_changed',
} as const;

// Activity types
export interface ActivityUser {
    id: number;
    name: string;
    avatar?: string;
}

export interface ActivityProject {
    id: number;
    name: string;
    color: string;
    icon?: string;
}

export interface Activity {
    id: number;
    type: string;
    type_label: string;
    type_icon: string;
    description: string;
    properties: Record<string, unknown> | null;
    user: ActivityUser | null;
    project: ActivityProject | null;
    subject_type: string | null;
    subject_id: number | null;
    created_at: string;
    created_at_human: string;
}

// Pagination
export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

// API Responses
export interface NotificationsResponse {
    notifications: {
        data: Notification[];
    };
    unread_count: number;
    pagination: PaginationMeta;
}

export interface ActivitiesResponse {
    activities: {
        data: Activity[];
    };
    pagination: PaginationMeta;
}

export interface UnreadCountResponse {
    count: number;
}

// Real-time event data
export interface NotificationEventData {
    notification: Notification;
    unread_count: number;
}
