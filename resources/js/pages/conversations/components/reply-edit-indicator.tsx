import { Button } from '@/components/ui/button';
import type { Message } from '@/types/chat';
import { Edit2, Reply } from 'lucide-react';

interface ReplyEditIndicatorProps {
    replyingTo: Message | null;
    editingMessage: Message | null;
    onCancel: () => void;
}

export function ReplyEditIndicator({
    replyingTo,
    editingMessage,
    onCancel,
}: ReplyEditIndicatorProps) {
    if (!replyingTo && !editingMessage) return null;

    return (
        <div className="flex items-center justify-between border-t bg-muted/50 px-4 py-2">
            <div className="flex items-center gap-2 text-sm">
                {editingMessage ? (
                    <>
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                        <span>Editing message</span>
                    </>
                ) : (
                    <>
                        <Reply className="h-4 w-4 text-muted-foreground" />
                        <span>
                            Replying to{' '}
                            <span className="font-medium">
                                {replyingTo?.sender?.name}
                            </span>
                        </span>
                    </>
                )}
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancel
            </Button>
        </div>
    );
}
