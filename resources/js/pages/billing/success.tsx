import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2Icon, SparklesIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';

interface SuccessProps {
    plan: {
        name: string;
        price: number;
        currency: string;
        interval: string;
    } | null;
}

export default function Success({ plan }: SuccessProps) {
    const hasReloaded = useRef(false);

    useEffect(() => {
        // Reload shared data to update user plan badge across the app
        if (!hasReloaded.current) {
            hasReloaded.current = true;
            router.reload({ only: ['auth'] });
        }
    }, []);

    useEffect(() => {
        // Dynamic import for canvas-confetti to avoid SSR issues
        const runConfetti = async () => {
            try {
                const confetti = (await import('canvas-confetti')).default;

                const duration = 3000;
                const end = Date.now() + duration;

                const frame = () => {
                    confetti({
                        particleCount: 3,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0, y: 0.7 },
                        colors: [
                            '#FF6B6B',
                            '#4ECDC4',
                            '#45B7D1',
                            '#96CEB4',
                            '#FFEAA7',
                        ],
                    });
                    confetti({
                        particleCount: 3,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1, y: 0.7 },
                        colors: [
                            '#FF6B6B',
                            '#4ECDC4',
                            '#45B7D1',
                            '#96CEB4',
                            '#FFEAA7',
                        ],
                    });

                    if (Date.now() < end) {
                        requestAnimationFrame(frame);
                    }
                };

                frame();
            } catch {
                // Silently fail if confetti isn't available
            }
        };

        runConfetti();
    }, []);

    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(price / 100);
    };

    return (
        <>
            <Head title="Subscription Successful" />

            <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-background to-muted/30 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full max-w-md"
                >
                    <Card className="text-center">
                        <CardHeader className="pb-4">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{
                                    delay: 0.2,
                                    type: 'spring',
                                    stiffness: 200,
                                }}
                                className="mx-auto mb-4"
                            >
                                <div className="inline-flex size-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <CheckCircle2Icon className="size-10 text-green-600 dark:text-green-400" />
                                </div>
                            </motion.div>
                            <CardTitle className="text-2xl">
                                Welcome to {plan?.name || 'Pro'}!
                            </CardTitle>
                            <CardDescription className="text-base">
                                Your subscription is now active
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {plan && plan.price > 0 && (
                                <div className="rounded-lg bg-muted p-4">
                                    <p className="text-sm text-muted-foreground">
                                        Your plan
                                    </p>
                                    <p className="text-lg font-semibold">
                                        {plan.name} -{' '}
                                        {formatPrice(plan.price, plan.currency)}
                                        /{plan.interval}
                                    </p>
                                </div>
                            )}
                            <div className="space-y-2 text-left">
                                <p className="flex items-center gap-2 text-sm">
                                    <SparklesIcon className="size-4 text-primary" />
                                    Team collaboration unlocked
                                </p>
                                <p className="flex items-center gap-2 text-sm">
                                    <SparklesIcon className="size-4 text-primary" />
                                    Invite unlimited members
                                </p>
                                <p className="flex items-center gap-2 text-sm">
                                    <SparklesIcon className="size-4 text-primary" />
                                    Advanced permissions & roles
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            <Button className="w-full" asChild>
                                <Link href="/dashboard">Go to Dashboard</Link>
                            </Button>
                            <Button variant="ghost" className="w-full" asChild>
                                <Link href="/billing">Manage Subscription</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8"
                >
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <AppLogoIcon className="size-6" />
                        <span className="text-sm">Larify</span>
                    </Link>
                </motion.div>
            </div>
        </>
    );
}
