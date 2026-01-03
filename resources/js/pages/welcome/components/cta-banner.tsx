import { Link, usePage } from '@inertiajs/react';
import { ArrowRightIcon, SparklesIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { dashboard, register } from '@/routes';
import { type SharedData } from '@/types';

interface CTABannerProps {
    canRegister?: boolean;
}

export function CTABanner({ canRegister = true }: CTABannerProps) {
    const { auth } = usePage<SharedData>().props;

    return (
        <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-linear-to-r from-primary via-purple-600 to-primary" />

            {/* Animated background elements */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 h-64 w-64 animate-pulse rounded-full bg-white/10 blur-3xl" />
                <div className="absolute bottom-0 right-1/4 h-64 w-64 animate-pulse rounded-full bg-white/10 blur-3xl delay-500" />
            </div>

            {/* Grid pattern */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
                    backgroundSize: '32px 32px',
                }}
            />

            <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                {/* Icon */}
                <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <SparklesIcon className="size-8 text-white" />
                </div>

                {/* Heading */}
                <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl md:text-4xl lg:text-5xl">
                    Ready to Boost Your Productivity?
                </h2>

                {/* Description */}
                <p className="mx-auto mb-8 max-w-2xl text-base text-white/80 sm:text-lg">
                    Join thousands of professionals who have transformed their workflow
                    with Laraflow. Start your free trial today and experience the difference.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                    {auth.user ? (
                        <Button
                            size="lg"
                            className="w-full bg-white text-primary hover:bg-white/90 sm:w-auto"
                            asChild
                        >
                            <Link href={dashboard()}>
                                Go to Dashboard
                                <ArrowRightIcon className="ml-2 size-4" />
                            </Link>
                        </Button>
                    ) : (
                        <>
                            {canRegister && (
                                <Button
                                    size="lg"
                                    className="w-full bg-white text-primary hover:bg-white/90 sm:w-auto"
                                    asChild
                                >
                                    <Link href={register()}>
                                        Start Free Trial
                                        <ArrowRightIcon className="ml-2 size-4" />
                                    </Link>
                                </Button>
                            )}
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 sm:w-auto"
                                asChild
                            >
                                <a href="#contact">Talk to Sales</a>
                            </Button>
                        </>
                    )}
                </div>

                {/* Trust badges */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
                    <span>✓ 14-day free trial</span>
                    <span>✓ No credit card required</span>
                    <span>✓ Cancel anytime</span>
                </div>
            </div>
        </section>
    );
}
