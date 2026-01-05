import type { Message } from '@/types/chat';
import { useCallback, useState } from 'react';

interface User {
    id: number;
    name: string;
    avatar?: string;
}

interface UseMessageActionsProps {
    conversationId: number;
    currentUser: User;
    onMessagesChange: React.Dispatch<React.SetStateAction<Message[]>>;
    onAIThinkingChange?: (isThinking: boolean) => void;
}

interface UseMessageActionsReturn {
    isSending: boolean;
    isDeleting: boolean;
    inputValue: string;
    selectedFiles: File[];
    deleteMessageId: number | null;
    setInputValue: (value: string) => void;
    setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
    setDeleteMessageId: (id: number | null) => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    confirmDelete: () => Promise<void>;
}

// Check if message mentions AI
const hasMentionedAI = (content: string): boolean => {
    return /@(AI|Laraflow\s*AI)\b/i.test(content);
};

// Generate a temporary ID for optimistic messages
const generateTempId = () => -Date.now();

/**
 * Custom hook for handling message send/delete actions
 */
export function useMessageActions({
    conversationId,
    currentUser,
    onMessagesChange,
    onAIThinkingChange,
}: UseMessageActionsProps): UseMessageActionsReturn {
    const [isSending, setIsSending] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [deleteMessageId, setDeleteMessageId] = useState<number | null>(null);

    // Send message with optimistic update
    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if ((!inputValue.trim() && selectedFiles.length === 0) || isSending)
                return;

            const content = inputValue.trim();
            const tempId = generateTempId();
            const currentFiles = [...selectedFiles];
            const mentionedAI = hasMentionedAI(content);

            // Create optimistic message (only if text-only, files need server processing)
            const optimisticMessage: Message | null =
                currentFiles.length === 0
                    ? {
                          id: tempId,
                          content,
                          created_at: new Date().toISOString(),
                          sender: {
                              id: currentUser.id,
                              name: currentUser.name,
                              avatar: currentUser.avatar,
                          },
                          is_mine: true,
                          is_read: false,
                          attachments: [],
                          mentions: [],
                      }
                    : null;

            // Optimistically add the message
            if (optimisticMessage) {
                onMessagesChange((prev) => [...prev, optimisticMessage]);
            }

            // Clear input immediately for better UX
            setInputValue('');
            setSelectedFiles([]);
            setIsSending(true);

            // Show AI thinking indicator if AI was mentioned
            if (mentionedAI && onAIThinkingChange) {
                onAIThinkingChange(true);
            }

            try {
                const formData = new FormData();
                if (content) {
                    formData.append('content', content);
                }
                currentFiles.forEach((file) => {
                    formData.append('attachments[]', file);
                });

                const csrfToken =
                    document.querySelector<HTMLMetaElement>(
                        'meta[name="csrf-token"]',
                    )?.content ?? '';

                const response = await fetch(
                    `/conversations/${conversationId}/messages`,
                    {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json',
                            'X-CSRF-TOKEN': csrfToken,
                        },
                        body: formData,
                    },
                );

                if (response.ok) {
                    const data = await response.json();
                    onMessagesChange((prev) => {
                        let newMessages = prev;

                        // Replace optimistic message with real message
                        if (optimisticMessage) {
                            newMessages = newMessages.map((m) =>
                                m.id === tempId ? data.message : m,
                            );
                        } else {
                            // For file uploads, just add the message if not already present
                            if (
                                !newMessages.some(
                                    (m) => m.id === data.message.id,
                                )
                            ) {
                                newMessages = [...newMessages, data.message];
                            }
                        }

                        // Add AI response message if present
                        if (
                            data.ai_message &&
                            !newMessages.some(
                                (m) => m.id === data.ai_message.id,
                            )
                        ) {
                            newMessages = [...newMessages, data.ai_message];
                        }

                        return newMessages;
                    });

                    // Turn off AI thinking indicator after receiving response
                    if (mentionedAI && onAIThinkingChange) {
                        onAIThinkingChange(false);
                    }
                } else {
                    // Revert optimistic update on error
                    if (optimisticMessage) {
                        onMessagesChange((prev) =>
                            prev.filter((m) => m.id !== tempId),
                        );
                        setInputValue(content);
                    }
                    // Turn off AI thinking on error
                    if (mentionedAI && onAIThinkingChange) {
                        onAIThinkingChange(false);
                    }
                    console.error('Failed to send message');
                }
            } catch (error) {
                // Revert optimistic update on error
                if (optimisticMessage) {
                    onMessagesChange((prev) =>
                        prev.filter((m) => m.id !== tempId),
                    );
                    setInputValue(content);
                }
                // Turn off AI thinking on error
                if (mentionedAI && onAIThinkingChange) {
                    onAIThinkingChange(false);
                }
                console.error('Failed to send message:', error);
            } finally {
                setIsSending(false);
            }
        },
        [
            inputValue,
            selectedFiles,
            isSending,
            currentUser,
            conversationId,
            onMessagesChange,
            onAIThinkingChange,
        ],
    );

    // Delete message with optimistic update
    const confirmDelete = useCallback(async () => {
        if (!deleteMessageId) return;

        const messageId = deleteMessageId;
        let originalMessages: Message[] = [];

        // Store original messages and optimistically remove
        onMessagesChange((prev) => {
            originalMessages = prev;
            return prev.filter((m) => m.id !== messageId);
        });

        // Close dialog immediately
        setDeleteMessageId(null);
        setIsDeleting(true);

        try {
            const response = await fetch(
                `/conversations/${conversationId}/messages/${messageId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN':
                            document.querySelector<HTMLMetaElement>(
                                'meta[name="csrf-token"]',
                            )?.content ?? '',
                    },
                },
            );

            if (!response.ok) {
                // Revert on error
                onMessagesChange(originalMessages);
                console.error('Failed to delete message');
            }
        } catch (error) {
            // Revert on error
            onMessagesChange(originalMessages);
            console.error('Failed to delete message:', error);
        } finally {
            setIsDeleting(false);
        }
    }, [deleteMessageId, conversationId, onMessagesChange]);

    return {
        isSending,
        isDeleting,
        inputValue,
        selectedFiles,
        deleteMessageId,
        setInputValue,
        setSelectedFiles,
        setDeleteMessageId,
        handleSubmit,
        confirmDelete,
    };
}
