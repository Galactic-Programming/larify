// ============================================
// Backend Types (matching Laravel responses)
// ============================================

export interface Participant {
    id: number;
    name: string;
    email?: string;
    avatar?: string;
    is_ai?: boolean;
}

export interface MessageAttachment {
    id: number;
    original_name: string;
    mime_type: string;
    size: number;
    human_size: string;
    url: string;
}

export interface MessageMention {
    user_id: number;
    name: string;
    email: string;
}

export interface Message {
    id: number;
    content: string;
    created_at: string;
    sender: {
        id: number;
        name: string;
        avatar?: string;
        is_ai?: boolean;
    } | null;
    is_mine: boolean;
    is_ai?: boolean;
    can_delete?: boolean;
    is_read?: boolean;
    mentions: MessageMention[];
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

export interface ConversationProject {
    id: number;
    name: string;
    color: string;
    icon?: string;
}

export interface Conversation {
    id: number;
    name: string;
    color: string;
    icon?: string;
    project_id: number;
    participants: Participant[];
    last_message?: ConversationLastMessage;
    unread_count: number;
    last_message_at?: string;
    created_at: string;
}

export interface ConversationDetail extends Conversation {
    project?: ConversationProject;
    messages: Message[];
}

// Project with chat status (for empty state)
export interface ProjectChatInfo {
    id: number;
    name: string;
    color: string;
    icon?: string;
    member_count: number;
    has_chat_enabled: boolean;
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
