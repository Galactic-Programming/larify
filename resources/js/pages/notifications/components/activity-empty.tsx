import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Activity } from 'lucide-react';
import { motion, type Variants } from 'motion/react';

// Animation variants
const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.4,
            staggerChildren: 0.1,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 12,
        },
    },
};

const iconVariants: Variants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
        scale: 1,
        rotate: 0,
        transition: {
            type: 'spring',
            stiffness: 200,
            damping: 15,
        },
    },
};

export function ActivityEmpty() {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <Empty className="min-h-100 border-0">
                <EmptyHeader>
                    <motion.div variants={iconVariants}>
                        <EmptyMedia variant="icon">
                            <Activity className="size-6" />
                        </EmptyMedia>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <EmptyTitle>No activity yet</EmptyTitle>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <EmptyDescription>
                            When you or your team members make changes to projects, tasks, or lists, the activity will appear here.
                        </EmptyDescription>
                    </motion.div>
                </EmptyHeader>
            </Empty>
        </motion.div>
    );
}
