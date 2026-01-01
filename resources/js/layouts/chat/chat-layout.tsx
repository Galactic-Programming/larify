import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import type { Conversation } from '@/types/chat';
import { type PropsWithChildren, useCallback, useEffect, useState } from 'react';

interface ChatLayoutProps {
    breadcrumbs?: BreadcrumbItem[];
    /** Show the chat content area (when a conversation is selected) */
    showContent?: boolean;
    /** List of conversations for the sidebar */
    conversations: Conversation[];
    /** Currently active conversation ID */
    activeConversationId?: number;
}

// Local storage key for sidebar width
const SIDEBAR_WIDTH_KEY = 'chat-sidebar-width';
// Default sidebar size (percentage of panel group)
const DEFAULT_SIDEBAR_SIZE = 30;
// Min/max constraints (in percentage)
const MIN_SIDEBAR_SIZE = 20; // ~240px on 1200px container
const MAX_SIDEBAR_SIZE = 40; // ~480px on 1200px container

export default function ChatLayout({
    children,
    breadcrumbs = [],
    showContent = true,
    conversations,
    activeConversationId,
}: PropsWithChildren<ChatLayoutProps>) {
    // Load saved sidebar width from localStorage
    const [sidebarSize, setSidebarSize] = useState<number>(() => {
        if (typeof window === 'undefined') return DEFAULT_SIDEBAR_SIZE;
        const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
        if (saved) {
            const parsed = parseFloat(saved);
            if (!isNaN(parsed) && parsed >= MIN_SIDEBAR_SIZE && parsed <= MAX_SIDEBAR_SIZE) {
                return parsed;
            }
        }
        return DEFAULT_SIDEBAR_SIZE;
    });

    // Save sidebar width to localStorage when it changes
    const handleResize = useCallback((sizes: number[]) => {
        const newSize = sizes[0];
        if (newSize >= MIN_SIDEBAR_SIZE && newSize <= MAX_SIDEBAR_SIZE) {
            setSidebarSize(newSize);
            localStorage.setItem(SIDEBAR_WIDTH_KEY, newSize.toString());
        }
    }, []);

    // Sync with localStorage on mount (for SSR hydration)
    useEffect(() => {
        const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
        if (saved) {
            const parsed = parseFloat(saved);
            if (!isNaN(parsed) && parsed >= MIN_SIDEBAR_SIZE && parsed <= MAX_SIDEBAR_SIZE) {
                setSidebarSize(parsed);
            }
        }
    }, []);
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
                    {/* Mobile: Non-resizable layout */}
                    <div className="flex h-full w-full md:hidden">
                        <ChatSidebar
                            conversations={conversations}
                            activeConversationId={activeConversationId}
                            className={cn(
                                'w-full shrink-0 border-r',
                                showContent && 'hidden',
                            )}
                        />
                        <div
                            className={cn(
                                'flex flex-1 flex-col overflow-hidden',
                                !showContent && 'hidden',
                            )}
                        >
                            {children}
                        </div>
                    </div>

                    {/* Desktop: Resizable layout */}
                    <ResizablePanelGroup
                        direction="horizontal"
                        onLayout={handleResize}
                        className="hidden h-full md:flex"
                    >
                        <ResizablePanel
                            defaultSize={sidebarSize}
                            minSize={MIN_SIDEBAR_SIZE}
                            maxSize={MAX_SIDEBAR_SIZE}
                            className="min-w-60 max-w-120"
                        >
                            <ChatSidebar
                                conversations={conversations}
                                activeConversationId={activeConversationId}
                                className="h-full border-r"
                            />
                        </ResizablePanel>
                        <ResizableHandle className="hover:bg-primary/20 transition-colors" />
                        <ResizablePanel defaultSize={100 - sidebarSize}>
                            <div className="flex h-full flex-col overflow-hidden">
                                {children}
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </div>
            </AppContent>
        </AppShell>
    );
}
