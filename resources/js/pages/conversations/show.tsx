import { MessageInput } from '@/components/ui/message-input';
import { ScrollArea } from '@/components/ui/scroll-area';
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

    const messagesEndRef = useRef<HTMLDivElement>(null);
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

            setTypingUsers((prev) => {
                const next = new Map(prev);
                next.set(data.user.id, data.user.name);
                return next;
            });

            setTimeout(() => {
                setTypingUsers((prev) => {
                    const next = new Map(prev);
                    next.delete(data.user.id);
                    return next;
                });
            }, 3000);
        },
        [],
        'private',
    );

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

    // Send message
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if ((!inputValue.trim() && selectedFiles.length === 0) || isSending)
            return;

        const content = inputValue.trim();
        setInputValue('');
        setIsSending(true);

        try {
            const formData = new FormData();
            if (content) {
                formData.append('content', content);
            }
            if (replyingTo) {
                formData.append('parent_id', replyingTo.id.toString());
            }
            selectedFiles.forEach((file) => {
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
                    if (prev.some((m) => m.id === data.message.id)) {
                        return prev;
                    }
                    return [...prev, data.message];
                });
                setReplyingTo(null);
                setSelectedFiles([]);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    // Edit message
    const handleEdit = async () => {
        if (!editingMessage || !inputValue.trim()) return;

        setIsSending(true);
        try {
            const response = await fetch(
                `/conversations/${conversation.id}/messages/${editingMessage.id}`,
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
                    body: JSON.stringify({ content: inputValue.trim() }),
                },
            );

            if (response.ok) {
                const data = await response.json();
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === editingMessage.id ? data.message : m,
                    ),
                );
                setEditingMessage(null);
                setInputValue('');
            }
        } catch (error) {
            console.error('Failed to edit message:', error);
        } finally {
            setIsSending(false);
        }
    };

    // Delete message
    const confirmDelete = async () => {
        if (!deleteMessageId) return;

        setIsDeleting(true);
        try {
            const response = await fetch(
                `/conversations/${conversation.id}/messages/${deleteMessageId}`,
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

            if (response.ok) {
                setMessages((prev) =>
                    prev
                        .filter((m) => m.id !== deleteMessageId)
                        .map((m) => {
                            if (m.parent?.id === deleteMessageId) {
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
            }
        } catch (error) {
            console.error('Failed to delete message:', error);
        } finally {
            setIsDeleting(false);
            setDeleteMessageId(null);
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
                    name={conversation.name}
                    icon={conversation.icon}
                    color={conversation.color}
                    participantsCount={conversation.participants.length}
                    onShowMembers={() => setShowMembers(true)}
                />

                {/* Messages */}
                <div className="min-h-0 flex-1">
                    <ScrollArea className="h-full">
                        <div className="space-y-4 p-4">
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
                                            canEdit={message.is_mine}
                                            canDelete={message.is_mine}
                                        />
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>
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
