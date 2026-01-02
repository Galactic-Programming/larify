import { Button } from '@/components/ui/button';
import type { Message } from '@/types/chat';
import { Edit2, Reply, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

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
    const isVisible = replyingTo || editingMessage;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                        mass: 0.5,
                    }}
                    className="overflow-hidden border-t bg-muted/50"
                >
                    <div className="flex items-center justify-between px-4 py-2">
                        <motion.div
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.05 }}
                            className="flex items-center gap-2 text-sm"
                        >
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
                        </motion.div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={onCancel}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
