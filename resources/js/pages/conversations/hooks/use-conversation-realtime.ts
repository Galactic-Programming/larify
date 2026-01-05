import type { Message } from '@/types/chat';
import { useEcho } from '@laravel/echo-react';
import { useCallback, useEffect, useRef } from 'react';

interface UseConversationRealtimeProps {
    conversationId: number;
    currentUserId: number;
    onMessageReceived: (message: Message) => void;
    onMessageDeleted: (messageId: number) => void;
    onTypingUser: (userId: number, userName: string) => void;
    onTypingUserClear: (userId: number) => void;
    onMessagesRead: (readerId: number, readAt: string) => void;
    onAIThinkingChange?: (isThinking: boolean) => void;
}

/**
 * Custom hook for handling real-time conversation events via WebSocket
 */
export function useConversationRealtime({
    conversationId,
    currentUserId,
    onMessageReceived,
    onMessageDeleted,
    onTypingUser,
    onTypingUserClear,
    onMessagesRead,
    onAIThinkingChange,
}: UseConversationRealtimeProps) {
    const typingTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

    // Listen for new messages
    useEcho(
        `conversation.${conversationId}`,
        '.message.sent',
        (data: { message: Message }) => {
            if (data.message.sender?.id !== currentUserId) {
                onMessageReceived(data.message);
            }
        },
        [currentUserId, onMessageReceived],
        'private',
    );

    // Listen for AI thinking state
    useEcho(
        `conversation.${conversationId}`,
        '.AIThinking',
        (data: { conversation_id: number; is_thinking: boolean }) => {
            if (onAIThinkingChange) {
                onAIThinkingChange(data.is_thinking);
            }
        },
        [onAIThinkingChange],
        'private',
    );

    // Listen for deleted messages
    useEcho(
        `conversation.${conversationId}`,
        '.message.deleted',
        (data: { message_id: number }) => {
            onMessageDeleted(data.message_id);
        },
        [onMessageDeleted],
        'private',
    );

    // Listen for typing indicators
    useEcho(
        `conversation.${conversationId}`,
        '.user.typing',
        (data: { user: { id: number; name: string } }) => {
            if (data.user.id === currentUserId) return;

            // Clear existing timeout for this user
            const existingTimeout = typingTimeoutsRef.current.get(data.user.id);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }

            onTypingUser(data.user.id, data.user.name);

            // Set new timeout to clear typing indicator
            const timeoutId = setTimeout(() => {
                onTypingUserClear(data.user.id);
                typingTimeoutsRef.current.delete(data.user.id);
            }, 3000);

            typingTimeoutsRef.current.set(data.user.id, timeoutId);
        },
        [currentUserId, onTypingUser, onTypingUserClear],
        'private',
    );

    // Listen for read receipts
    useEcho(
        `conversation.${conversationId}`,
        '.messages.read',
        (data: { reader_id: number; read_at: string }) => {
            if (data.reader_id === currentUserId) return;
            onMessagesRead(data.reader_id, data.read_at);
        },
        [currentUserId, onMessagesRead],
        'private',
    );

    // Cleanup typing timeouts on unmount
    useEffect(() => {
        const timeouts = typingTimeoutsRef.current;
        return () => {
            timeouts.forEach((timeout) => clearTimeout(timeout));
            timeouts.clear();
        };
    }, []);

    // Send typing indicator
    const sendTypingIndicator = useCallback(() => {
        fetch(`/conversations/${conversationId}/typing`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN':
                    document.querySelector<HTMLMetaElement>(
                        'meta[name="csrf-token"]',
                    )?.content ?? '',
            },
        });
    }, [conversationId]);

    // Mark messages as read
    const markMessagesAsRead = useCallback(() => {
        fetch(`/conversations/${conversationId}/messages/read`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN':
                    document.querySelector<HTMLMetaElement>(
                        'meta[name="csrf-token"]',
                    )?.content ?? '',
            },
        });
    }, [conversationId]);

    return {
        sendTypingIndicator,
        markMessagesAsRead,
    };
}
