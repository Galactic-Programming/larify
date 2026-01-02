import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Loader2, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CommentPermissions, TaskComment } from './types';

interface CommentInputProps {
    permissions: CommentPermissions;
    replyingTo?: TaskComment | null;
    editingComment?: TaskComment | null;
    onSubmit: (content: string, parentId?: number) => Promise<void>;
    onCancelReply?: () => void;
    onCancelEdit?: () => void;
    disabled?: boolean;
}

export function CommentInput({
    permissions,
    replyingTo,
    editingComment,
    onSubmit,
    onCancelReply,
    onCancelEdit,
    disabled = false,
}: CommentInputProps) {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Set content when editing
    useEffect(() => {
        if (editingComment) {
            setContent(editingComment.content);
            textareaRef.current?.focus();
        }
    }, [editingComment]);

    // Focus when replying
    useEffect(() => {
        if (replyingTo) {
            textareaRef.current?.focus();
        }
    }, [replyingTo]);

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmit(content.trim(), replyingTo?.id);
            setContent('');
            onCancelReply?.();
            onCancelEdit?.();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === 'Escape') {
            if (replyingTo) {
                onCancelReply?.();
            } else if (editingComment) {
                onCancelEdit?.();
                setContent('');
            }
        }
    };

    const handleCancel = () => {
        if (editingComment) {
            onCancelEdit?.();
            setContent('');
        } else if (replyingTo) {
            onCancelReply?.();
        }
    };

    if (!permissions.can_create && !editingComment) {
        return (
            <div className="border-t bg-muted/30 p-4">
                <div className="rounded-lg bg-amber-500/10 p-3 text-center text-sm text-amber-700 dark:text-amber-400">
                    <span className="font-medium">Pro feature:</span> Upgrade to comment on
                    tasks
                </div>
            </div>
        );
    }

    return (
        <div className="border-t bg-background p-3">
            {/* Reply/Edit indicator */}
            {(replyingTo || editingComment) && (
                <div className="mb-2 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">
                        {editingComment ? (
                            'Editing comment'
                        ) : (
                            <>
                                Replying to{' '}
                                <span className="font-medium">{replyingTo?.user.name}</span>
                            </>
                        )}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={handleCancel}
                    >
                        <X className="size-4" />
                    </Button>
                </div>
            )}

            <div className="flex gap-2">
                <Textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        replyingTo
                            ? 'Write a reply...'
                            : editingComment
                                ? 'Edit your comment...'
                                : 'Add a comment...'
                    }
                    disabled={disabled || isSubmitting}
                    className={cn(
                        'min-h-20 flex-1 resize-none text-sm',
                        'focus-visible:ring-1',
                    )}
                />
            </div>

            <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                    Press <kbd className="rounded bg-muted px-1">Ctrl</kbd> +{' '}
                    <kbd className="rounded bg-muted px-1">Enter</kbd> to send
                </span>
                <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!content.trim() || disabled || isSubmitting}
                    className="gap-1.5"
                >
                    {isSubmitting ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <Send className="size-4" />
                    )}
                    {editingComment ? 'Update' : 'Send'}
                </Button>
            </div>
        </div>
    );
}
