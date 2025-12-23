import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ChatLayout from '@/layouts/chat/chat-layout';
import { cn } from '@/lib/utils';
import type { Conversation, ConversationDetail, Message } from '@/types/chat';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { format, isToday, isYesterday } from 'date-fns';
import {
    ArrowLeft,
    Edit2,
    Loader2,
    MoreVertical,
    Paperclip,
    Reply,
    Send,
    Settings,
    Trash2,
    Users,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';

interface Props {
    conversations: Conversation[];
    conversation: ConversationDetail;
}

function formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    return format(date, 'HH:mm');
}

function formatDateSeparator(dateString: string): string {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
}

function shouldShowDateSeparator(currentMsg: Message, prevMsg?: Message): boolean {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const prevDate = new Date(prevMsg.created_at).toDateString();
    return currentDate !== prevDate;
}

interface MessageBubbleProps {
    message: Message;
    showAvatar: boolean;
    onReply?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    canEdit?: boolean;
    canDelete?: boolean;
}

function MessageBubble({
    message,
    showAvatar,
    onReply,
    onEdit,
    onDelete,
    canEdit,
    canDelete,
}: MessageBubbleProps) {
    const isMine = message.is_mine;

    return (
        <div className={cn('group flex items-end gap-2', isMine && 'flex-row-reverse')}>
            {/* Avatar */}
            {!isMine && showAvatar ? (
                <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={message.sender?.avatar} alt={message.sender?.name ?? 'User'} />
                    <AvatarFallback className="text-xs">
                        {message.sender?.name?.charAt(0).toUpperCase() ?? 'U'}
                    </AvatarFallback>
                </Avatar>
            ) : !isMine ? (
                <div className="w-8" />
            ) : null}

            {/* Message Content */}
            <div className={cn('flex max-w-[70%] flex-col gap-1', isMine && 'items-end')}>
                {/* Sender name (for group chats, non-own messages) */}
                {!isMine && showAvatar && message.sender && (
                    <span className="text-muted-foreground text-xs">{message.sender.name}</span>
                )}

                {/* Reply reference */}
                {message.parent && (
                    <div
                        className={cn(
                            'max-w-full truncate rounded border-l-2 px-2 py-1 text-xs',
                            isMine
                                ? 'border-primary-foreground/50 bg-primary/80 text-primary-foreground/80'
                                : 'border-muted-foreground/50 bg-muted/80 text-muted-foreground',
                        )}
                    >
                        <span className="font-medium">{message.parent.sender_name}</span>
                        <p className="truncate">{message.parent.content}</p>
                    </div>
                )}

                {/* Bubble */}
                <div className="relative flex items-center gap-1">
                    {/* Actions (visible on hover) */}
                    <div
                        className={cn(
                            'flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100',
                            isMine ? 'order-first' : 'order-last',
                        )}
                    >
                        <TooltipProvider>
                            {onReply && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={onReply}
                                        >
                                            <Reply className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Reply</TooltipContent>
                                </Tooltip>
                            )}

                            {(canEdit || canDelete) && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                            <MoreVertical className="h-3.5 w-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align={isMine ? 'end' : 'start'}>
                                        {canEdit && (
                                            <DropdownMenuItem onClick={onEdit}>
                                                <Edit2 className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                        )}
                                        {canDelete && (
                                            <DropdownMenuItem
                                                onClick={onDelete}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </TooltipProvider>
                    </div>

                    <div
                        className={cn(
                            'rounded-2xl px-4 py-2',
                            isMine
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-muted rounded-bl-md',
                        )}
                    >
                        <p className="wrap-break-word whitespace-pre-wrap text-sm">
                            {message.content}
                        </p>

                        {/* Attachments */}
                        {message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {message.attachments.map((attachment) => (
                                    <a
                                        key={attachment.id}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={cn(
                                            'flex items-center gap-2 rounded p-2 text-xs hover:underline',
                                            isMine
                                                ? 'bg-primary-foreground/10'
                                                : 'bg-background/50',
                                        )}
                                    >
                                        <Paperclip className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{attachment.original_name}</span>
                                        <span className="text-muted-foreground shrink-0">
                                            ({attachment.human_size})
                                        </span>
                                    </a>
                                ))}
                            </div>
                        )}

                        {/* Time & Status */}
                        <div
                            className={cn(
                                'mt-1 flex items-center gap-1 text-xs',
                                isMine ? 'text-primary-foreground/70' : 'text-muted-foreground',
                            )}
                        >
                            <span>{formatMessageTime(message.created_at)}</span>
                            {message.is_edited && <span>(edited)</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TypingIndicator({ names }: { names: string[] }) {
    if (names.length === 0) return null;

    const text =
        names.length === 1
            ? `${names[0]} is typing...`
            : names.length === 2
                ? `${names[0]} and ${names[1]} are typing...`
                : `${names[0]} and ${names.length - 1} others are typing...`;

    return (
        <div className="text-muted-foreground flex items-center gap-2 px-4 py-2 text-sm">
            <div className="flex gap-1">
                <span className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" />
                <span className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" />
                <span className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full" />
            </div>
            <span>{text}</span>
        </div>
    );
}

export default function ConversationShow({ conversations, conversation }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [messages, setMessages] = useState<Message[]>(conversation.messages);
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [typingUsers, setTypingUsers] = useState<Map<number, string>>(new Map());
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastTypingRef = useRef<number>(0);
    const hasMarkedAsReadRef = useRef(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Conversations', href: '/conversations' },
        { title: conversation.name, href: `/conversations/${conversation.id}` },
    ];

    // Scroll to bottom
    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    }, []);

    // Mark as read when component mounts
    useEffect(() => {
        if (!hasMarkedAsReadRef.current) {
            fetch(`/conversations/${conversation.id}/messages/read`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                },
            });
            hasMarkedAsReadRef.current = true;
        }
        scrollToBottom('instant');
    }, [conversation.id, scrollToBottom]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Real-time message events
    useEcho(
        `conversation.${conversation.id}`,
        '.message.sent',
        (data: { message: Message }) => {
            setMessages((prev) => [...prev, data.message]);
        },
        [],
        'private',
    );

    useEcho(
        `conversation.${conversation.id}`,
        '.message.edited',
        (data: { message: Message }) => {
            setMessages((prev) =>
                prev.map((m) => (m.id === data.message.id ? data.message : m)),
            );
        },
        [],
        'private',
    );

    useEcho(
        `conversation.${conversation.id}`,
        '.message.deleted',
        (data: { message_id: number }) => {
            setMessages((prev) => prev.filter((m) => m.id !== data.message_id));
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

            // Remove typing indicator after 3 seconds
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

    // Send typing indicator
    const sendTypingIndicator = useCallback(() => {
        const now = Date.now();
        if (now - lastTypingRef.current < 2000) return; // Throttle to every 2 seconds
        lastTypingRef.current = now;

        fetch(`/conversations/${conversation.id}/typing`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN':
                    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
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
        if ((!inputValue.trim() && selectedFiles.length === 0) || isSending) return;

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

            const response = await fetch(`/conversations/${conversation.id}/messages`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ??
                        '',
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setMessages((prev) => [...prev, data.message]);
                setReplyingTo(null);
                setSelectedFiles([]);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles(files);
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
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
                            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                                ?.content ?? '',
                    },
                    body: JSON.stringify({ content: inputValue.trim() }),
                },
            );

            if (response.ok) {
                const data = await response.json();
                setMessages((prev) =>
                    prev.map((m) => (m.id === editingMessage.id ? data.message : m)),
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
    const handleDelete = async (messageId: number) => {
        if (!confirm('Delete this message?')) return;

        try {
            const response = await fetch(
                `/conversations/${conversation.id}/messages/${messageId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN':
                            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                                ?.content ?? '',
                    },
                },
            );

            if (response.ok) {
                setMessages((prev) => prev.filter((m) => m.id !== messageId));
            }
        } catch (error) {
            console.error('Failed to delete message:', error);
        }
    };

    const startEditing = (message: Message) => {
        setEditingMessage(message);
        setInputValue(message.content);
        setReplyingTo(null);
        inputRef.current?.focus();
    };

    const cancelEditing = () => {
        setEditingMessage(null);
        setInputValue('');
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
                <div className="border-b p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" asChild className="md:hidden">
                                <Link href="/conversations">
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                            </Button>
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={conversation.avatar} alt={conversation.name} />
                                <AvatarFallback>
                                    {conversation.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="font-semibold">{conversation.name}</h2>
                                <p className="text-muted-foreground text-sm">
                                    {conversation.type === 'group'
                                        ? `${conversation.participants.length} members`
                                        : 'Direct message'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {conversation.type === 'group' && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Users className="h-5 w-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>View members</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}

                            {conversation.can_update && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>
                                            <Settings className="mr-2 h-4 w-4" />
                                            Settings
                                        </DropdownMenuItem>
                                        {conversation.can_leave && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        if (confirm('Leave this conversation?')) {
                                                            router.post(
                                                                `/conversations/${conversation.id}/leave`,
                                                            );
                                                        }
                                                    }}
                                                    className="text-destructive"
                                                >
                                                    Leave conversation
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                    <div className="mx-auto max-w-3xl space-y-4">
                        {messages.map((message, index) => {
                            const prevMessage = messages[index - 1];
                            const showDateSeparator = shouldShowDateSeparator(message, prevMessage);
                            const showAvatar =
                                !prevMessage ||
                                prevMessage.sender?.id !== message.sender?.id ||
                                showDateSeparator;

                            return (
                                <div key={message.id}>
                                    {showDateSeparator && (
                                        <div className="my-4 flex items-center gap-4">
                                            <div className="bg-border h-px flex-1" />
                                            <span className="text-muted-foreground text-xs">
                                                {formatDateSeparator(message.created_at)}
                                            </span>
                                            <div className="bg-border h-px flex-1" />
                                        </div>
                                    )}
                                    <MessageBubble
                                        message={message}
                                        showAvatar={showAvatar}
                                        onReply={() => {
                                            setReplyingTo(message);
                                            setEditingMessage(null);
                                            inputRef.current?.focus();
                                        }}
                                        onEdit={() => startEditing(message)}
                                        onDelete={() => handleDelete(message.id)}
                                        canEdit={message.is_mine}
                                        canDelete={message.is_mine || conversation.can_manage_participants}
                                    />
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {/* Typing indicator */}
                <TypingIndicator names={Array.from(typingUsers.values())} />

                {/* Reply/Edit indicator */}
                {(replyingTo || editingMessage) && (
                    <div className="bg-muted/50 flex items-center justify-between border-t px-4 py-2">
                        <div className="flex items-center gap-2 text-sm">
                            {editingMessage ? (
                                <>
                                    <Edit2 className="text-muted-foreground h-4 w-4" />
                                    <span>Editing message</span>
                                </>
                            ) : (
                                <>
                                    <Reply className="text-muted-foreground h-4 w-4" />
                                    <span>
                                        Replying to{' '}
                                        <span className="font-medium">
                                            {replyingTo?.sender?.name}
                                        </span>
                                    </span>
                                </>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setReplyingTo(null);
                                cancelEditing();
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                )}

                {/* Input */}
                <div className="border-t p-4">
                    <form
                        onSubmit={editingMessage ? (e) => { e.preventDefault(); handleEdit(); } : handleSubmit}
                        className="mx-auto max-w-3xl space-y-2"
                    >
                        {/* File preview */}
                        {selectedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="bg-muted flex items-center gap-2 rounded px-3 py-2 text-sm"
                                    >
                                        <Paperclip className="h-4 w-4" />
                                        <span className="max-w-50 truncate">{file.name}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5"
                                            onClick={() => removeFile(index)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFilesChange}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0"
                                onClick={handleFileSelect}
                                disabled={editingMessage !== null}
                            >
                                <Paperclip className="h-5 w-5" />
                            </Button>
                            <Input
                                ref={inputRef}
                                type="text"
                                placeholder={
                                    editingMessage ? 'Edit your message...' : 'Type a message...'
                                }
                                value={inputValue}
                                onChange={(e) => handleInputChange(e.target.value)}
                                className="flex-1"
                                disabled={isSending}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={(!inputValue.trim() && selectedFiles.length === 0) || isSending}
                                className="shrink-0"
                            >
                                {isSending ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </ChatLayout>
    );
}
