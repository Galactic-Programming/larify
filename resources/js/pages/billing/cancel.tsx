import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import { AlertCircleIcon, ArrowLeftIcon, RefreshCwIcon } from 'lucide-react';
import { motion } from 'motion/react';

export default function Cancel() {
    const reasons = [
        'Payment was not completed',
        'You closed the checkout window',
        'There was an issue processing your card',
        'The session expired',
    ];

    return (
        <>
            <Head title="Payment Cancelled" />

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
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                                className="mx-auto mb-4"
                            >
                                <div className="inline-flex size-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                    <AlertCircleIcon className="size-10 text-amber-600 dark:text-amber-400" />
                                </div>
                            </motion.div>
                            <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
                            <CardDescription className="text-base">
                                Your payment was not completed
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Don't worry, no charges have been made to your account.
                            </p>

                            <div className="rounded-lg border bg-muted/50 p-4 text-left">
                                <p className="mb-2 text-sm font-medium">This might have happened because:</p>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    {reasons.map((r, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-muted-foreground/50">•</span>
                                            {r}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            <Button className="w-full" asChild>
                                <Link href="/pricing">
                                    <RefreshCwIcon className="mr-2 size-4" />
                                    Try Again
                                </Link>
                            </Button>
                            <Button variant="ghost" className="w-full" asChild>
                                <Link href="/dashboard">
                                    <ArrowLeftIcon className="mr-2 size-4" />
                                    Back to Dashboard
                                </Link>
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
                    <Link href="/" className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
                        <AppLogoIcon className="size-6" />
                        <span className="text-sm">Larify</span>
                    </Link>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mt-4 text-center text-sm text-muted-foreground"
                >
                    Need help?{' '}
                    <Link href="/contact" className="text-primary hover:underline">
                        Contact support
                    </Link>
                </motion.p>
            </div>
        </>
    );
}
