import { useEffect, useRef, useState } from 'react';

import { CircleCheckIcon } from 'lucide-react';
import { motion } from 'motion/react';

import { socialProofFeatures } from '../data/constants';

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
                    const duration = 2000;
                    const steps = 60;
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
        <div ref={ref} className="mb-2 text-5xl font-bold lg:text-6xl">
            {count.toLocaleString()}
            {suffix}
        </div>
    );
}

export function SocialProofSection() {
    return (
        <section className="py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-12 max-lg:flex-col lg:gap-16">
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="space-y-4">
                            <p className="text-sm font-medium text-primary uppercase">
                                Why Larify
                            </p>
                            <h2 className="text-2xl font-semibold md:text-3xl lg:text-4xl">
                                Everything You Need to Achieve Peak Productivity
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                Larify combines the best productivity techniques
                                with modern AI to help you work smarter, not
                                harder. Join thousands of professionals who have
                                transformed their workflow.
                            </p>
                        </div>

                        <ul className="mt-11 space-y-6 text-lg font-medium">
                            {socialProofFeatures.map((feature, index) => (
                                <motion.li
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        delay: 0.3 + index * 0.1,
                                        duration: 0.4,
                                    }}
                                    className="flex gap-2"
                                >
                                    <CircleCheckIcon className="mt-0.75 size-5 text-primary" />
                                    <span>{feature.title}</span>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        whileHover={{ scale: 1.02 }}
                        className="shrink-0"
                    >
                        <div className="relative flex size-72 items-center justify-center overflow-hidden rounded-2xl lg:size-80">
                            <img
                                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                                alt="Team working together"
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60" />
                            <div className="relative z-10 text-center text-white">
                                <AnimatedCounter target={1000} suffix="+" />
                                <div className="text-base opacity-90 lg:text-lg">
                                    Active Users
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
