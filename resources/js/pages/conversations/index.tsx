import { Button } from '@/components/ui/button';
import ChatLayout from '@/layouts/chat/chat-layout';
import { CreateConversationDialog } from '@/pages/conversations/components/create-conversation-dialog';
import type { BreadcrumbItem } from '@/types';
import type { Conversation } from '@/types/chat';
import { Head } from '@inertiajs/react';
import { MessageSquarePlus, MessagesSquare } from 'lucide-react';

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
                Welcome to Conversations
            </h2>
            <p className="mb-6 max-w-sm text-muted-foreground">
                Select a conversation from the sidebar to start chatting, or
                create a new one.
            </p>
            <CreateConversationDialog
                trigger={
                    <Button>
                        <MessageSquarePlus className="mr-2 h-4 w-4" />
                        New Conversation
                    </Button>
                }
            />
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
