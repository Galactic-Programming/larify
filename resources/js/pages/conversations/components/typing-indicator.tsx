interface TypingIndicatorProps {
    names: string[];
}

export function TypingIndicator({ names }: TypingIndicatorProps) {
    if (names.length === 0) return null;

    const text =
        names.length === 1
            ? `${names[0]} is typing...`
            : names.length === 2
              ? `${names[0]} and ${names[1]} are typing...`
              : `${names[0]} and ${names.length - 1} others are typing...`;

    return (
        <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
            <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
            </div>
            <span>{text}</span>
        </div>
    );
}
