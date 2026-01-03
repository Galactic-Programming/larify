import { Link, usePage } from '@inertiajs/react';
import { CheckIcon, SparklesIcon, XIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { register } from '@/routes';
import { type SharedData } from '@/types';

type PricingPlan = {
    name: string;
    description: string;
    price: string;
    period: string;
    priceNote?: string;
    popular?: boolean;
    badge?: string;
    features: { name: string; included: boolean }[];
    cta: string;
    ctaVariant: 'default' | 'outline';
};

const pricingPlans: PricingPlan[] = [
    {
        name: 'Free',
        description: 'Perfect for personal use',
        price: '$0',
        period: '/month',
        features: [
            { name: 'Up to 3 projects', included: true },
            { name: 'Up to 5 lists per project', included: true },
            { name: 'Unlimited tasks', included: true },
            { name: 'Task priorities & due dates', included: true },
            { name: '7-day activity history', included: true },
            { name: 'Basic color & icon palette', included: true },
            { name: 'In-app chat', included: true },
            { name: 'Team collaboration', included: false },
            { name: 'Real-time updates', included: false },
        ],
        cta: 'Get Started Free',
        ctaVariant: 'outline',
    },
    {
        name: 'Pro Monthly',
        description: 'For teams and professionals',
        price: '$9.99',
        period: '/month',
        popular: true,
        features: [
            { name: 'Unlimited projects', included: true },
            { name: 'Unlimited lists per project', included: true },
            { name: 'Unlimited tasks', included: true },
            { name: 'Full activity history', included: true },
            { name: 'Full color & icon palette', included: true },
            { name: 'Team collaboration', included: true },
            { name: 'In-app chat', included: true },
            { name: 'Real-time updates', included: true },
            { name: 'Priority support', included: true },
        ],
        cta: 'Get Started',
        ctaVariant: 'default',
    },
    {
        name: 'Pro Yearly',
        description: 'Best value for teams',
        price: '$99.90',
        period: '/year',
        priceNote: '$8.33/month',
        badge: 'Save 17%',
        features: [
            { name: 'Unlimited projects', included: true },
            { name: 'Unlimited lists per project', included: true },
            { name: 'Unlimited tasks', included: true },
            { name: 'Full activity history', included: true },
            { name: 'Full color & icon palette', included: true },
            { name: 'Team collaboration', included: true },
            { name: 'In-app chat', included: true },
            { name: 'Real-time updates', included: true },
            { name: 'Priority support', included: true },
        ],
        cta: 'Get Started',
        ctaVariant: 'default',
    },
];

export function PricingSection() {
    const { auth } = usePage<SharedData>().props;

    return (
        <section id="pricing" className="py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
                    <Badge variant="secondary" className="mb-4">
                        Pricing
                    </Badge>
                    <h2 className="mb-4 text-2xl font-semibold md:text-3xl lg:text-4xl">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-base text-muted-foreground sm:text-lg">
                        Choose the plan that fits your needs. Upgrade or
                        downgrade anytime.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
                    {pricingPlans.map((plan) => (
                        <Card
                            key={plan.name}
                            className={cn(
                                'relative flex flex-col transition-all duration-300 hover:shadow-lg',
                                plan.popular &&
                                'scale-[1.02] border-primary shadow-lg lg:scale-105',
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-linear-to-r from-primary to-purple-600 px-3 py-1">
                                        <SparklesIcon className="mr-1 size-3" />
                                        Most Popular
                                    </Badge>
                                </div>
                            )}

                            {plan.badge && !plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <Badge
                                        variant="secondary"
                                        className="bg-green-100 px-3 py-1 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    >
                                        {plan.badge}
                                    </Badge>
                                </div>
                            )}

                            <CardHeader className="pb-2 text-center">
                                <h3 className="text-xl font-semibold">
                                    {plan.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {plan.description}
                                </p>
                            </CardHeader>

                            <CardContent className="flex-1">
                                {/* Price */}
                                <div className="mb-6 text-center">
                                    <span className="text-4xl font-bold">
                                        {plan.price}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {plan.period}
                                    </span>
                                    {plan.priceNote && (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            ({plan.priceNote})
                                        </p>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li
                                            key={feature.name}
                                            className="flex items-start gap-2 text-sm"
                                        >
                                            {feature.included ? (
                                                <CheckIcon className="mt-0.5 size-4 shrink-0 text-green-500" />
                                            ) : (
                                                <XIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
                                            )}
                                            <span
                                                className={cn(
                                                    feature.included
                                                        ? 'text-foreground'
                                                        : 'text-muted-foreground/50',
                                                )}
                                            >
                                                {feature.name}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                {auth.user ? (
                                    <Button
                                        variant={plan.ctaVariant}
                                        className={cn(
                                            'w-full',
                                            plan.popular &&
                                            plan.ctaVariant === 'default' &&
                                            'bg-linear-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90',
                                        )}
                                    >
                                        {plan.name === 'Free'
                                            ? 'Current Plan'
                                            : 'Upgrade Now'}
                                    </Button>
                                ) : (
                                    <Button
                                        variant={plan.ctaVariant}
                                        className={cn(
                                            'w-full',
                                            plan.popular &&
                                            plan.ctaVariant === 'default' &&
                                            'bg-linear-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90',
                                        )}
                                        asChild
                                    >
                                        <Link href={register()}>
                                            {plan.cta}
                                        </Link>
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {/* Additional info */}
                <p className="mt-8 text-center text-sm text-muted-foreground">
                    🔒 Secure payments via Stripe • Cancel anytime
                </p>
            </div>
        </section>
    );
}
