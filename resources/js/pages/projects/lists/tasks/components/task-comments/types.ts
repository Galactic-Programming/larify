export interface CommentUser {
    id: number;
    name: string;
    avatar: string | null;
    email?: string;
}

export interface CommentReaction {
    emoji: string;
    count: number;
    reacted_by_me: boolean;
}

export interface CommentMention {
    id: number;
    user_id: number;
    user: CommentUser;
}

export interface TaskComment {
    id: number;
    task_id: number;
    user_id: number;
    parent_id: number | null;
    content: string;
    is_edited: boolean;
    created_at: string;
    updated_at: string;
    user: CommentUser;
    parent?: TaskComment | null;
    replies_count: number;
    reactions: CommentReaction[];
    mentions: CommentMention[];
    is_mine: boolean;
    can_edit: boolean;
    can_delete: boolean;
}

export interface CommentPermissions {
    can_create: boolean;
    can_use_mentions: boolean;
    can_use_reactions: boolean;
}

export interface CommentsResponse {
    comments: TaskComment[];
    has_more: boolean;
    next_cursor: number | null;
    permissions: CommentPermissions;
}

export interface RepliesResponse {
    replies: TaskComment[];
    has_more: boolean;
    next_cursor: number | null;
}
