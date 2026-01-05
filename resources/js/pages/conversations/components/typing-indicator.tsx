import { SparklesIcon } from 'lucide-react';

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
        <div className="flex flex-col gap-2 px-4 py-2">
            {/* AI Thinking Indicator - Special styling */}
            {isAIThinking && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* AI Avatar */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                        <SparklesIcon className="h-4 w-4 text-white animate-pulse" />
                    </div>

                    {/* Thinking bubble */}
                    <div className="rounded-2xl rounded-bl-md border border-violet-200 bg-linear-to-br from-violet-50 to-purple-50 px-4 py-2.5 dark:border-violet-800/50 dark:from-violet-950/50 dark:to-purple-950/50">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                                Laraflow AI
                            </span>
                            <span className="text-sm text-violet-600/80 dark:text-violet-400/80">
                                is thinking
                            </span>
                            <div className="flex gap-1">
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.3s]" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500 [animation-delay:-0.15s]" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-500" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Regular user typing indicator */}
            {hasTypingUsers && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                    </div>
                    <span>{userText}</span>
                </div>
            )}
        </div>
    );
}
