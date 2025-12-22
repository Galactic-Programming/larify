import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface TrashHeaderProps {
    totalCount: number;
    retentionDays: number;
    onEmptyTrash: () => void;
    isEmptyDisabled: boolean;
}

export function TrashHeader({ totalCount, retentionDays, onEmptyTrash, isEmptyDisabled }: TrashHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="flex items-center gap-4">
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
                    className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/25 sm:size-14"
                >
                    <Trash2 className="size-6 sm:size-7" />
                </motion.div>
                <div className="min-w-0">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-2xl font-bold tracking-tight sm:text-3xl"
                    >
                        Trash
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm text-muted-foreground"
                    >
                        {totalCount > 0 ? (
                            <>
                                {totalCount} item{totalCount !== 1 ? 's' : ''} • Auto-deleted after {retentionDays} days
                            </>
                        ) : (
                            'Items will be permanently deleted after ' + retentionDays + ' days'
                        )}
                    </motion.p>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
            >
                <Button
                    variant="destructive"
                    onClick={onEmptyTrash}
                    disabled={isEmptyDisabled}
                    className="gap-2 shadow-lg shadow-destructive/25 transition-all duration-300 hover:shadow-xl hover:shadow-destructive/30"
                >
                    <Trash2 className="size-4" />
                    Empty Trash
                </Button>
            </motion.div>
        </motion.div>
    );
}
