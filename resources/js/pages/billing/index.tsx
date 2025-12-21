import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'motion/react';

import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cardVariants, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { CalendarIcon, CheckIcon, CreditCardIcon, Loader2Icon, SparklesIcon } from 'lucide-react';
import { useState } from 'react';

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

interface Subscription {
    stripe_status: string;
    stripe_price: string;
    trial_ends_at: string | null;
    ends_at: string | null;
}

interface BillingIndexProps {
    subscription: Subscription | null;
    currentPlan: Plan | null;
    plans: Plan[];
    onGracePeriod: boolean;
    isSubscribed: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Billing', href: '/billing' }];

export default function BillingIndex({ subscription, currentPlan, plans, onGracePeriod, isSubscribed }: BillingIndexProps) {
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(price / 100);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleUpgrade = (planId: string) => {
        setLoadingAction(`upgrade-${planId}`);
        router.visit(`/billing/checkout/${planId}`);
    };

    const handleSwap = (planId: string) => {
        setLoadingAction(`swap-${planId}`);
        router.post(`/billing/subscription/swap/${planId}`, {}, {
            onFinish: () => setLoadingAction(null),
        });
    };

    const handleCancel = () => {
        if (!confirm('Are you sure you want to cancel your subscription?')) return;
        setLoadingAction('cancel');
        router.post('/billing/subscription/cancel', {}, {
            onFinish: () => setLoadingAction(null),
        });
    };

    const handleResume = () => {
        setLoadingAction('resume');
        router.post('/billing/subscription/resume', {}, {
            onFinish: () => setLoadingAction(null),
        });
    };

    const getStatusBadge = () => {
        if (!subscription) {
            return <Badge variant="secondary">Free</Badge>;
        }
        if (onGracePeriod) {
            return <Badge variant="destructive">Canceling</Badge>;
        }
        if (subscription.stripe_status === 'trialing') {
            return <Badge variant="default">Trial</Badge>;
        }
        if (subscription.stripe_status === 'active') {
            return <Badge variant="default">Active</Badge>;
        }
        return <Badge variant="secondary">{subscription.stripe_status}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Billing" />

            <div className="px-4 py-6">
                <Heading title="Billing" description="Manage your subscription and billing settings" />

                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    className="mt-6 space-y-6"
                >
                    {/* Current Plan */}
                    <motion.div variants={cardVariants}>
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <SparklesIcon className="size-5 text-primary" />
                                            Current Plan
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            Your subscription details and status
                                        </CardDescription>
                                    </div>
                                    {getStatusBadge()}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-baseline justify-between">
                                        <div>
                                            <h3 className="text-2xl font-bold">
                                                {currentPlan?.name || 'Free'}
                                            </h3>
                                            {currentPlan && currentPlan.price > 0 && (
                                                <p className="text-muted-foreground">
                                                    {formatPrice(currentPlan.price, currentPlan.currency)}/{currentPlan.interval}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {subscription?.ends_at && (
                                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                                            <p className="text-sm text-destructive">
                                                <CalendarIcon className="mr-2 inline-block size-4" />
                                                Your subscription will end on {formatDate(subscription.ends_at)}
                                            </p>
                                        </div>
                                    )}

                                    {subscription?.trial_ends_at && !subscription.ends_at && (
                                        <div className="rounded-lg border border-primary/50 bg-primary/10 p-4">
                                            <p className="text-sm">
                                                <CalendarIcon className="mr-2 inline-block size-4" />
                                                Trial ends on {formatDate(subscription.trial_ends_at)}
                                            </p>
                                        </div>
                                    )}

                                    {currentPlan?.features && (
                                        <>
                                            <Separator />
                                            <div>
                                                <h4 className="mb-2 text-sm font-medium">Plan features</h4>
                                                <ul className="grid gap-2 sm:grid-cols-2">
                                                    {currentPlan.features.map((feature, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm">
                                                            <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-wrap gap-2">
                                {subscription && !onGracePeriod && (
                                    <Button variant="destructive" onClick={handleCancel} disabled={!!loadingAction}>
                                        {loadingAction === 'cancel' ? (
                                            <Loader2Icon className="mr-2 size-4 animate-spin" />
                                        ) : null}
                                        Cancel Subscription
                                    </Button>
                                )}
                                {onGracePeriod && (
                                    <Button onClick={handleResume} disabled={!!loadingAction}>
                                        {loadingAction === 'resume' ? (
                                            <Loader2Icon className="mr-2 size-4 animate-spin" />
                                        ) : null}
                                        Resume Subscription
                                    </Button>
                                )}
                                <Button variant="outline" asChild>
                                    <Link href="/billing/portal">
                                        <CreditCardIcon className="mr-2 size-4" />
                                        Manage Payment Method
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>

                    {/* Available Plans */}
                    <motion.div variants={cardVariants}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Available Plans</CardTitle>
                                <CardDescription>
                                    {isSubscribed ? 'Switch to a different plan' : 'Upgrade to unlock more features'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {plans.map((plan) => {
                                        const isCurrentPlan = currentPlan?.stripe_id === plan.stripe_id;
                                        const isFree = plan.price === 0;
                                        const canUpgrade = !isCurrentPlan && !isFree;

                                        return (
                                            <Card
                                                key={plan.stripe_id}
                                                className={cn(
                                                    'relative transition-all',
                                                    isCurrentPlan && 'border-2 border-primary',
                                                    canUpgrade && 'hover:border-primary hover:shadow-md',
                                                )}
                                            >
                                                {isCurrentPlan && (
                                                    <div className="absolute -top-3 left-4">
                                                        <Badge>Current</Badge>
                                                    </div>
                                                )}
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                                                    <div className="text-2xl font-bold">
                                                        {formatPrice(plan.price, plan.currency)}
                                                        {plan.price > 0 && (
                                                            <span className="text-sm font-normal text-muted-foreground">
                                                                /{plan.interval}
                                                            </span>
                                                        )}
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="pb-2">
                                                    <ul className="space-y-1.5 text-sm">
                                                        {plan.features?.slice(0, 4).map((feature, i) => (
                                                            <li key={i} className="flex items-start gap-2">
                                                                <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
                                                                <span className="text-muted-foreground">{feature}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                                <CardFooter>
                                                    {isCurrentPlan ? (
                                                        <Button variant="outline" className="w-full" disabled>
                                                            Current Plan
                                                        </Button>
                                                    ) : isFree ? (
                                                        <Button variant="outline" className="w-full" disabled>
                                                            Free
                                                        </Button>
                                                    ) : isSubscribed ? (
                                                        <Button
                                                            variant="outline"
                                                            className="w-full"
                                                            onClick={() => handleSwap(plan.stripe_id)}
                                                            disabled={!!loadingAction}
                                                        >
                                                            {loadingAction === `swap-${plan.stripe_id}` ? (
                                                                <Loader2Icon className="mr-2 size-4 animate-spin" />
                                                            ) : null}
                                                            Switch Plan
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            className="w-full"
                                                            onClick={() => handleUpgrade(plan.stripe_id)}
                                                            disabled={!!loadingAction}
                                                        >
                                                            {loadingAction === `upgrade-${plan.stripe_id}` ? (
                                                                <Loader2Icon className="mr-2 size-4 animate-spin" />
                                                            ) : null}
                                                            Upgrade
                                                        </Button>
                                                    )}
                                                </CardFooter>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div variants={cardVariants}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Billing History</CardTitle>
                                <CardDescription>View your past invoices and payment history</CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button variant="outline" asChild>
                                    <Link href="/settings/invoices">View Invoices</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </motion.div>
            </div>
        </AppLayout>
    );
}
