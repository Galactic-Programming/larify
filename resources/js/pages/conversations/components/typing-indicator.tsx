import { Dot, SparklesIcon } from 'lucide-react';

interface TypingIndicatorProps {
    names: string[];
    isAIThinking?: boolean;
}

export function TypingIndicator({ names, isAIThinking = false }: TypingIndicatorProps) {
    const hasTypingUsers = names.length > 0;

    if (!hasTypingUsers && !isAIThinking) return null;

    const userText =
        names.length === 1
            ? `${names[0]} is typing...`
            : names.length === 2
                ? `${names[0]} and ${names[1]} are typing...`
                : names.length > 2
                    ? `${names[0]} and ${names.length - 1} others are typing...`
                    : '';

    return (
        <div className="flex flex-col gap-1 px-4 py-1.5 text-sm text-muted-foreground">
            {/* AI Thinking - compact text style */}
            {isAIThinking && (
                <div className="flex items-center gap-2">
                    <SparklesIcon className="h-3.5 w-3.5 animate-pulse text-violet-500" />
                    <span className="text-violet-600 dark:text-violet-400">
                        Laraflow AI is thinking
                    </span>
                    <div className="flex gap-0.5">
                        <span className="h-1 w-1 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.3s]" />
                        <span className="h-1 w-1 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.15s]" />
                        <span className="h-1 w-1 animate-bounce rounded-full bg-violet-500" />
                    </div>
                </div>
            )}

            {/* Regular user typing indicator */}
            {hasTypingUsers && (
                <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                        <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                        <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                        <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground" />
                    </div>
                    <span>{userText}</span>
                </div>
            )}
        </div>
    );
}

/**
 * AI Thinking Bubble - displays as a chat message bubble
 * Use this inside the messages area for better UX
 */
export function AIThinkingBubble() {
    return (
        <div className="flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* AI Avatar */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                <SparklesIcon className="h-4 w-4 text-white" />
            </div>

            {/* Thinking bubble - styled like a chat message */}
            <div className="max-w-[70%] rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                <div className="flex items-center gap-2">
                    <Dot className="h-5 w-5 animate-typing-dot-bounce text-violet-500" />
                    <Dot className="h-5 w-5 animate-typing-dot-bounce text-violet-500 [animation-delay:90ms]" />
                    <Dot className="h-5 w-5 animate-typing-dot-bounce text-violet-500 [animation-delay:180ms]" />
                </div>
            </div>
        </div>
    );
}
