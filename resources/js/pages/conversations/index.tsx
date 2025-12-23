import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { Conversation, ConversationType } from '@/types/chat';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquarePlus, MessagesSquare, Search, User, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Props {
    conversations: Conversation[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Conversations',
        href: '/conversations',
    },
];

function formatTime(dateString?: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: false });
}

interface ConversationItemProps {
    conversation: Conversation;
}

function ConversationItem({ conversation }: ConversationItemProps) {
    const lastMessagePreview = conversation.last_message?.content ?? 'No messages yet';
    const hasUnread = conversation.unread_count > 0;

    return (
        <Link
            href={`/conversations/${conversation.id}`}
            className="hover:bg-muted flex items-center gap-3 rounded-lg p-3 transition-colors"
        >
            <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={conversation.avatar} alt={conversation.name} />
                <AvatarFallback className="text-lg">
                    {conversation.name.charAt(0).toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{conversation.name}</span>
                    {conversation.last_message_at && (
                        <span className="text-muted-foreground shrink-0 text-xs">
                            {formatTime(conversation.last_message_at)}
                        </span>
                    )}
                </div>
                <div className="flex items-center justify-between gap-2">
                    <p className="text-muted-foreground truncate text-sm">{lastMessagePreview}</p>
                    {hasUnread && (
                        <Badge variant="default" className="shrink-0 rounded-full px-2">
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="text-muted-foreground mb-4 h-12 w-12" />
                <p className="text-muted-foreground">No conversations match "{searchQuery}"</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessagesSquare className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="font-semibold">No conversations yet</h3>
            <p className="text-muted-foreground mt-1 text-sm">
                {type === 'direct'
                    ? 'Start a direct message with someone'
                    : type === 'group'
                        ? 'Create a group to chat with multiple people'
                        : 'Start a conversation to begin chatting'}
            </p>
        </div>
    );
}

export default function ConversationsIndex({ conversations: initialConversations }: Props) {
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

    // Real-time: Listen for new messages to update last_message
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
                            unread_count: conv.unread_count + 1,
                        }
                        : conv,
                ),
            );
        },
        [auth.user.id],
        'private',
    );

    const filteredConversations = useMemo(() => {
        return conversations.filter((conversation) => {
            // Filter by type
            if (activeTab !== 'all' && conversation.type !== activeTab) {
                return false;
            }

            // Filter by search
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return conversation.name.toLowerCase().includes(query);
            }

            return true;
        });
    }, [conversations, activeTab, searchQuery]);

    const counts = useMemo(() => {
        return {
            all: conversations.length,
            direct: conversations.filter((c) => c.type === 'direct').length,
            group: conversations.filter((c) => c.type === 'group').length,
        };
    }, [conversations]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Conversations" />
            <div className="flex h-full flex-1 flex-col overflow-hidden">
                {/* Header */}
                <div className="border-b p-4 md:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Conversations</h1>
                            <p className="text-muted-foreground text-sm">
                                Chat with your contacts and groups
                            </p>
                        </div>
                        <Button asChild>
                            <Link href="/conversations/create">
                                <MessageSquarePlus className="mr-2 h-4 w-4" />
                                New Conversation
                            </Link>
                        </Button>
                    </div>

                    {/* Filters */}
                    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="relative flex-1 sm:max-w-xs">
                            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                            <Input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <Tabs
                            value={activeTab}
                            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
                        >
                            <TabsList>
                                <TabsTrigger value="all" className="gap-2">
                                    <MessagesSquare className="h-4 w-4" />
                                    All
                                    <Badge variant="secondary" className="ml-1">
                                        {counts.all}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="direct" className="gap-2">
                                    <User className="h-4 w-4" />
                                    Direct
                                    <Badge variant="secondary" className="ml-1">
                                        {counts.direct}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger value="group" className="gap-2">
                                    <Users className="h-4 w-4" />
                                    Groups
                                    <Badge variant="secondary" className="ml-1">
                                        {counts.group}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    {filteredConversations.length > 0 ? (
                        <div className="mx-auto max-w-2xl space-y-1">
                            {filteredConversations.map((conversation) => (
                                <ConversationItem
                                    key={conversation.id}
                                    conversation={conversation}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState type={activeTab} searchQuery={searchQuery} />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
