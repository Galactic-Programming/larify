import { useEffect, useRef, useState } from 'react';

import { CircleCheckIcon } from 'lucide-react';

import { socialProofFeatures } from '../data/constants';

interface SocialProofSectionProps {
    activeUsersCount?: number;
}

function AnimatedCounter({
    target,
    suffix = '',
}: {
    target: number;
    suffix?: string;
}) {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setHasAnimated(true);
                    const duration = 1500; // Faster animation
                    const steps = 40;
                    const increment = target / steps;
                    let current = 0;

                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            setCount(target);
                            clearInterval(timer);
                        } else {
                            setCount(Math.floor(current));
                        }
                    }, duration / steps);
                }
            },
            { threshold: 0.5 },
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [target, hasAnimated]);

    return (
        <div ref={ref} className="mb-2 text-4xl font-bold sm:text-5xl lg:text-6xl">
            {count.toLocaleString()}
            {suffix}
        </div>
    );
}

export function SocialProofSection({ activeUsersCount = 0 }: SocialProofSectionProps) {
    return (
        <section className="py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
                    {/* Content */}
                    <div className="flex-1">
                        <div className="space-y-3 sm:space-y-4">
                            <p className="text-sm font-medium text-primary uppercase">
                                Why Laraflow
                            </p>
                            <h2 className="text-2xl font-semibold md:text-3xl lg:text-4xl">
                                Everything You Need to Achieve Peak Productivity
                            </h2>
                            <p className="text-base text-muted-foreground sm:text-lg">
                                Laraflow combines the best productivity techniques
                                with modern AI to help you work smarter, not
                                harder. Join thousands of professionals who have
                                transformed their workflow.
                            </p>
                        </div>

                        <ul className="mt-6 grid gap-3 sm:mt-8 sm:gap-4 md:grid-cols-2 lg:grid-cols-1">
                            {socialProofFeatures.map((feature, index) => (
                                <li
                                    key={index}
                                    className="flex items-start gap-2 text-base font-medium sm:text-lg"
                                >
                                    <CircleCheckIcon className="mt-0.5 size-5 shrink-0 text-primary" />
                                    <span>{feature.title}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Stats Image */}
                    <div className="w-full max-w-sm shrink-0 lg:w-auto">
                        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl sm:size-72 lg:size-80">
                            <img
                                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                                alt="Team working together"
                                className="absolute inset-0 h-full w-full object-cover"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/60" />
                            <div className="relative z-10 text-center text-white">
                                <AnimatedCounter target={activeUsersCount} suffix="+" />
                                <div className="text-sm opacity-90 sm:text-base lg:text-lg">
                                    Active Users
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
