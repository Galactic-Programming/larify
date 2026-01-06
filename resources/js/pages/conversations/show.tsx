import { MessageInput } from '@/components/ui/message-input';
import { Spinner } from '@/components/ui/spinner';
import ChatLayout from '@/layouts/chat/chat-layout';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { Conversation, ConversationDetail, Message } from '@/types/chat';
import { Head, usePage } from '@inertiajs/react';
import { format, isToday, isYesterday } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
    AIThinkingBubble,
    ConversationHeader,
    DeleteMessageDialog,
    MembersSheet,
    MentionAutocomplete,
    MessageBubble,
    TypingIndicator,
} from './components';
import { useConversationRealtime, useMessageActions } from './hooks';

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

    // Message state
    const [messages, setMessages] = useState<Message[]>(conversation.messages);
    const [typingUsers, setTypingUsers] = useState<Map<number, string>>(
        new Map(),
    );
    const [isAIThinking, setIsAIThinking] = useState(false);

    // UI state
    const [showMembers, setShowMembers] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(
        conversation.messages.length >= 50,
    );

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const lastTypingRef = useRef<number>(0);
    const hasMarkedAsReadRef = useRef(false);

    // Message actions hook
    const {
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
    } = useMessageActions({
        conversationId: conversation.id,
        currentUser: auth.user,
        onMessagesChange: setMessages,
    });

    // Real-time handlers
    const handleMessageReceived = useCallback(
        (message: Message) => {
            setMessages((prev) => {
                if (prev.some((m) => m.id === message.id)) {
                    return prev;
                }
                return [...prev, message];
            });
        },
        [],
    );

    const handleMessageDeleted = useCallback((messageId: number) => {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
    }, []);

    const handleTypingUser = useCallback((userId: number, userName: string) => {
        setTypingUsers((prev) => {
            const next = new Map(prev);
            next.set(userId, userName);
            return next;
        });
    }, []);

    const handleTypingUserClear = useCallback((userId: number) => {
        setTypingUsers((prev) => {
            const next = new Map(prev);
            next.delete(userId);
            return next;
        });
    }, []);

    const handleMessagesRead = useCallback(
        (readerId: number, readAt: string) => {
            setMessages((prev) =>
                prev.map((msg) => {
                    if (
                        msg.is_mine &&
                        !msg.is_read &&
                        new Date(msg.created_at) <= new Date(readAt)
                    ) {
                        return { ...msg, is_read: true };
                    }
                    return msg;
                }),
            );
        },
        [],
    );

    // Handle AI thinking state changes with active count support
    // This correctly handles concurrent AI requests from multiple users
    const handleAIThinkingChange = useCallback((isThinking: boolean, _activeCount?: number) => {
        setIsAIThinking(isThinking);
    }, []);

    // Real-time hook
    const { sendTypingIndicator, markMessagesAsRead } = useConversationRealtime({
        conversationId: conversation.id,
        currentUserId: auth.user.id,
        onMessageReceived: handleMessageReceived,
        onMessageDeleted: handleMessageDeleted,
        onTypingUser: handleTypingUser,
        onTypingUserClear: handleTypingUserClear,
        onMessagesRead: handleMessagesRead,
        onAIThinkingChange: handleAIThinkingChange,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Conversations', href: '/conversations' },
        { title: conversation.name, href: `/conversations/${conversation.id}` },
    ];

    // Scroll to bottom - sử dụng scrollTop thay vì scrollIntoView để tránh layout shift
    const scrollToBottom = useCallback(
        (behavior: ScrollBehavior = 'smooth') => {
            const container = messagesContainerRef.current;
            if (container) {
                if (behavior === 'instant') {
                    container.scrollTop = container.scrollHeight;
                } else {
                    container.scrollTo({
                        top: container.scrollHeight,
                        behavior: 'smooth',
                    });
                }
            }
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

    // Mark as read when component mounts
    useEffect(() => {
        if (!hasMarkedAsReadRef.current) {
            markMessagesAsRead();
            hasMarkedAsReadRef.current = true;
        }
        scrollToBottom('instant');
    }, [conversation.id, scrollToBottom, markMessagesAsRead]);

    // Auto mark as read when new messages arrive from others
    const lastMessageRef = useRef<number | null>(null);
    useEffect(() => {
        if (messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];

        // Only trigger if it's a new message from someone else
        if (
            lastMessage &&
            lastMessage.id !== lastMessageRef.current &&
            !lastMessage.is_mine &&
            !lastMessage.is_ai
        ) {
            lastMessageRef.current = lastMessage.id;
            // Mark messages as read when we receive a new message from others
            markMessagesAsRead();
        }
    }, [messages, markMessagesAsRead]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Throttled typing indicator
    const handleInputChange = useCallback(
        (value: string) => {
            setInputValue(value);
            if (value.trim()) {
                const now = Date.now();
                if (now - lastTypingRef.current >= 2000) {
                    lastTypingRef.current = now;
                    sendTypingIndicator();
                }
            }
        },
        [setInputValue, sendTypingIndicator],
    );

    // Handle mention selection from autocomplete
    const handleMentionSelect = useCallback(
        (participant: { id: number; name: string }, mentionStart: number) => {
            const beforeMention = inputValue.slice(0, mentionStart);
            // Find end of current mention query (until space or end)
            const afterMentionStart = inputValue.slice(mentionStart + 1);
            const spaceIndex = afterMentionStart.indexOf(' ');
            const afterMention =
                spaceIndex >= 0 ? afterMentionStart.slice(spaceIndex) : '';

            const mentionText = `@${participant.name}`;
            const newValue =
                beforeMention + mentionText + (afterMention || ' ');

            setInputValue(newValue);
        },
        [inputValue, setInputValue],
    );

    // Scroll to a specific message (for search results)
    const scrollToMessage = useCallback((message: Message) => {
        const messageElement = document.querySelector(
            `[data-message-id="${message.id}"]`,
        );
        if (messageElement) {
            messageElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
            // Highlight the message briefly
            messageElement.classList.add(
                'bg-yellow-100',
                'dark:bg-yellow-900/30',
            );
            setTimeout(() => {
                messageElement.classList.remove(
                    'bg-yellow-100',
                    'dark:bg-yellow-900/30',
                );
            }, 2000);
        }
    }, []);

    return (
        <ChatLayout
            breadcrumbs={breadcrumbs}
            conversations={conversations}
            activeConversationId={conversation.id}
            showContent={true}
        >
            <Head title={conversation.name} />

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
                    className="h-full overflow-y-auto overscroll-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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

                        <AnimatePresence mode="popLayout" initial={false}>
                            {messages.map((message, idx) => {
                                const prevMessage = messages[idx - 1];
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
                                            <motion.div
                                                initial={{
                                                    opacity: 0,
                                                    scale: 0.95,
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: 1,
                                                }}
                                                className="my-4 flex items-center gap-4"
                                            >
                                                <div className="h-px flex-1 bg-border" />
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDateSeparator(
                                                        message.created_at,
                                                    )}
                                                </span>
                                                <div className="h-px flex-1 bg-border" />
                                            </motion.div>
                                        )}
                                        <MessageBubble
                                            message={message}
                                            showAvatar={showAvatar}
                                            onDelete={() =>
                                                setDeleteMessageId(
                                                    message.id,
                                                )
                                            }
                                            canDelete={message.can_delete}
                                            currentUserId={auth.user.id}
                                        />
                                    </div>
                                );
                            })}
                        </AnimatePresence>

                        {/* AI Thinking Bubble */}
                        {isAIThinking && <AIThinkingBubble />}

                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>

            {/* Typing indicator */}
            <TypingIndicator names={Array.from(typingUsers.values())} />

            {/* Input */}
            <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="relative">
                    <MentionAutocomplete
                        participants={conversation.participants.filter(
                            (p) => p.id !== auth.user.id,
                        )}
                        inputValue={inputValue}
                        onSelect={handleMentionSelect}
                    />
                    <MessageInput
                        placeholder="Type a message... Use @ to mention"
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        isGenerating={isSending}
                        allowAttachments={true}
                        files={
                            selectedFiles.length > 0 ? selectedFiles : null
                        }
                        setFiles={(files) => {
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
