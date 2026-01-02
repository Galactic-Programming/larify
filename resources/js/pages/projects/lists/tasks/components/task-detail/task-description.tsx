interface TaskDescriptionProps {
    description: string | null;
}

export function TaskDescription({ description }: TaskDescriptionProps) {
    if (!description) return null;

    return (
        <div className="space-y-2">
            <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Description
            </h4>
            <div className="overflow-hidden rounded-lg bg-muted/30 p-3 sm:p-4">
                <p className="text-sm leading-relaxed break-all whitespace-pre-wrap text-foreground/80">
                    {description}
                </p>
            </div>
        </div>
    );
}
