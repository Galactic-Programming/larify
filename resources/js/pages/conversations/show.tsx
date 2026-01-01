import { MessageInput } from '@/components/ui/message-input';
// import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import ChatLayout from '@/layouts/chat/chat-layout';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Conversation, ConversationDetail, Message } from '@/types/chat';
import { Head, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { format, isToday, isYesterday } from 'date-fns';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

import {
    ConversationHeader,
    DeleteMessageDialog,
    MembersSheet,
    MessageBubble,
    ReplyEditIndicator,
    TypingIndicator,
} from './components';

interface Props {
    conversations: Conversation[];
    conversation: ConversationDetail;
}

function formatDateSeparator(dateString: string): string {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
}

function shouldShowDateSeparator(
    currentMsg: Message,
    prevMsg?: Message,
): boolean {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const prevDate = new Date(prevMsg.created_at).toDateString();
    return currentDate !== prevDate;
}

export default function ConversationShow({
    conversations,
    conversation,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const [messages, setMessages] = useState<Message[]>(conversation.messages);
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [typingUsers, setTypingUsers] = useState<Map<number, string>>(
        new Map(),
    );
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [deleteMessageId, setDeleteMessageId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(
        conversation.messages.length >= 50,
    );

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const typingTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());
    const lastTypingRef = useRef<number>(0);
    const hasMarkedAsReadRef = useRef(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Conversations', href: '/conversations' },
        { title: conversation.name, href: `/conversations/${conversation.id}` },
    ];

    // Scroll to bottom
    const scrollToBottom = useCallback(
        (behavior: ScrollBehavior = 'smooth') => {
            messagesEndRef.current?.scrollIntoView({ behavior });
        },
        [],
    );

    // Load more (older) messages
    const loadMoreMessages = useCallback(async () => {
        if (isLoadingMore || !hasMoreMessages || messages.length === 0) return;

        const oldestMessage = messages[0];
        const container = messagesContainerRef.current;
        const previousScrollHeight = container?.scrollHeight ?? 0;

        setIsLoadingMore(true);

        try {
            const response = await fetch(
                `/api/conversations/${conversation.id}/messages?before=${oldestMessage.id}&limit=50`,
                {
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN':
                            document.querySelector<HTMLMetaElement>(
                                'meta[name="csrf-token"]',
                            )?.content ?? '',
                    },
                },
            );

            if (!response.ok) throw new Error('Failed to load messages');

            const data = await response.json();
            const olderMessages: Message[] = data.messages;

            if (olderMessages.length > 0) {
                setMessages((prev) => [...olderMessages, ...prev]);
                setHasMoreMessages(data.has_more);

                // Maintain scroll position after prepending messages
                requestAnimationFrame(() => {
                    if (container) {
                        const newScrollHeight = container.scrollHeight;
                        container.scrollTop =
                            newScrollHeight - previousScrollHeight;
                    }
                });
            } else {
                setHasMoreMessages(false);
            }
        } catch (error) {
            console.error('Failed to load more messages:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [conversation.id, isLoadingMore, hasMoreMessages, messages]);

    // Handle scroll to load more messages
    const handleScroll = useCallback(
        (event: React.UIEvent<HTMLDivElement>) => {
            const target = event.currentTarget;
            // Load more when scrolled near the top (within 100px)
            if (target.scrollTop < 100 && hasMoreMessages && !isLoadingMore) {
                loadMoreMessages();
            }
        },
        [hasMoreMessages, isLoadingMore, loadMoreMessages],
    );

    // Function to mark messages as read and broadcast read receipt
    const markMessagesAsRead = useCallback(() => {
        fetch(`/conversations/${conversation.id}/messages/read`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN':
                    document.querySelector<HTMLMetaElement>(
                        'meta[name="csrf-token"]',
                    )?.content ?? '',
            },
        });
    }, [conversation.id]);

    // Mark as read when component mounts
    useEffect(() => {
        if (!hasMarkedAsReadRef.current) {
            markMessagesAsRead();
            hasMarkedAsReadRef.current = true;
        }
        scrollToBottom('instant');
    }, [conversation.id, scrollToBottom, markMessagesAsRead]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Real-time message events
    useEcho(
        `conversation.${conversation.id}`,
        '.message.sent',
        (data: { message: Message }) => {
            if (data.message.sender?.id !== auth.user.id) {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === data.message.id)) {
                        return prev;
                    }
                    return [...prev, data.message];
                });
                markMessagesAsRead();
            }
        },
        [auth.user.id, markMessagesAsRead],
        'private',
    );

    useEcho(
        `conversation.${conversation.id}`,
        '.message.edited',
        (data: {
            message: {
                id: number;
                content: string;
                is_edited: boolean;
                edited_at: string;
            };
        }) => {
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === data.message.id
                        ? {
                            ...m,
                            content: data.message.content,
                            is_edited: data.message.is_edited,
                            edited_at: data.message.edited_at,
                        }
                        : m,
                ),
            );
        },
        [],
        'private',
    );

    useEcho(
        `conversation.${conversation.id}`,
        '.message.deleted',
        (data: { message_id: number }) => {
            setMessages((prev) =>
                prev
                    .filter((m) => m.id !== data.message_id)
                    .map((m) => {
                        if (m.parent?.id === data.message_id) {
                            return {
                                ...m,
                                parent: {
                                    ...m.parent,
                                    content: null,
                                    sender_name: null,
                                    is_deleted: true,
                                },
                            };
                        }
                        return m;
                    }),
            );
        },
        [],
        'private',
    );

    useEcho(
        `conversation.${conversation.id}`,
        '.user.typing',
        (data: { user: { id: number; name: string } }) => {
            if (data.user.id === auth.user.id) return;

            // Clear existing timeout for this user
            const existingTimeout = typingTimeoutsRef.current.get(data.user.id);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }

            setTypingUsers((prev) => {
                const next = new Map(prev);
                next.set(data.user.id, data.user.name);
                return next;
            });

            // Set new timeout and store reference
            const timeoutId = setTimeout(() => {
                setTypingUsers((prev) => {
                    const next = new Map(prev);
                    next.delete(data.user.id);
                    return next;
                });
                typingTimeoutsRef.current.delete(data.user.id);
            }, 3000);

            typingTimeoutsRef.current.set(data.user.id, timeoutId);
        },
        [],
        'private',
    );

    // Cleanup typing timeouts on unmount
    useEffect(() => {
        return () => {
            typingTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
            typingTimeoutsRef.current.clear();
        };
    }, []);

    useEcho(
        `conversation.${conversation.id}`,
        '.messages.read',
        (data: { reader_id: number; read_at: string }) => {
            if (data.reader_id === auth.user.id) return;

            setMessages((prev) =>
                prev.map((msg) => {
                    if (
                        msg.is_mine &&
                        !msg.is_read &&
                        new Date(msg.created_at) <= new Date(data.read_at)
                    ) {
                        return { ...msg, is_read: true };
                    }
                    return msg;
                }),
            );
        },
        [],
        'private',
    );

    // Send typing indicator
    const sendTypingIndicator = useCallback(() => {
        const now = Date.now();
        if (now - lastTypingRef.current < 2000) return;
        lastTypingRef.current = now;

        fetch(`/conversations/${conversation.id}/typing`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN':
                    document.querySelector<HTMLMetaElement>(
                        'meta[name="csrf-token"]',
                    )?.content ?? '',
            },
        });
    }, [conversation.id]);

    const handleInputChange = (value: string) => {
        setInputValue(value);
        if (value.trim()) {
            sendTypingIndicator();
        }
    };

    // Generate a temporary ID for optimistic messages
    const generateTempId = () => -Date.now();

    // Send message with optimistic update
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if ((!inputValue.trim() && selectedFiles.length === 0) || isSending)
            return;

        const content = inputValue.trim();
        const tempId = generateTempId();
        const currentReplyingTo = replyingTo;
        const currentFiles = [...selectedFiles];

        // Create optimistic message (only if text-only, files need server processing)
        const optimisticMessage: Message | null =
            currentFiles.length === 0
                ? {
                    id: tempId,
                    content,
                    is_edited: false,
                    created_at: new Date().toISOString(),
                    sender: {
                        id: auth.user.id,
                        name: auth.user.name,
                        avatar: auth.user.avatar,
                    },
                    is_mine: true,
                    is_read: false,
                    parent: currentReplyingTo
                        ? {
                            id: currentReplyingTo.id,
                            content: currentReplyingTo.content,
                            sender_name:
                                currentReplyingTo.sender?.name ?? null,
                        }
                        : undefined,
                    attachments: [],
                }
                : null;

        // Optimistically add the message
        if (optimisticMessage) {
            setMessages((prev) => [...prev, optimisticMessage]);
        }

        // Clear input immediately for better UX
        setInputValue('');
        setReplyingTo(null);
        setSelectedFiles([]);
        setIsSending(true);

        try {
            const formData = new FormData();
            if (content) {
                formData.append('content', content);
            }
            if (currentReplyingTo) {
                formData.append('parent_id', currentReplyingTo.id.toString());
            }
            currentFiles.forEach((file) => {
                formData.append('attachments[]', file);
            });

            const response = await fetch(
                `/conversations/${conversation.id}/messages`,
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN':
                            document.querySelector<HTMLMetaElement>(
                                'meta[name="csrf-token"]',
                            )?.content ?? '',
                    },
                    body: formData,
                },
            );

            if (response.ok) {
                const data = await response.json();
                setMessages((prev) => {
                    // Replace optimistic message with real message
                    if (optimisticMessage) {
                        return prev.map((m) =>
                            m.id === tempId ? data.message : m,
                        );
                    }
                    // For file uploads, just add the message if not already present
                    if (prev.some((m) => m.id === data.message.id)) {
                        return prev;
                    }
                    return [...prev, data.message];
                });
            } else {
                // Revert optimistic update on error
                if (optimisticMessage) {
                    setMessages((prev) => prev.filter((m) => m.id !== tempId));
                    setInputValue(content);
                    setReplyingTo(currentReplyingTo);
                }
                console.error('Failed to send message');
            }
        } catch (error) {
            // Revert optimistic update on error
            if (optimisticMessage) {
                setMessages((prev) => prev.filter((m) => m.id !== tempId));
                setInputValue(content);
                setReplyingTo(currentReplyingTo);
            }
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    // Edit message with optimistic update
    const handleEdit = async () => {
        if (!editingMessage || !inputValue.trim()) return;

        const newContent = inputValue.trim();
        const originalContent = editingMessage.content;
        const messageId = editingMessage.id;

        // Optimistically update the message
        setMessages((prev) =>
            prev.map((m) =>
                m.id === messageId
                    ? {
                        ...m,
                        content: newContent,
                        is_edited: true,
                        edited_at: new Date().toISOString(),
                    }
                    : m,
            ),
        );

        // Clear editing state immediately
        setEditingMessage(null);
        setInputValue('');
        setIsSending(true);

        try {
            const response = await fetch(
                `/conversations/${conversation.id}/messages/${messageId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN':
                            document.querySelector<HTMLMetaElement>(
                                'meta[name="csrf-token"]',
                            )?.content ?? '',
                    },
                    body: JSON.stringify({ content: newContent }),
                },
            );

            if (response.ok) {
                const data = await response.json();
                // Update with server response (in case of any differences)
                setMessages((prev) =>
                    prev.map((m) => (m.id === messageId ? data.message : m)),
                );
            } else {
                // Revert on error
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === messageId
                            ? { ...m, content: originalContent, is_edited: editingMessage.is_edited }
                            : m,
                    ),
                );
                console.error('Failed to edit message');
            }
        } catch (error) {
            // Revert on error
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === messageId
                        ? { ...m, content: originalContent, is_edited: editingMessage.is_edited }
                        : m,
                ),
            );
            console.error('Failed to edit message:', error);
        } finally {
            setIsSending(false);
        }
    };

    // Delete message with optimistic update
    const confirmDelete = async () => {
        if (!deleteMessageId) return;

        const messageId = deleteMessageId;

        // Store original messages for potential rollback
        const originalMessages = messages;

        // Optimistically remove the message
        setMessages((prev) =>
            prev
                .filter((m) => m.id !== messageId)
                .map((m) => {
                    if (m.parent?.id === messageId) {
                        return {
                            ...m,
                            parent: {
                                ...m.parent,
                                content: null,
                                sender_name: null,
                                is_deleted: true,
                            },
                        };
                    }
                    return m;
                }),
        );

        // Close dialog immediately
        setDeleteMessageId(null);
        setIsDeleting(true);

        try {
            const response = await fetch(
                `/conversations/${conversation.id}/messages/${messageId}`,
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
                setMessages(originalMessages);
                console.error('Failed to delete message');
            }
        } catch (error) {
            // Revert on error
            setMessages(originalMessages);
            console.error('Failed to delete message:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const startEditing = (message: Message) => {
        setEditingMessage(message);
        setInputValue(message.content);
        setReplyingTo(null);
    };

    const cancelEditing = () => {
        setEditingMessage(null);
        setInputValue('');
    };

    const handleCancelReplyEdit = () => {
        setReplyingTo(null);
        cancelEditing();
    };

    // Scroll to a specific message (for search results)
    const scrollToMessage = useCallback((message: Message) => {
        // Find the message element and scroll to it
        const messageElement = document.querySelector(
            `[data-message-id="${message.id}"]`,
        );
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the message briefly
            messageElement.classList.add('bg-yellow-100', 'dark:bg-yellow-900/30');
            setTimeout(() => {
                messageElement.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/30');
            }, 2000);
        }
    }, []);

    // Toggle reaction on a message
    const handleReaction = useCallback(
        async (messageId: number, emoji: string) => {
            try {
                const response = await fetch(`/messages/${messageId}/reactions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN':
                            document.querySelector<HTMLMetaElement>(
                                'meta[name="csrf-token"]',
                            )?.content ?? '',
                    },
                    body: JSON.stringify({ emoji }),
                });

                if (response.ok) {
                    const data = await response.json();
                    // Update message reactions
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === messageId
                                ? { ...m, reactions: data.reactions }
                                : m,
                        ),
                    );
                } else {
                    console.error('Failed to toggle reaction');
                }
            } catch (error) {
                console.error('Failed to toggle reaction:', error);
            }
        },
        [],
    );

    return (
        <ChatLayout
            breadcrumbs={breadcrumbs}
            conversations={conversations}
            activeConversationId={conversation.id}
            showContent={true}
        >
            <Head title={conversation.name} />
            <div className="flex h-full flex-1 flex-col overflow-hidden">
                {/* Header */}
                <ConversationHeader
                    conversationId={conversation.id}
                    name={conversation.name}
                    icon={conversation.icon}
                    color={conversation.color}
                    participantsCount={conversation.participants.length}
                    onShowMembers={() => setShowMembers(true)}
                    onSelectSearchResult={scrollToMessage}
                />

                {/* Messages */}
                <div className="min-h-0 flex-1">
                    <div
                        ref={messagesContainerRef}
                        onScroll={handleScroll}
                        className="h-full overflow-y-auto"
                    >
                        <div className="space-y-4 p-4">
                            {/* Load more indicator */}
                            {hasMoreMessages && (
                                <div className="flex justify-center py-2">
                                    {isLoadingMore ? (
                                        <Spinner className="h-5 w-5" />
                                    ) : (
                                        <button
                                            onClick={loadMoreMessages}
                                            className="text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            Load older messages
                                        </button>
                                    )}
                                </div>
                            )}

                            {messages.map((message, index) => {
                                const prevMessage = messages[index - 1];
                                const showDateSeparator =
                                    shouldShowDateSeparator(
                                        message,
                                        prevMessage,
                                    );
                                const showAvatar =
                                    !prevMessage ||
                                    prevMessage.sender?.id !==
                                    message.sender?.id ||
                                    showDateSeparator;

                                return (
                                    <div key={message.id}>
                                        {showDateSeparator && (
                                            <div className="my-4 flex items-center gap-4">
                                                <div className="h-px flex-1 bg-border" />
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDateSeparator(
                                                        message.created_at,
                                                    )}
                                                </span>
                                                <div className="h-px flex-1 bg-border" />
                                            </div>
                                        )}
                                        <MessageBubble
                                            message={message}
                                            showAvatar={showAvatar}
                                            onReply={() => {
                                                setReplyingTo(message);
                                                setEditingMessage(null);
                                            }}
                                            onEdit={() => startEditing(message)}
                                            onDelete={() =>
                                                setDeleteMessageId(message.id)
                                            }
                                            onReaction={(emoji) =>
                                                handleReaction(message.id, emoji)
                                            }
                                            canEdit={message.is_mine}
                                            canDelete={message.is_mine}
                                        />
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                </div>

                {/* Typing indicator */}
                <TypingIndicator names={Array.from(typingUsers.values())} />

                {/* Reply/Edit indicator */}
                <ReplyEditIndicator
                    replyingTo={replyingTo}
                    editingMessage={editingMessage}
                    onCancel={handleCancelReplyEdit}
                />

                {/* Input */}
                <div className="border-t p-4">
                    <form
                        onSubmit={
                            editingMessage
                                ? (e) => {
                                    e.preventDefault();
                                    handleEdit();
                                }
                                : handleSubmit
                        }
                    >
                        <MessageInput
                            placeholder={
                                editingMessage
                                    ? 'Edit your message...'
                                    : 'Type a message...'
                            }
                            value={inputValue}
                            onChange={(e) => handleInputChange(e.target.value)}
                            isGenerating={isSending}
                            allowAttachments={true}
                            files={
                                editingMessage
                                    ? null
                                    : selectedFiles.length > 0
                                        ? selectedFiles
                                        : null
                            }
                            setFiles={(files) => {
                                if (editingMessage) return;
                                if (typeof files === 'function') {
                                    setSelectedFiles((prev) => {
                                        const result = files(
                                            prev.length > 0 ? prev : null,
                                        );
                                        return result ?? [];
                                    });
                                } else {
                                    setSelectedFiles(files ?? []);
                                }
                            }}
                            submitOnEnter={true}
                            enableInterrupt={false}
                        />
                    </form>
                </div>
            </div>

            {/* Delete Message Confirmation Dialog */}
            <DeleteMessageDialog
                open={deleteMessageId !== null}
                onOpenChange={(open) => !open && setDeleteMessageId(null)}
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
            />

            {/* Members Sheet */}
            <MembersSheet
                open={showMembers}
                onOpenChange={setShowMembers}
                participants={conversation.participants}
                currentUserId={auth.user.id}
            />
        </ChatLayout>
    );
}
