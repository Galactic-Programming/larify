import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { Conversation, ConversationType } from '@/types/chat';
import type { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquarePlus, MessagesSquare, Search, User, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

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

interface ConversationItemProps {
    conversation: Conversation;
    isActive?: boolean;
}

function ConversationItem({ conversation, isActive }: ConversationItemProps) {
    const lastMessagePreview = conversation.last_message?.content ?? 'No messages yet';
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
                <AvatarImage src={conversation.avatar} alt={conversation.name} />
                <AvatarFallback className="text-sm">
                    {conversation.name.charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{conversation.name}</span>
                    {conversation.last_message_at && (
                        <span className="text-muted-foreground shrink-0 text-[10px]">
                            {formatTime(conversation.last_message_at)}
                        </span>
                    )}
                </div>
                <div className="flex items-center justify-between gap-2">
                    <p className="text-muted-foreground line-clamp-1 text-xs">
                        {lastMessagePreview}
                    </p>
                    {hasUnread && (
                        <Badge variant="default" className="h-5 shrink-0 rounded-full px-1.5 text-[10px]">
                            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                        </Badge>
                    )}
                </div>
            </div>
        </Link>
    );
}

function EmptyState({ type, searchQuery }: { type: ConversationType | 'all'; searchQuery: string }) {
    if (searchQuery) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="text-muted-foreground mb-3 h-8 w-8" />
                <p className="text-muted-foreground text-sm">No results for "{searchQuery}"</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessagesSquare className="text-muted-foreground mb-3 h-8 w-8" />
            <p className="text-muted-foreground text-sm">
                {type === 'direct'
                    ? 'No direct messages'
                    : type === 'group'
                        ? 'No group chats'
                        : 'No conversations yet'}
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
    const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
    const [activeTab, setActiveTab] = useState<'all' | ConversationType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Real-time: Listen for new conversations
    useEcho(
        `user.${auth.user.id}.conversations`,
        '.conversation.created',
        (data: { conversation: Conversation }) => {
            setConversations((prev) => [data.conversation, ...prev]);
        },
        [auth.user.id],
        'private',
    );

    // Real-time: Listen for message updates to refresh last_message
    useEcho(
        `user.${auth.user.id}.conversations`,
        '.message.sent',
        (data: { conversation_id: number; message: Conversation['last_message'] }) => {
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.id === data.conversation_id
                        ? {
                            ...conv,
                            last_message: data.message,
                            last_message_at: data.message?.created_at,
                            unread_count: conv.id === activeConversationId
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

    const filteredConversations = useMemo(() => {
        return conversations.filter((conversation) => {
            if (activeTab !== 'all' && conversation.type !== activeTab) {
                return false;
            }
            if (searchQuery) {
                return conversation.name.toLowerCase().includes(searchQuery.toLowerCase());
            }
            return true;
        });
    }, [conversations, activeTab, searchQuery]);

    const counts = useMemo(() => ({
        all: conversations.length,
        direct: conversations.filter((c) => c.type === 'direct').length,
        group: conversations.filter((c) => c.type === 'group').length,
    }), [conversations]);

    return (
        <div className={cn('flex flex-col bg-background', className)}>
            {/* Header */}
            <div className="shrink-0 space-y-3 border-b p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Messages</h2>
                    <Button size="sm" variant="ghost" asChild>
                        <Link href="/conversations/create">
                            <MessageSquarePlus className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                    <Input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 pl-9 text-sm"
                    />
                </div>

                {/* Tabs */}
                <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as typeof activeTab)}
                    className="w-full"
                >
                    <TabsList className="w-full">
                        <TabsTrigger value="all" className="flex-1 gap-1 text-xs">
                            <MessagesSquare className="h-3 w-3" />
                            All
                            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                                {counts.all}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="direct" className="flex-1 gap-1 text-xs">
                            <User className="h-3 w-3" />
                            Direct Messages
                            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                                {counts.direct}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="group" className="flex-1 gap-1 text-xs">
                            <Users className="h-3 w-3" />
                            Groups
                            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                                {counts.group}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
                <div className="space-y-1 p-2">
                    {filteredConversations.length > 0 ? (
                        filteredConversations.map((conversation) => (
                            <ConversationItem
                                key={conversation.id}
                                conversation={conversation}
                                isActive={conversation.id === activeConversationId}
                            />
                        ))
                    ) : (
                        <EmptyState type={activeTab} searchQuery={searchQuery} />
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
