import { Link, usePage } from '@inertiajs/react';
import { ArrowRightIcon } from 'lucide-react';
import { motion } from 'motion/react';

import { LogoLoop } from '@/components/logo-loop';
import { BackgroundBeamsWithCollision } from '@/components/ui/background-beams-with-collision';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard, register } from '@/routes';
import { type SharedData } from '@/types';

import { partnerLogos } from '../data/constants';

interface HeroSectionProps {
    canRegister?: boolean;
}

export function HeroSection({ canRegister = true }: HeroSectionProps) {
    const { auth } = usePage<SharedData>().props;

    const logos = partnerLogos.map((logo) => ({
        node: (
            <img
                src={logo.src}
                alt={logo.name}
                className={`h-6 w-auto opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0 ${logo.darkInvert ? 'dark:invert' : ''
                    }`}
            />
        ),
    }));

    return (
        <BackgroundBeamsWithCollision className="min-h-[calc(50dvh-12rem)] bg-background">
            <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="flex items-center gap-2.5 rounded-full border bg-muted px-3 py-2"
                >
                    <Badge>New</Badge>
                    <span className="text-sm text-muted-foreground">
                        AI-Powered Productivity
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
                    className="text-3xl leading-tight font-bold text-balance sm:text-4xl lg:text-6xl"
                >
                    Achieve Your
                    <span className="text-primary"> Flow State</span>
                    <br />
                    Every Single Day
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className="max-w-2xl text-lg text-muted-foreground"
                >
                    Larify helps you focus, plan, and accomplish more with
                    intelligent task management and distraction-free work
                    sessions. Get more done in less time.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    className="flex flex-wrap items-center justify-center gap-4"
                >
                    {auth.user ? (
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button size="lg" asChild>
                                <Link href={dashboard()}>
                                    Go to Dashboard
                                    <ArrowRightIcon className="ml-2 size-4" />
                                </Link>
                            </Button>
                        </motion.div>
                    ) : (
                        <>
                            {canRegister && (
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button size="lg" asChild>
                                        <Link href={register()}>
                                            Get Started
                                            <ArrowRightIcon className="ml-2 size-4" />
                                        </Link>
                                    </Button>
                                </motion.div>
                            )}
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Button size="lg" variant="outline" asChild>
                                    <a href="#features">Learn More</a>
                                </Button>
                            </motion.div>
                        </>
                    )}
                </motion.div>

                {/* Partner Logos */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.6 }}
                    className="mt-4 w-full max-w-3xl"
                >
                    <p className="mb-4 text-sm text-muted-foreground">
                        Trusted by teams at
                    </p>
                    <LogoLoop
                        logos={logos}
                        speed={60}
                        pauseOnHover
                        fadeOut
                        logoHeight={24}
                        gap={48}
                        ariaLabel="Trusted partner companies"
                    />
                </motion.div>
            </div>
        </BackgroundBeamsWithCollision>
    );
}
