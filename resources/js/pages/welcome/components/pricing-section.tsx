import { Link, usePage } from '@inertiajs/react';
import { CheckIcon, SparklesIcon, XIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { register } from '@/routes';
import { type SharedData } from '@/types';
import { cn } from '@/lib/utils';

type PricingPlan = {
    name: string;
    description: string;
    price: string;
    period: string;
    popular?: boolean;
    features: { name: string; included: boolean }[];
    cta: string;
    ctaVariant: 'default' | 'outline';
};

const pricingPlans: PricingPlan[] = [
    {
        name: 'Free',
        description: 'Perfect for getting started',
        price: '$0',
        period: '/month',
        features: [
            { name: 'Up to 10 tasks per day', included: true },
            { name: 'Basic focus timer', included: true },
            { name: 'Single device sync', included: true },
            { name: 'Community support', included: true },
            { name: 'AI task suggestions', included: false },
            { name: 'Team collaboration', included: false },
            { name: 'Advanced analytics', included: false },
            { name: 'Priority support', included: false },
        ],
        cta: 'Get Started',
        ctaVariant: 'outline',
    },
    {
        name: 'Pro',
        description: 'Best for professionals',
        price: '$12',
        period: '/month',
        popular: true,
        features: [
            { name: 'Unlimited tasks', included: true },
            { name: 'Advanced focus mode', included: true },
            { name: 'All devices sync', included: true },
            { name: 'Email support', included: true },
            { name: 'AI task suggestions', included: true },
            { name: 'Team collaboration (up to 5)', included: true },
            { name: 'Advanced analytics', included: true },
            { name: 'Priority support', included: false },
        ],
        cta: 'Start Free Trial',
        ctaVariant: 'default',
    },
    {
        name: 'Enterprise',
        description: 'For large teams',
        price: '$49',
        period: '/month',
        features: [
            { name: 'Everything in Pro', included: true },
            { name: 'Unlimited team members', included: true },
            { name: 'SSO & SAML', included: true },
            { name: 'Custom integrations', included: true },
            { name: 'Advanced AI features', included: true },
            { name: 'Dedicated account manager', included: true },
            { name: 'Custom analytics', included: true },
            { name: '24/7 Priority support', included: true },
        ],
        cta: 'Contact Sales',
        ctaVariant: 'outline',
    },
];

export function PricingSection() {
    const { auth } = usePage<SharedData>().props;

    return (
        <section id="pricing" className="py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mx-auto max-w-3xl text-center mb-10 sm:mb-14">
                    <Badge variant="secondary" className="mb-4">
                        Pricing
                    </Badge>
                    <h2 className="text-2xl font-semibold mb-4 md:text-3xl lg:text-4xl">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="text-base text-muted-foreground sm:text-lg">
                        Choose the plan that fits your needs. All plans include a
                        14-day free trial with no credit card required.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
                    {pricingPlans.map((plan) => (
                        <Card
                            key={plan.name}
                            className={cn(
                                'relative flex flex-col transition-all duration-300 hover:shadow-lg',
                                plan.popular && 'border-primary shadow-lg scale-[1.02] lg:scale-105'
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

                            <CardHeader className="text-center pb-2">
                                <h3 className="text-xl font-semibold">{plan.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {plan.description}
                                </p>
                            </CardHeader>

                            <CardContent className="flex-1">
                                {/* Price */}
                                <div className="text-center mb-6">
                                    <span className="text-4xl font-bold">{plan.price}</span>
                                    <span className="text-muted-foreground">{plan.period}</span>
                                </div>

                                {/* Features */}
                                <ul className="space-y-3">
                                    {plan.features.map((feature) => (
                                        <li
                                            key={feature.name}
                                            className="flex items-start gap-2 text-sm"
                                        >
                                            {feature.included ? (
                                                <CheckIcon className="size-4 shrink-0 text-green-500 mt-0.5" />
                                            ) : (
                                                <XIcon className="size-4 shrink-0 text-muted-foreground/50 mt-0.5" />
                                            )}
                                            <span
                                                className={cn(
                                                    feature.included
                                                        ? 'text-foreground'
                                                        : 'text-muted-foreground/50'
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
                                            'bg-linear-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90'
                                        )}
                                    >
                                        {plan.name === 'Enterprise' ? 'Contact Sales' : 'Upgrade Now'}
                                    </Button>
                                ) : (
                                    <Button
                                        variant={plan.ctaVariant}
                                        className={cn(
                                            'w-full',
                                            plan.popular &&
                                            plan.ctaVariant === 'default' &&
                                            'bg-linear-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90'
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

                {/* Money back guarantee */}
                <p className="mt-8 text-center text-sm text-muted-foreground">
                    💰 30-day money-back guarantee • No questions asked
                </p>
            </div>
        </section>
    );
}
