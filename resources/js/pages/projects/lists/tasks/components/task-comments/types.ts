export interface CommentUser {
    id: number;
    name: string;
    avatar: string | null;
}

export interface CommentReaction {
    emoji: string;
    count: number;
    reacted_by_me: boolean;
}

export interface TaskComment {
    id: number;
    task_id: number;
    content: string;
    is_edited: boolean;
    created_at: string;
    user: CommentUser;
    reactions: CommentReaction[];
    is_mine: boolean;
    can_edit: boolean;
    can_delete: boolean;
}

export interface CommentPermissions {
    can_create: boolean;
    can_use_reactions: boolean;
}

export interface CommentsResponse {
    comments: TaskComment[];
    has_more: boolean;
    next_cursor: number | null;
    permissions: CommentPermissions;
}
