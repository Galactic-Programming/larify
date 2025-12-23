import type { NormalizedTrashItem } from '@/types/trash.d';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { TrashItemCard } from './trash-item-card';

// Animation variants for staggered list
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        },
    },
};

interface TrashItemListProps {
    items: NormalizedTrashItem[];
    onRestore: (item: NormalizedTrashItem) => void;
    onForceDelete: (item: NormalizedTrashItem) => void;
    processingIds: Set<number>;
}

export function TrashItemList({
    items,
    onRestore,
    onForceDelete,
    processingIds,
}: TrashItemListProps) {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
        >
            <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                    <TrashItemCard
                        key={`${item.type}-${item.id}`}
                        item={item}
                        index={index}
                        onRestore={onRestore}
                        onForceDelete={onForceDelete}
                        isRestoring={processingIds.has(item.id)}
                        isDeleting={processingIds.has(item.id)}
                    />
                ))}
            </AnimatePresence>
        </motion.div>
    );
}
