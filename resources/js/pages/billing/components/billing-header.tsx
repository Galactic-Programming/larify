import { CreditCard } from 'lucide-react';
import { motion } from 'motion/react';

interface BillingHeaderProps {
    statusBadge?: React.ReactNode;
    planName?: string | null;
}

export function BillingHeader({ statusBadge, planName }: BillingHeaderProps) {
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
                    transition={{
                        duration: 0.5,
                        type: 'spring',
                        stiffness: 200,
                    }}
                    className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/25 sm:size-14"
                >
                    <CreditCard className="size-6 sm:size-7" />
                </motion.div>
                <div className="min-w-0">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-2xl font-bold tracking-tight sm:text-3xl"
                    >
                        Billing
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm text-muted-foreground"
                    >
                        {planName ? (
                            <>Current plan: {planName}</>
                        ) : (
                            'Manage your subscription and billing settings'
                        )}
                    </motion.p>
                </div>
            </div>

            {statusBadge && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {statusBadge}
                </motion.div>
            )}
        </motion.div>
    );
}
