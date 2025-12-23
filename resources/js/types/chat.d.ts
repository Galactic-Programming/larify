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

export interface ChatSidebarProps {
    conversations: ChatConversation[];
    activeConversationId?: string;
    currentUserId: number;
    onConversationSelect: (conversationId: string) => void;
    onNewChat?: () => void;
    onSearch?: (query: string) => void;
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
