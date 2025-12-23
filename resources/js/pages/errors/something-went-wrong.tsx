import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertCircleIcon,
    ArrowLeftIcon,
    HomeIcon,
    RefreshCwIcon,
} from 'lucide-react';
import { motion } from 'motion/react';

interface ErrorPageProps {
    error?: string;
}

export default function ErrorPage({ error }: ErrorPageProps) {
    const { props } = usePage();
    const errorMessage =
        error ||
        (props.flash as { error?: string })?.error ||
        'Something went wrong. Please try again.';

    const refreshPage = () => {
        window.location.reload();
    };

    const goBack = () => {
        window.history.back();
    };

    return (
        <>
            <Head title="Something Went Wrong" />

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
                                <div className="inline-flex size-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                    <AlertCircleIcon className="size-10 text-red-600 dark:text-red-400" />
                                </div>
                            </motion.div>
                            <CardTitle className="text-2xl">
                                Something Went Wrong
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">
                                {errorMessage}
                            </p>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            <Button className="w-full" onClick={refreshPage}>
                                <RefreshCwIcon className="mr-2 size-4" />
                                Refresh Page
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={goBack}
                            >
                                <ArrowLeftIcon className="mr-2 size-4" />
                                Go Back
                            </Button>
                            <Button variant="ghost" className="w-full" asChild>
                                <Link href="/">
                                    <HomeIcon className="mr-2 size-4" />
                                    Return to Home
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
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                    >
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
                    If this problem persists, please{' '}
                    <Link
                        href="/contact"
                        className="text-primary hover:underline"
                    >
                        contact support
                    </Link>
                </motion.p>
            </div>
        </>
    );
}
