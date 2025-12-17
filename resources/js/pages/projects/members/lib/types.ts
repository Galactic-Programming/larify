// Types for Project Members page

export type ProjectRole = 'owner' | 'editor' | 'viewer';

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string | null;
}

export interface Member extends User {
    pivot_id?: number; // ProjectMember ID for update/delete operations
    role: ProjectRole;
    joined_at: string;
    is_owner: boolean;
}

export interface Project {
    id: number;
    user_id: number;
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
}

export interface ProjectWithMembers extends Project {
    user: User; // Owner
    members: Member[];
}

// Role configuration for UI
export const ROLE_CONFIG: Record<
    ProjectRole,
    { label: string; description: string; color: string }
> = {
    owner: {
        label: 'Owner',
        description: 'Full access, can manage members and delete project',
        color: 'bg-amber-500',
    },
    editor: {
        label: 'Editor',
        description: 'Can create, edit and delete tasks and lists',
        color: 'bg-blue-500',
    },
    viewer: {
        label: 'Viewer',
        description: 'Can only view project content',
        color: 'bg-gray-500',
    },
};
