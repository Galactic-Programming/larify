import type { Message } from '@/types/chat';
import { useEcho } from '@laravel/echo-react';
import { useCallback, useEffect, useRef } from 'react';

// Maximum time to show AI thinking indicator (safety timeout)
const AI_THINKING_TIMEOUT_MS = 60000; // 60 seconds

interface UseConversationRealtimeProps {
    conversationId: number;
    currentUserId: number;
    onMessageReceived: (message: Message) => void;
    onMessageDeleted: (messageId: number) => void;
    onTypingUser: (userId: number, userName: string) => void;
    onTypingUserClear: (userId: number) => void;
    onMessagesRead: (readerId: number, readAt: string) => void;
    onAIThinkingChange?: (isThinking: boolean, activeCount?: number) => void;
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
    const aiThinkingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Listen for new messages
    useEcho(
        `conversation.${conversationId}`,
        '.message.sent',
        (data: { message: Message }) => {
            if (data.message.sender?.id !== currentUserId) {
                onMessageReceived(data.message);

                // If we receive an AI message, clear the thinking indicator
                // Note: The backend now handles this via active_count, but we keep
                // this as a safety fallback for edge cases
                if (data.message.sender?.is_ai || data.message.is_ai) {
                    if (aiThinkingTimeoutRef.current) {
                        clearTimeout(aiThinkingTimeoutRef.current);
                        aiThinkingTimeoutRef.current = null;
                    }
                }
            }
        },
        [currentUserId, onMessageReceived],
        'private',
    );

    // Listen for AI thinking state with active count support
    // active_count tracks concurrent AI requests for accurate indicator state
    useEcho(
        `conversation.${conversationId}`,
        '.AIThinking',
        (data: {
            conversation_id: number;
            is_thinking: boolean;
            active_count: number;
        }) => {
            if (onAIThinkingChange) {
                // Clear any existing timeout
                if (aiThinkingTimeoutRef.current) {
                    clearTimeout(aiThinkingTimeoutRef.current);
                    aiThinkingTimeoutRef.current = null;
                }

                // Use active_count to determine if AI is still thinking
                // This handles concurrent requests correctly:
                // - A starts: count=1, thinking=true
                // - B starts: count=2, thinking=true
                // - A ends: count=1, thinking=true (still processing B)
                // - B ends: count=0, thinking=false
                const isActuallyThinking =
                    data.active_count > 0 || data.is_thinking;
                onAIThinkingChange(isActuallyThinking, data.active_count);

                // Set safety timeout to auto-clear thinking indicator
                if (isActuallyThinking) {
                    aiThinkingTimeoutRef.current = setTimeout(() => {
                        console.warn(
                            'AI thinking timeout reached, clearing indicator',
                        );
                        onAIThinkingChange(false, 0);
                        aiThinkingTimeoutRef.current = null;
                    }, AI_THINKING_TIMEOUT_MS);
                }
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

    // Cleanup AI thinking timeout on unmount
    useEffect(() => {
        return () => {
            if (aiThinkingTimeoutRef.current) {
                clearTimeout(aiThinkingTimeoutRef.current);
            }
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
