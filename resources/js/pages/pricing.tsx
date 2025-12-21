import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cardVariants, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { CheckIcon, Loader2Icon } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

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
    plans: {
        monthly: Plan[];
        yearly: Plan[];
    };
}

export default function Pricing({ plans }: PricingProps) {
    const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
    const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
    const markerRef = useRef<HTMLDivElement>(null);
    const monthlyRef = useRef<HTMLButtonElement>(null);
    const yearlyRef = useRef<HTMLButtonElement>(null);

    const repositionMarker = useCallback((button: HTMLButtonElement) => {
        if (!markerRef.current) return;
        markerRef.current.style.width = `${button.offsetWidth}px`;
        markerRef.current.style.height = `${button.offsetHeight}px`;
        markerRef.current.style.left = `${button.offsetLeft}px`;
    }, []);

    useEffect(() => {
        if (monthlyRef.current && markerRef.current) {
            repositionMarker(monthlyRef.current);
            markerRef.current.classList.remove('opacity-0');
            setTimeout(() => {
                markerRef.current?.classList.add('duration-300', 'ease-out');
            }, 10);
        }
    }, [repositionMarker]);

    const currentPlans = billing === 'monthly' ? plans.monthly : plans.yearly;

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
        router.visit(`/billing/checkout/${planId}`);
    };

    return (
        <>
            <Head title="Pricing" />

            <div className="flex min-h-screen flex-col">
                {/* Header */}
                <header className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4">
                        <Link href="/" className="flex items-center gap-2">
                            <AppLogoIcon className="size-8" />
                            <span className="text-lg font-semibold">Larify</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" asChild>
                                <Link href="/login">Sign in</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/register">Get started</Link>
                            </Button>
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
                                Choose the plan that's right for you. Start free and upgrade when you need team
                                collaboration.
                            </p>
                        </motion.div>

                        {/* Billing Toggle */}
                        <div className="mb-12 flex justify-center">
                            <div className="relative inline-flex items-center rounded-full border-2 border-primary p-1">
                                <button
                                    ref={monthlyRef}
                                    onClick={() => {
                                        if (!loadingPlanId) {
                                            setBilling('monthly');
                                            repositionMarker(monthlyRef.current!);
                                        }
                                    }}
                                    className={cn(
                                        'relative z-20 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                                        billing === 'monthly' ? 'text-primary-foreground' : 'text-foreground',
                                        loadingPlanId && 'cursor-not-allowed opacity-50',
                                    )}
                                    disabled={!!loadingPlanId}
                                >
                                    Monthly
                                </button>
                                <button
                                    ref={yearlyRef}
                                    onClick={() => {
                                        if (!loadingPlanId) {
                                            setBilling('yearly');
                                            repositionMarker(yearlyRef.current!);
                                        }
                                    }}
                                    className={cn(
                                        'relative z-20 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                                        billing === 'yearly' ? 'text-primary-foreground' : 'text-foreground',
                                        loadingPlanId && 'cursor-not-allowed opacity-50',
                                    )}
                                    disabled={!!loadingPlanId}
                                >
                                    Yearly
                                    <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        Save 17%
                                    </span>
                                </button>
                                <div
                                    ref={markerRef}
                                    className="absolute left-0 z-10 h-full opacity-0"
                                >
                                    <div className="h-full w-full rounded-full bg-primary" />
                                </div>
                            </div>
                        </div>

                        {/* Pricing Cards */}
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="show"
                            className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3"
                        >
                            {/* Free Plan Card */}
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
                                            <span className="text-lg font-normal text-muted-foreground">/month</span>
                                        </CardTitle>
                                        <CardDescription>Perfect for personal use</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <ul className="space-y-3">
                                            {[
                                                'Unlimited projects',
                                                'Unlimited tasks',
                                                'Task priorities & due dates',
                                                'Activity history',
                                                'Email notifications',
                                                'Personal use only',
                                            ].map((feature, i) => (
                                                <li key={i} className="flex items-start gap-2">
                                                    <CheckIcon className="mt-0.5 size-5 shrink-0 text-primary" />
                                                    <span className="text-sm">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button variant="outline" className="w-full" asChild>
                                            <Link href="/register">Get started free</Link>
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>

                            {/* Pro Plans */}
                            {currentPlans
                                .filter((plan) => plan.name !== 'Free')
                                .map((plan) => (
                                    <motion.div key={plan.stripe_id} variants={cardVariants}>
                                        <Card className="relative flex h-full flex-col overflow-hidden border-2 border-primary shadow-lg transition-all hover:shadow-xl">
                                            {/* Popular badge */}
                                            <div className="absolute right-4 top-4">
                                                <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                                                    Popular
                                                </span>
                                            </div>
                                            <CardHeader>
                                                <div className="mb-2">
                                                    <span className="inline-block rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
                                                        {plan.name}
                                                    </span>
                                                </div>
                                                <CardTitle className="text-3xl">
                                                    {formatPrice(plan.price, plan.currency)}
                                                    <span className="text-lg font-normal text-muted-foreground">
                                                        /{plan.interval === 'month' ? 'mo' : 'yr'}
                                                    </span>
                                                </CardTitle>
                                                <CardDescription>{plan.description}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="flex-1">
                                                <ul className="space-y-3">
                                                    {plan.features?.map((feature, i) => (
                                                        <li key={i} className="flex items-start gap-2">
                                                            <CheckIcon className="mt-0.5 size-5 shrink-0 text-primary" />
                                                            <span className="text-sm">{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CardContent>
                                            <CardFooter>
                                                <Button
                                                    className="w-full"
                                                    onClick={() => handleCheckout(plan.stripe_id)}
                                                    disabled={!!loadingPlanId}
                                                >
                                                    {loadingPlanId === plan.stripe_id ? (
                                                        <>
                                                            <Loader2Icon className="mr-2 size-4 animate-spin" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        'Get started'
                                                    )}
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    </motion.div>
                                ))}
                        </motion.div>

                        {/* FAQ or additional info */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mx-auto mt-16 max-w-2xl text-center"
                        >
                            <p className="text-muted-foreground">
                                All plans include a 14-day free trial. No credit card required for free plan.
                                <br />
                                Need a custom plan?{' '}
                                <Link href="/contact" className="text-primary hover:underline">
                                    Contact us
                                </Link>
                            </p>
                        </motion.div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t py-8">
                    <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                        <p>© {new Date().getFullYear()} Larify. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
