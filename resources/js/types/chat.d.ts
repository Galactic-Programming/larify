// ============================================
// Backend Types (matching Laravel responses)
// ============================================

export type ConversationType = 'direct' | 'group';
export type ParticipantRole = 'owner' | 'member';

export interface Participant {
    id: number;
    name: string;
    email?: string;
    avatar?: string;
    role?: ParticipantRole;
}

export interface MessageAttachment {
    id: number;
    original_name: string;
    mime_type: string;
    size: number;
    human_size: string;
    url: string;
}

export interface MessageParent {
    id: number;
    content: string | null;
    sender_name?: string | null;
    is_deleted?: boolean;
}

export interface Message {
    id: number;
    content: string;
    is_edited: boolean;
    edited_at?: string;
    created_at: string;
    sender: {
        id: number;
        name: string;
        avatar?: string;
    } | null;
    is_mine: boolean;
    is_read?: boolean;
    parent?: MessageParent;
    attachments: MessageAttachment[];
}

export interface ConversationLastMessage {
    id: number;
    content: string;
    sender: {
        id: number;
        name: string;
    } | null;
    created_at: string;
}

export interface Conversation {
    id: number;
    type: ConversationType;
    name: string;
    avatar?: string;
    raw_name?: string;
    participants: Participant[];
    last_message?: ConversationLastMessage;
    unread_count: number;
    last_message_at?: string;
    created_at: string;
}

export interface ConversationDetail extends Conversation {
    raw_name?: string;
    messages: Message[];
    can_update: boolean;
    can_manage_participants: boolean;
    can_leave: boolean;
}

// ============================================
// Legacy Component Types (backward compatible)
// ============================================

export interface ChatUser {
    id: number;
    name: string;
    avatar?: string;
    status?: 'online' | 'offline' | 'away';
    lastSeen?: string;
}

export interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: number;
    content: string;
    timestamp: string;
    isRead: boolean;
    attachments?: ChatAttachment[];
}

export interface ChatAttachment {
    id: string;
    type: 'image' | 'file';
    url: string;
    name: string;
    size?: number;
}

export interface ChatConversation {
    id: string;
    type: 'personal' | 'group';
    name: string;
    avatar?: string;
    participants: ChatUser[];
    lastMessage?: {
        content: string;
        timestamp: string;
        senderId: number;
    };
    unreadCount: number;
}

export interface ChatMainProps {
    conversation?: ChatConversation;
    messages: ChatMessage[];
    currentUserId: number;
    onSendMessage: (content: string) => void;
    onAttachImage?: () => void;
    onLoadMoreMessages?: () => void;
    isLoading?: boolean;
}
