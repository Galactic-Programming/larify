import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
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

interface SubscriptionPageProps {
    subscription: Subscription | null;
    currentPlan: Plan | null;
    plans: Plan[];
    onGracePeriod: boolean;
    isSubscribed: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings' },
    { title: 'Subscription', href: '/settings/subscription' },
];

export default function Subscription({ subscription, currentPlan, plans, onGracePeriod, isSubscribed }: SubscriptionPageProps) {
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
        // Use window.location for Stripe Checkout redirect (external URL requires full page redirect)
        window.location.href = `/billing/checkout/${planId}`;
    };

    const handleSwap = (planId: string) => {
        setLoadingAction(`swap-${planId}`);
        router.post(
            `/billing/subscription/swap/${planId}`,
            {},
            {
                onFinish: () => setLoadingAction(null),
            },
        );
    };

    const handleCancel = () => {
        setLoadingAction('cancel');
        router.post(
            '/billing/subscription/cancel',
            {},
            {
                onFinish: () => setLoadingAction(null),
            },
        );
    };

    const handleResume = () => {
        setLoadingAction('resume');
        router.post(
            '/billing/subscription/resume',
            {},
            {
                onFinish: () => setLoadingAction(null),
            },
        );
    };

    const getStatusBadge = () => {
        if (!subscription) {
            return <Badge variant="secondary">Free</Badge>;
        }
        if (onGracePeriod) {
            return <Badge variant="destructive">Canceling</Badge>;
        }
        if (subscription.stripe_status === 'trialing') {
            return <Badge className="bg-blue-500">Trial</Badge>;
        }
        if (subscription.stripe_status === 'active') {
            return <Badge className="bg-green-500">Active</Badge>;
        }
        return <Badge variant="secondary">{subscription.stripe_status}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Subscription" />

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading title="Subscription" description="Manage your subscription plan and billing" />

                    {/* Current Plan Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <SparklesIcon className="size-5 text-primary" />
                                    <CardTitle>Current Plan</CardTitle>
                                </div>
                                {getStatusBadge()}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-2xl font-bold">{currentPlan?.name || 'Free'}</h3>
                                {currentPlan && currentPlan.price > 0 && (
                                    <p className="text-muted-foreground">
                                        {formatPrice(currentPlan.price, currentPlan.currency)}/{currentPlan.interval}
                                    </p>
                                )}
                            </div>

                            {subscription?.ends_at && (
                                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                                    <p className="flex items-center gap-2 text-sm text-destructive">
                                        <CalendarIcon className="size-4" />
                                        Your subscription will end on {formatDate(subscription.ends_at)}
                                    </p>
                                </div>
                            )}

                            {subscription?.trial_ends_at && !subscription.ends_at && (
                                <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-3">
                                    <p className="flex items-center gap-2 text-sm">
                                        <CalendarIcon className="size-4" />
                                        Trial ends on {formatDate(subscription.trial_ends_at)}
                                    </p>
                                </div>
                            )}

                            {currentPlan?.features && currentPlan.features.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h4 className="mb-2 text-sm font-medium text-muted-foreground">Plan features</h4>
                                        <ul className="space-y-2">
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
                        </CardContent>
                        <CardFooter className="flex flex-wrap gap-2">
                            {subscription && !onGracePeriod && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" disabled={!!loadingAction}>
                                            {loadingAction === 'cancel' && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                                            Cancel Subscription
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to cancel your subscription? You will still have access to all Pro features until the end of your current billing period.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleCancel}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Yes, Cancel
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            {onGracePeriod && (
                                <Button size="sm" onClick={handleResume} disabled={!!loadingAction}>
                                    {loadingAction === 'resume' && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                                    Resume Subscription
                                </Button>
                            )}
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/billing/portal">
                                    <CreditCardIcon className="mr-2 size-4" />
                                    Payment Method
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Available Plans */}
                    <div>
                        <h3 className="mb-4 text-lg font-semibold">
                            {isSubscribed ? 'Switch Plan' : 'Upgrade Your Plan'}
                        </h3>
                        <div className="space-y-3">
                            {plans
                                .filter((plan) => plan.price > 0)
                                .map((plan) => {
                                    const isCurrentPlan = currentPlan?.stripe_id === plan.stripe_id;

                                    return (
                                        <Card
                                            key={plan.stripe_id}
                                            className={isCurrentPlan ? 'border-2 border-primary' : 'hover:border-primary/50'}
                                        >
                                            <CardContent className="flex items-center justify-between p-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium">{plan.name}</h4>
                                                        {isCurrentPlan && <Badge variant="outline">Current</Badge>}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                                                    <p className="text-lg font-bold">
                                                        {formatPrice(plan.price, plan.currency)}
                                                        <span className="text-sm font-normal text-muted-foreground">
                                                            /{plan.interval}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div>
                                                    {isCurrentPlan ? (
                                                        <Button variant="outline" size="sm" disabled>
                                                            Current
                                                        </Button>
                                                    ) : isSubscribed ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleSwap(plan.stripe_id)}
                                                            disabled={!!loadingAction}
                                                        >
                                                            {loadingAction === `swap-${plan.stripe_id}` && (
                                                                <Loader2Icon className="mr-2 size-4 animate-spin" />
                                                            )}
                                                            Switch
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleUpgrade(plan.stripe_id)}
                                                            disabled={!!loadingAction}
                                                        >
                                                            {loadingAction === `upgrade-${plan.stripe_id}` && (
                                                                <Loader2Icon className="mr-2 size-4 animate-spin" />
                                                            )}
                                                            Upgrade
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
