import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Bell, Inbox } from 'lucide-react';
import { motion, type Variants } from 'motion/react';

interface NotificationEmptyProps {
    filter?: 'all' | 'unread' | 'read';
}

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

export function NotificationEmpty({ filter = 'all' }: NotificationEmptyProps) {
    const getMessage = () => {
        switch (filter) {
            case 'unread':
                return {
                    title: 'All caught up!',
                    description:
                        "You've read all your notifications. Great job staying on top of things!",
                };
            case 'read':
                return {
                    title: 'No read notifications',
                    description: "You haven't read any notifications yet.",
                };
            default:
                return {
                    title: 'No notifications yet',
                    description:
                        "When something happens in your projects, you'll see it here.",
                };
        }
    };

    const { title, description } = getMessage();

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
                            {filter === 'unread' ? (
                                <Inbox className="size-6" />
                            ) : (
                                <Bell className="size-6" />
                            )}
                        </EmptyMedia>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <EmptyTitle>{title}</EmptyTitle>
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <EmptyDescription>{description}</EmptyDescription>
                    </motion.div>
                </EmptyHeader>
            </Empty>
        </motion.div>
    );
}
