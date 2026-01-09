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
import { cardVariants, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckIcon, Loader2Icon } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

interface Plan {
    id: number;
    stripe_id: string;
    stripe_product: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    interval_count: number;
    features: string[] | null;
    is_active: boolean;
    sort_order: number;
}

interface PricingProps {
    plans: Plan[];
    isAuthenticated: boolean;
    currentSubscription: string | null;
}

export default function Pricing({
    plans,
    isAuthenticated,
    currentSubscription,
}: PricingProps) {
    const { errors } = usePage().props as { errors: Record<string, string> };
    const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    // Handle validation errors from redirect (GET requests)
    useEffect(() => {
        if (errors?.plan_id) {
            setCheckoutError(errors.plan_id);
            setLoadingPlanId(null);
        }
    }, [errors]);

    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(price / 100);
    };

    const handleCheckout = (planId: string) => {
        if (planId === 'price_free') return;
        setLoadingPlanId(planId);
        setCheckoutError(null);

        router.get(
            `/billing/checkout/${planId}`,
            {},
            {
                onError: (errors) => {
                    setCheckoutError(errors.plan_id || 'Unable to process checkout. Please try again.');
                    setLoadingPlanId(null);
                },
            },
        );
    };

    const freePlan = plans.find((p) => p.price === 0);
    const paidPlans = plans.filter((p) => p.price > 0);

    // Calculate yearly savings
    const monthlyPlan = paidPlans.find((p) => p.interval === 'month');
    const yearlyPlan = paidPlans.find((p) => p.interval === 'year');
    const yearlySavings =
        monthlyPlan && yearlyPlan
            ? Math.round(
                (1 - yearlyPlan.price / (monthlyPlan.price * 12)) * 100,
            )
            : 0;

    return (
        <>
            <Head title="Pricing" />

            <div className="flex min-h-screen flex-col">
                {/* Header */}
                <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4">
                        <Link href="/" className="flex items-center gap-2">
                            <AppLogoIcon className="size-8" />
                            <span className="text-lg font-semibold">
                                LaraFlow
                            </span>
                        </Link>
                        <div className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <Button asChild>
                                    <Link href="/dashboard">
                                        Go to Dashboard
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Button variant="ghost" asChild>
                                        <Link href="/login">Sign in</Link>
                                    </Button>
                                    <Button asChild>
                                        <Link href="/register">
                                            Get started
                                        </Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 py-12 md:py-20">
                    <div className="container mx-auto px-4">
                        {/* Hero Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="mx-auto mb-12 max-w-3xl text-center"
                        >
                            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
                                Simple, transparent pricing
                            </h1>
                            <p className="text-lg text-muted-foreground">
                                Choose the plan that's right for you. Start free
                                and upgrade when you need team collaboration.
                            </p>
                            {checkoutError && (
                                <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                                    <p className="text-sm text-destructive">{checkoutError}</p>
                                </div>
                            )}
                        </motion.div>

                        {/* Pricing Cards - All plans displayed */}
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="show"
                            className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3"
                        >
                            {/* Free Plan Card */}
                            {freePlan && (
                                <motion.div variants={cardVariants}>
                                    <Card className="relative flex h-full flex-col overflow-hidden transition-all hover:border-primary hover:shadow-lg">
                                        <CardHeader>
                                            <div className="mb-2">
                                                <span className="inline-block rounded-full bg-secondary px-3 py-1 text-sm font-medium">
                                                    Free
                                                </span>
                                            </div>
                                            <CardTitle className="text-3xl">
                                                $0
                                                <span className="text-lg font-normal text-muted-foreground">
                                                    /month
                                                </span>
                                            </CardTitle>
                                            <CardDescription>
                                                Perfect for personal use
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <ul className="space-y-3">
                                                {(
                                                    freePlan.features || [
                                                        'Up to 3 projects',
                                                        'Up to 5 lists per project',
                                                        'Task priorities & due dates',
                                                        '7 days activity history',
                                                        'In-app chat',
                                                    ]
                                                ).map((feature, i) => (
                                                    <li
                                                        key={i}
                                                        className="flex items-start gap-2"
                                                    >
                                                        <CheckIcon className="mt-0.5 size-5 shrink-0 text-primary" />
                                                        <span className="text-sm">
                                                            {feature}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardFooter>
                                            {isAuthenticated ? (
                                                currentSubscription ? (
                                                    <Button
                                                        variant="outline"
                                                        className="w-full"
                                                        asChild
                                                    >
                                                        <Link href="/settings/subscription">
                                                            Manage Subscription
                                                        </Link>
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        className="w-full"
                                                        disabled
                                                    >
                                                        Current Plan
                                                    </Button>
                                                )
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                    asChild
                                                >
                                                    <Link href="/register">
                                                        Get started free
                                                    </Link>
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            )}

                            {/* Paid Plans */}
                            {paidPlans.map((plan) => {
                                const isCurrentPlan =
                                    currentSubscription === plan.stripe_id;
                                const isPopular = plan.interval === 'month';

                                return (
                                    <motion.div
                                        key={plan.stripe_id}
                                        variants={cardVariants}
                                    >
                                        <Card
                                            className={cn(
                                                'relative flex h-full flex-col overflow-hidden transition-all hover:shadow-xl',
                                                isPopular &&
                                                'border-2 border-primary shadow-lg',
                                            )}
                                        >
                                            {/* Badge */}
                                            <div className="absolute top-4 right-4">
                                                {isPopular ? (
                                                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                                                        Popular
                                                    </span>
                                                ) : yearlySavings > 0 ? (
                                                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                        Save {yearlySavings}%
                                                    </span>
                                                ) : null}
                                            </div>
                                            <CardHeader>
                                                <div className="mb-2">
                                                    <span
                                                        className={cn(
                                                            'inline-block rounded-full px-3 py-1 text-sm font-medium',
                                                            isPopular
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-secondary',
                                                        )}
                                                    >
                                                        {plan.name}{' '}
                                                        {plan.interval ===
                                                            'year'
                                                            ? 'Yearly'
                                                            : 'Monthly'}
                                                    </span>
                                                </div>
                                                <CardTitle className="text-3xl">
                                                    {formatPrice(
                                                        plan.price,
                                                        plan.currency,
                                                    )}
                                                    <span className="text-lg font-normal text-muted-foreground">
                                                        /
                                                        {plan.interval ===
                                                            'month'
                                                            ? 'mo'
                                                            : 'yr'}
                                                    </span>
                                                </CardTitle>
                                                <CardDescription>
                                                    {plan.description ||
                                                        'For teams and professionals'}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex-1">
                                                <ul className="space-y-3">
                                                    {(plan.features || []).map(
                                                        (feature, i) => (
                                                            <li
                                                                key={i}
                                                                className="flex items-start gap-2"
                                                            >
                                                                <CheckIcon className="mt-0.5 size-5 shrink-0 text-primary" />
                                                                <span className="text-sm">
                                                                    {feature}
                                                                </span>
                                                            </li>
                                                        ),
                                                    )}
                                                </ul>
                                            </CardContent>
                                            <CardFooter>
                                                {isCurrentPlan ? (
                                                    <Button
                                                        className="w-full"
                                                        disabled
                                                    >
                                                        Current Plan
                                                    </Button>
                                                ) : isAuthenticated ? (
                                                    <Button
                                                        className="w-full"
                                                        variant={
                                                            isPopular
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        onClick={() =>
                                                            handleCheckout(
                                                                plan.stripe_id,
                                                            )
                                                        }
                                                        disabled={
                                                            !!loadingPlanId
                                                        }
                                                    >
                                                        {loadingPlanId ===
                                                            plan.stripe_id ? (
                                                            <>
                                                                <Loader2Icon className="mr-2 size-4 animate-spin" />
                                                                Processing...
                                                            </>
                                                        ) : currentSubscription ? (
                                                            'Switch Plan'
                                                        ) : (
                                                            'Upgrade'
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        className="w-full"
                                                        variant={
                                                            isPopular
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        asChild
                                                    >
                                                        <Link href="/register">
                                                            Get started
                                                        </Link>
                                                    </Button>
                                                )}
                                            </CardFooter>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </motion.div>

                        {/* FAQ or additional info */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mx-auto mt-16 max-w-2xl text-center"
                        >
                            <p className="text-muted-foreground">
                                All plans include a 14-day free trial. No credit
                                card required for free plan.
                                <br />
                                Need a custom plan?{' '}
                                <Link
                                    href="/contact"
                                    className="text-primary hover:underline"
                                >
                                    Contact us
                                </Link>
                            </p>
                        </motion.div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t py-8">
                    <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                        <p>
                            © {new Date().getFullYear()} LaraFlow. All rights
                            reserved.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
