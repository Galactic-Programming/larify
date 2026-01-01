import ChatLayout from '@/layouts/chat/chat-layout';
import type { BreadcrumbItem } from '@/types';
import type { Conversation } from '@/types/chat';
import { Head } from '@inertiajs/react';
import { MessagesSquare, Users } from 'lucide-react';

interface Props {
    conversations: Conversation[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Conversations',
        href: '/conversations',
    },
];

function EmptyConversation() {
    return (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
                <MessagesSquare className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">
                Welcome to Team Chat
            </h2>
            <p className="mb-4 max-w-sm text-muted-foreground">
                Select a conversation from the sidebar, or start chatting from any project with team members.
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Conversations are automatically created for projects with 2+ members</span>
            </div>
        </div>
    );
}

export default function ConversationsIndex({ conversations }: Props) {
    return (
        <ChatLayout
            breadcrumbs={breadcrumbs}
            conversations={conversations}
            showContent={true}
        >
            <Head title="Conversations" />
            <EmptyConversation />
        </ChatLayout>
    );
}
