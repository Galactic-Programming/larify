import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';
import type { Conversation } from '@/types/chat';
import { Link, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { formatDistanceToNow } from 'date-fns';
import * as LucideIcons from 'lucide-react';
import { MessagesSquare, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export interface ChatSidebarProps {
    conversations: Conversation[];
    activeConversationId?: number;
    className?: string;
}

function formatTime(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: false });
}

// Dynamic icon component based on icon name
function ProjectIcon({ icon, className }: { icon?: string; className?: string }) {
    if (!icon) {
        return <MessagesSquare className={className} />;
    }

    // Convert kebab-case to PascalCase for lucide-react
    const iconName = icon
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

    const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];

    if (!IconComponent) {
        return <MessagesSquare className={className} />;
    }

    return <IconComponent className={className} />;
}

interface ConversationItemProps {
    conversation: Conversation;
    isActive?: boolean;
}

function ConversationItem({ conversation, isActive }: ConversationItemProps) {
    const lastMessagePreview =
        conversation.last_message?.content ?? 'No messages yet';
    const hasUnread = conversation.unread_count > 0;

    return (
        <Link
            href={`/conversations/${conversation.id}`}
            className={cn(
                'flex items-center gap-3 rounded-lg p-3 transition-colors',
                isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted',
            )}
        >
            <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback
                    className="text-sm text-white"
                    style={{ backgroundColor: conversation.color }}
                >
                    <ProjectIcon icon={conversation.icon} className="h-5 w-5" />
                </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                        {conversation.name}
                    </span>
                    {conversation.last_message_at && (
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatTime(conversation.last_message_at)}
                        </span>
                    )}
                </div>
                <div className="flex items-center justify-between gap-2">
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                        {lastMessagePreview}
                    </p>
                    {hasUnread && (
                        <Badge
                            variant="default"
                            className="h-5 shrink-0 rounded-full px-1.5 text-[10px]"
                        >
                            {conversation.unread_count > 9
                                ? '9+'
                                : conversation.unread_count}
                        </Badge>
                    )}
                </div>
            </div>
        </Link>
    );
}

function EmptyState({ searchQuery }: { searchQuery: string }) {
    if (searchQuery) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                    No results for "{searchQuery}"
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessagesSquare className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="mb-1 text-sm text-muted-foreground">
                No team conversations yet
            </p>
            <p className="text-xs text-muted-foreground/70">
                Join a project with team members to start chatting
            </p>
        </div>
    );
}

export function ChatSidebar({
    conversations: initialConversations,
    activeConversationId,
    className,
}: ChatSidebarProps) {
    const { auth } = usePage<SharedData>().props;
    const [conversations, setConversations] =
        useState<Conversation[]>(initialConversations);
    const [searchQuery, setSearchQuery] = useState('');

    // Real-time: Listen for message updates to refresh last_message
    useEcho(
        `user.${auth.user.id}.conversations`,
        '.message.sent',
        (data: {
            conversation_id: number;
            message: Conversation['last_message'];
        }) => {
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.id === data.conversation_id
                        ? {
                            ...conv,
                            last_message: data.message,
                            last_message_at: data.message?.created_at,
                            unread_count:
                                conv.id === activeConversationId
                                    ? conv.unread_count
                                    : conv.unread_count + 1,
                        }
                        : conv,
                ),
            );
        },
        [auth.user.id, activeConversationId],
        'private',
    );

    // Real-time: Listen for new conversations (when user is added to a project)
    useEcho(
        `user.${auth.user.id}.conversations`,
        '.conversation.added',
        (data: { conversation: Conversation }) => {
            setConversations((prev) => {
                // Check if conversation already exists to prevent duplicates
                if (prev.some((conv) => conv.id === data.conversation.id)) {
                    return prev;
                }
                // Add new conversation at the top
                return [data.conversation, ...prev];
            });
        },
        [auth.user.id],
        'private',
    );

    // Real-time: Listen for removed conversations (when user is removed from a project)
    useEcho(
        `user.${auth.user.id}.conversations`,
        '.conversation.removed',
        (data: { conversation_id: number }) => {
            setConversations((prev) =>
                prev.filter((conv) => conv.id !== data.conversation_id),
            );
        },
        [auth.user.id],
        'private',
    );

    // Reset unread count when viewing a conversation
    useEffect(() => {
        if (activeConversationId) {
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.id === activeConversationId
                        ? { ...conv, unread_count: 0 }
                        : conv,
                ),
            );
        }
    }, [activeConversationId]);

    // Update conversations when props change
    useEffect(() => {
        setConversations(initialConversations);
    }, [initialConversations]);

    const filteredConversations = useMemo(() => {
        if (!searchQuery) return conversations;
        return conversations.filter((conversation) =>
            conversation.name.toLowerCase().includes(searchQuery.toLowerCase()),
        );
    }, [conversations, searchQuery]);

    return (
        <div className={cn('flex flex-col bg-background', className)}>
            {/* Header */}
            <div className="shrink-0 space-y-3 border-b p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Team Chat</h2>
                    <Badge variant="secondary" className="text-xs">
                        {conversations.length} {conversations.length === 1 ? 'project' : 'projects'}
                    </Badge>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 pl-9 text-sm"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
                <div className="space-y-1 p-2">
                    {filteredConversations.length > 0 ? (
                        filteredConversations.map((conversation) => (
                            <ConversationItem
                                key={conversation.id}
                                conversation={conversation}
                                isActive={
                                    conversation.id === activeConversationId
                                }
                            />
                        ))
                    ) : (
                        <EmptyState searchQuery={searchQuery} />
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
