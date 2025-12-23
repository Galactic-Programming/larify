import { useState, useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatConversation, ChatSidebarProps } from "@/types/chat";

interface ConversationItemProps {
    conversation: ChatConversation;
    isActive: boolean;
    onClick: (id: string) => void;
}

const ConversationItem = ({ conversation, isActive, onClick }: ConversationItemProps) => {
    const displayName = conversation.name;
    const avatarSrc = conversation.avatar;
    const lastMessage = conversation.lastMessage?.content ?? "No messages yet";
    const timestamp = conversation.lastMessage?.timestamp ?? "";
    const hasUnread = conversation.unreadCount > 0;

    return (
        <div
            className={cn(
                "hover:bg-muted flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors",
                isActive && "bg-muted"
            )}
            onClick={() => onClick(conversation.id)}
        >
            <Avatar>
                <AvatarImage src={avatarSrc} alt={displayName} />
                <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                    <span className="truncate font-medium">{displayName}</span>
                    {timestamp && (
                        <span className="text-muted-foreground ml-2 shrink-0 text-xs">{timestamp}</span>
                    )}
                </div>
                <div className="text-muted-foreground flex items-center justify-between text-sm">
                    <p className="truncate">{lastMessage}</p>
                    {hasUnread && (
                        <div className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                            {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export function ChatSidebar({
    conversations,
    activeConversationId,
    onConversationSelect,
    onNewChat,
    onSearch
}: ChatSidebarProps) {
    const [activeTab, setActiveTab] = useState<"personal" | "group">("personal");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // Filter conversations by type and search query
    const filteredConversations = useMemo(() => {
        return conversations.filter((conversation) => {
            const matchesType = conversation.type === activeTab;
            const matchesSearch =
                searchQuery === "" ||
                conversation.name.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesType && matchesSearch;
        });
    }, [conversations, activeTab, searchQuery]);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        onSearch?.(value);
    };

    const handleSearchToggle = () => {
        if (isSearching) {
            setSearchQuery("");
            onSearch?.("");
        }
        setIsSearching(!isSearching);
    };

    return (
        <div className="flex w-80 flex-col border-r p-4">
            <div className="mb-6 flex items-center justify-between gap-2">
                {isSearching ? (
                    <Input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="flex-1"
                        autoFocus
                    />
                ) : (
                    <h1 className="text-2xl font-bold">Chat</h1>
                )}
                <button
                    onClick={handleSearchToggle}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={isSearching ? "Close search" : "Open search"}
                >
                    {isSearching ? (
                        <X className="h-5 w-5" />
                    ) : (
                        <Search className="h-5 w-5" />
                    )}
                </button>
            </div>

            <div className="mb-6 flex rounded-lg border p-1">
                <Button
                    variant="ghost"
                    className={cn(
                        "h-9 flex-1 rounded-md text-sm font-medium",
                        activeTab === "personal" ? "shadow-sm" : "text-muted-foreground hover:bg-transparent"
                    )}
                    onClick={() => setActiveTab("personal")}
                >
                    <User className="mr-2 h-4 w-4" />
                    Personal
                </Button>
                <Button
                    variant="ghost"
                    className={cn(
                        "h-9 flex-1 rounded-md text-sm font-medium",
                        activeTab === "group" ? "shadow-sm" : "text-muted-foreground hover:bg-transparent"
                    )}
                    onClick={() => setActiveTab("group")}
                >
                    <Users className="mr-2 h-4 w-4" />
                    Groups
                </Button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-2">
                {filteredConversations.length === 0 ? (
                    <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-sm">
                            {searchQuery
                                ? "No conversations found"
                                : `No ${activeTab === "personal" ? "personal" : "group"} conversations yet`}
                        </p>
                    </div>
                ) : (
                    filteredConversations.map((conversation) => (
                        <ConversationItem
                            key={conversation.id}
                            conversation={conversation}
                            isActive={conversation.id === activeConversationId}
                            onClick={onConversationSelect}
                        />
                    ))
                )}
            </div>

            {onNewChat && (
                <div className="mt-6">
                    <Button className="w-full" onClick={onNewChat}>
                        New chat
                    </Button>
                </div>
            )}
        </div>
    );
}