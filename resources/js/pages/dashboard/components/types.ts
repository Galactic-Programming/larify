export interface DashboardProject {
    id: number;
    name: string;
    color: string;
}

export interface DashboardList {
    id: number;
    name: string;
}

export interface DashboardTask {
    id: number;
    title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent' | null;
    due_date: string | null;
    due_time: string | null;
    is_overdue: boolean;
    project: DashboardProject | null;
    list: DashboardList | null;
}

export interface GroupedTasks {
    overdue: DashboardTask[];
    today: DashboardTask[];
    this_week: DashboardTask[];
    later: DashboardTask[];
    no_date: DashboardTask[];
}

export interface DashboardStats {
    my_tasks_count: number;
    overdue_count: number;
    due_today_count: number;
    high_priority_count: number;
    projects_count: number;
    archived_projects_count: number;
    avg_progress: number;
    total_project_tasks: number;
    completed_project_tasks: number;
    completed_this_week: number;
    completed_last_week: number;
    week_change: number;
}

export interface UpcomingTask {
    id: number;
    title: string;
    due_date: string;
    due_time: string;
    project: DashboardProject | null;
}

export interface ActivityUser {
    id: number;
    name: string;
    profile_photo_path: string | null;
}

export interface ActivityData {
    event: string;
    subject_type: string;
    subject_id: number;
    subject_name?: string;
    causer_name?: string;
    properties?: Record<string, unknown>;
}

export interface Activity {
    id: number;
    user: ActivityUser | null;
    description: string;
    created_at: string;
    data: ActivityData;
}

export interface RecentProject {
    id: number;
    name: string;
    color: string;
    tasks_count: number;
    completed_tasks_count: number;
    progress: number;
    updated_at: string;
}

export interface DashboardPageProps {
    stats: DashboardStats;
    myTasks: GroupedTasks;
    upcomingDeadlines: UpcomingTask[];
    recentActivities: Activity[];
    recentProjects: RecentProject[];
}
