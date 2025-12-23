import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowRight, ImageIcon, MoreVertical, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChatMainProps, ChatMessage } from "@/types/chat";

interface MessageBubbleProps {
    message: ChatMessage;
    isCurrentUser: boolean;
    showAvatar: boolean;
    senderAvatar?: string;
    senderName?: string;
}

const MessageBubble = ({
    message,
    isCurrentUser,
    showAvatar,
    senderAvatar,
    senderName
}: MessageBubbleProps) => (
    <div className={cn("flex items-end gap-2", isCurrentUser ? "justify-end" : "")}>
        {!isCurrentUser && showAvatar && (
            <Avatar className="h-8 w-8">
                <AvatarImage src={senderAvatar} alt={senderName ?? "User"} />
                <AvatarFallback>{senderName?.charAt(0).toUpperCase() ?? "U"}</AvatarFallback>
            </Avatar>
        )}
        {!isCurrentUser && !showAvatar && <div className="w-8" />}
        <div
            className={cn(
                "max-w-[70%] rounded-lg p-3",
                isCurrentUser
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted rounded-bl-none"
            )}
        >
            <p className="text-sm whitespace-pre-wrap wrap-break-word">{message.content}</p>
            <span
                className={cn(
                    "mt-1 block text-xs",
                    isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
            >
                {message.timestamp}
            </span>
        </div>
    </div>
);

interface EmptyStateProps {
    conversationName?: string;
}

const EmptyState = ({ conversationName }: EmptyStateProps) => (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="text-muted-foreground">
            <p className="text-lg font-medium">
                {conversationName ? `Start a conversation with ${conversationName}` : "Select a conversation"}
            </p>
            <p className="mt-1 text-sm">Send a message to get started</p>
        </div>
    </div>
);

export function ChatMain({
    conversation,
    messages,
    currentUserId,
    onSendMessage,
    onAttachImage,
    isLoading = false
}: ChatMainProps) {
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && !isLoading) {
            onSendMessage(inputValue.trim());
            setInputValue("");
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // Get participant info for displaying avatars (for non-current user messages)
    const getParticipantInfo = (senderId: number) => {
        const participant = conversation?.participants.find((p) => p.id === senderId);
        return {
            avatar: participant?.avatar,
            name: participant?.name ?? "Unknown"
        };
    };

    // Group messages to show avatar only for first message in a sequence from same sender
    const shouldShowAvatar = (index: number, message: ChatMessage) => {
        if (index === 0) return true;
        const prevMessage = messages[index - 1];
        return prevMessage.senderId !== message.senderId;
    };

    if (!conversation) {
        return (
            <div className="m-4 flex flex-1 flex-col items-center justify-center rounded-lg border shadow-sm">
                <EmptyState />
            </div>
        );
    }

    const displayName = conversation.name;
    const displayAvatar = conversation.avatar;
    const otherParticipant = conversation.participants.find((p) => p.id !== currentUserId);
    const status = otherParticipant?.status === "online" ? "Online" : otherParticipant?.lastSeen ?? "last seen recently";

    return (
        <div className="m-4 flex flex-1 flex-col rounded-lg border shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={displayAvatar} alt={displayName} />
                        <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-semibold">{displayName}</h2>
                        <p className="text-muted-foreground text-sm">{status}</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" aria-label="More options">
                    <MoreVertical className="h-5 w-5" />
                </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {messages.length === 0 ? (
                    <EmptyState conversationName={displayName} />
                ) : (
                    messages.map((msg, index) => {
                        const isCurrentUser = msg.senderId === currentUserId;
                        const participantInfo = getParticipantInfo(msg.senderId);

                        return (
                            <MessageBubble
                                key={msg.id}
                                message={msg}
                                isCurrentUser={isCurrentUser}
                                showAvatar={!isCurrentUser && shouldShowAvatar(index, msg)}
                                senderAvatar={participantInfo.avatar}
                                senderName={participantInfo.name}
                            />
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="flex items-center gap-3 border-t p-4">
                {onAttachImage && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onAttachImage}
                        aria-label="Attach image"
                    >
                        <ImageIcon className="h-5 w-5" />
                    </Button>
                )}
                <Input
                    ref={inputRef}
                    placeholder="Type a message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                    disabled={isLoading}
                />
                <Button
                    type="submit"
                    size="icon"
                    className="rounded-full"
                    disabled={!inputValue.trim() || isLoading}
                    aria-label="Send message"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <ArrowRight className="h-4 w-4" />
                    )}
                </Button>
            </form>
        </div>
    );
}