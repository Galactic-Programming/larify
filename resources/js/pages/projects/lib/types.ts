// Project types for the Projects page

export interface Project {
    id: number;
    user_id: number;
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
    is_archived: boolean;
    lists_count: number;
    tasks_count: number;
    members_count: number;
    created_at: string;
    updated_at: string;
}

export type FilterType = 'all' | 'active' | 'archived';
export type SortType = 'recent' | 'name' | 'created';
