import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { motion, Variants } from 'motion/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

// Animation variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
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

const logoVariants: Variants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 200,
            damping: 15,
        },
    },
};

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    const { name } = usePage<SharedData>().props;

    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden bg-background p-6 md:p-10">
            {/* Subtle dot pattern */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
                style={{
                    backgroundImage:
                        'radial-gradient(circle, currentColor 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                }}
            />

            {/* Animated background gradient */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <motion.div
                    className="absolute -top-1/4 -left-1/4 h-1/2 w-1/2 rounded-full bg-linear-to-br from-primary/20 to-transparent blur-3xl"
                    animate={{
                        x: [0, 50, 0],
                        y: [0, 30, 0],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
                <motion.div
                    className="absolute -right-1/4 -bottom-1/4 h-1/2 w-1/2 rounded-full bg-linear-to-tl from-primary/15 to-transparent blur-3xl"
                    animate={{
                        x: [0, -30, 0],
                        y: [0, -50, 0],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            </div>

            <motion.div
                className="relative z-10 w-full max-w-sm"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <motion.div variants={logoVariants}>
                            <Link
                                href={home()}
                                className="flex flex-col items-center gap-2 font-medium"
                            >
                                <motion.div
                                    className="mb-1 flex h-9 w-9 items-center justify-center rounded-md"
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <AppLogoIcon className="size-9 fill-current text-(--foreground) dark:text-white" />
                                </motion.div>
                                <span className="text-lg font-semibold">{name}</span>
                            </Link>
                        </motion.div>

                        <motion.div
                            className="space-y-2 text-center"
                            variants={itemVariants}
                        >
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description}
                            </p>
                        </motion.div>
                    </div>
                    <motion.div variants={itemVariants}>{children}</motion.div>
                </div>
            </motion.div>

            {/* Footer security badge */}
            <motion.div
                className="relative z-10 text-center text-xs text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <p className="flex items-center gap-1.5">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        className="size-3.5"
                    >
                        <path
                            fillRule="evenodd"
                            d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Zm-1 2.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
                            clipRule="evenodd"
                        />
                    </svg>
                    Secured with SSL encryption
                </p>
            </motion.div>
        </div>
    );
}
