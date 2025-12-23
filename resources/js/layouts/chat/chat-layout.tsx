import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import type { Conversation } from '@/types/chat';
import { type PropsWithChildren } from 'react';

interface ChatLayoutProps {
    breadcrumbs?: BreadcrumbItem[];
    /** Show the chat content area (when a conversation is selected) */
    showContent?: boolean;
    /** List of conversations for the sidebar */
    conversations: Conversation[];
    /** Currently active conversation ID */
    activeConversationId?: number;
}

export default function ChatLayout({
    children,
    breadcrumbs = [],
    showContent = true,
    conversations,
    activeConversationId,
}: PropsWithChildren<ChatLayoutProps>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
                    {/* Chat Sidebar - Conversation List */}
                    <ChatSidebar
                        conversations={conversations}
                        activeConversationId={activeConversationId}
                        className={cn(
                            'w-80 shrink-0 border-r',
                            // On mobile, hide sidebar when content is shown
                            showContent && 'hidden md:flex',
                        )}
                    />

                    {/* Chat Content Area */}
                    <div
                        className={cn(
                            'flex flex-1 flex-col overflow-hidden',
                            // On mobile, hide content when no conversation selected
                            !showContent && 'hidden md:flex',
                        )}
                    >
                        {children}
                    </div>
                </div>
            </AppContent>
        </AppShell>
    );
}
