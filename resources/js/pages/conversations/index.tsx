import { Button } from '@/components/ui/button';
import { usePlanFeatures } from '@/hooks/use-plan-limits';
import ChatLayout from '@/layouts/chat/chat-layout';
import { CreateConversationDialog } from '@/pages/conversations/components/create-conversation-dialog';
import { plans } from '@/routes/billing';
import type { BreadcrumbItem } from '@/types';
import type { Conversation } from '@/types/chat';
import { Head, Link } from '@inertiajs/react';
import { Crown, Lock, MessageSquarePlus, MessagesSquare, Sparkles } from 'lucide-react';

interface Props {
    conversations: Conversation[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Conversations',
        href: '/conversations',
    },
];

function UpgradePrompt() {
    return (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-amber-500/20 to-orange-500/20">
                    <MessagesSquare className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-amber-500 to-orange-500 text-white shadow-lg">
                    <Lock className="h-4 w-4" />
                </div>
            </div>
            <div className="mb-2 flex items-center gap-2">
                <h2 className="text-xl font-semibold">Team Chat</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-xs font-medium text-white">
                    <Sparkles className="h-3 w-3" />
                    Pro
                </span>
            </div>
            <p className="mb-6 max-w-sm text-muted-foreground">
                Communicate with your team directly within Larify. Share updates,
                discuss tasks, and collaborate in real-time.
            </p>
            <Button
                asChild
                size="lg"
                className="gap-2 bg-linear-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25 transition-all duration-300 hover:from-amber-600 hover:to-orange-600 hover:shadow-xl hover:shadow-amber-500/30"
            >
                <Link href={plans.url()}>
                    <Crown className="h-4 w-4" />
                    Upgrade to Pro
                </Link>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
                Starting at $9.99/month • Cancel anytime
            </p>
        </div>
    );
}

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
    const { canUseChat } = usePlanFeatures();

    return (
        <ChatLayout
            breadcrumbs={breadcrumbs}
            conversations={canUseChat ? conversations : []}
            showContent={true}
        >
            <Head title="Conversations" />
            {canUseChat ? <EmptyConversation /> : <UpgradePrompt />}
        </ChatLayout>
    );
}
