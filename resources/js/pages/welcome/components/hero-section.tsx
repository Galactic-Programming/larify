import { Link, usePage } from '@inertiajs/react';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';

import { LogoLoop } from '@/components/logo-loop';
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
                loading="lazy"
                decoding="async"
                className={`h-6 w-auto opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0 ${logo.darkInvert ? 'dark:invert' : ''}`}
            />
        ),
    }));

    return (
        <section className="relative min-h-screen overflow-hidden">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 -z-10">
                {/* Base gradient */}
                <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-background to-purple-500/10" />

                {/* Animated gradient orbs */}
                <div className="absolute top-0 -left-40 h-96 w-96 animate-pulse rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute top-1/3 -right-40 h-96 w-96 animate-pulse rounded-full bg-purple-500/20 blur-3xl delay-1000" />
                <div className="absolute -bottom-40 left-1/3 h-96 w-96 animate-pulse rounded-full bg-cyan-500/20 blur-3xl delay-500" />

                {/* Grid pattern overlay */}
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            <div className="relative z-10 mx-auto flex max-w-7xl flex-col lg:flex-row items-center gap-8 px-4 py-12 sm:py-16 lg:py-24 sm:px-6 lg:px-8 lg:gap-12">
                {/* Left Content */}
                <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left gap-6 sm:gap-8">
                    {/* Badge */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 flex items-center gap-2.5 rounded-full border bg-background/80 px-3 py-2 backdrop-blur-sm duration-500">
                        <Badge>New</Badge>
                        <span className="text-sm text-muted-foreground">
                            AI-Powered Productivity
                        </span>
                    </div>

                    {/* Heading */}
                    <h1 className="animate-in fade-in slide-in-from-bottom-4 text-3xl leading-tight font-bold text-balance delay-100 duration-500 sm:text-4xl md:text-5xl lg:text-6xl">
                        Achieve Your
                        <span className="bg-linear-to-r from-primary to-purple-600 bg-clip-text text-transparent"> Flow State</span>
                        <br className="hidden sm:block" />
                        <span className="sm:hidden"> </span>
                        Every Single Day
                    </h1>

                    {/* Description */}
                    <p className="animate-in fade-in slide-in-from-bottom-4 max-w-xl text-base leading-relaxed text-muted-foreground delay-200 duration-500 sm:text-lg">
                        Laraflow helps you focus, plan, and accomplish more with
                        intelligent task management and distraction-free work
                        sessions. Get more done in less time.
                    </p>

                    {/* CTA Buttons */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 flex w-full flex-col items-center lg:items-start justify-center gap-3 delay-300 duration-500 sm:w-auto sm:flex-row sm:gap-4">
                        {auth.user ? (
                            <Button size="lg" className="w-full sm:w-auto" asChild>
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
                                        className="w-full sm:w-auto bg-linear-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                                        asChild
                                    >
                                        <Link href={register()}>
                                            Get Started Free
                                            <ArrowRightIcon className="ml-2 size-4" />
                                        </Link>
                                    </Button>
                                )}
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full sm:w-auto backdrop-blur-sm"
                                    asChild
                                >
                                    <a href="#features">Learn More</a>
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Quick features */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-muted-foreground delay-400 duration-500">
                        <span className="flex items-center gap-1.5">
                            <CheckIcon className="size-4 text-green-500" />
                            Free 14-day trial
                        </span>
                        <span className="flex items-center gap-1.5">
                            <CheckIcon className="size-4 text-green-500" />
                            No credit card required
                        </span>
                        <span className="flex items-center gap-1.5">
                            <CheckIcon className="size-4 text-green-500" />
                            Cancel anytime
                        </span>
                    </div>
                </div>

                {/* Right Content - Product Mockup */}
                <div className="animate-in fade-in slide-in-from-right-8 flex-1 w-full max-w-2xl lg:max-w-none delay-300 duration-700">
                    <div className="relative">
                        {/* Glow effect behind mockup */}
                        <div className="absolute -inset-4 bg-linear-to-r from-primary/30 to-purple-500/30 rounded-2xl blur-2xl opacity-60" />

                        {/* Browser mockup */}
                        <div className="relative rounded-xl border bg-background/80 backdrop-blur-sm shadow-2xl overflow-hidden">
                            {/* Browser header */}
                            <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
                                <div className="flex gap-1.5">
                                    <div className="size-3 rounded-full bg-red-500" />
                                    <div className="size-3 rounded-full bg-yellow-500" />
                                    <div className="size-3 rounded-full bg-green-500" />
                                </div>
                                <div className="flex-1 mx-4">
                                    <div className="mx-auto max-w-sm rounded-md bg-background/80 px-3 py-1.5 text-xs text-muted-foreground text-center">
                                        app.laraflow.com/dashboard
                                    </div>
                                </div>
                            </div>

                            {/* Dashboard preview */}
                            <div className="p-4 sm:p-6">
                                {/* Stats row */}
                                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                                    <div className="rounded-lg bg-linear-to-br from-primary/10 to-primary/5 p-3 sm:p-4">
                                        <div className="text-lg sm:text-2xl font-bold">12</div>
                                        <div className="text-xs text-muted-foreground">Tasks Today</div>
                                    </div>
                                    <div className="rounded-lg bg-linear-to-br from-green-500/10 to-green-500/5 p-3 sm:p-4">
                                        <div className="text-lg sm:text-2xl font-bold text-green-600">8</div>
                                        <div className="text-xs text-muted-foreground">Completed</div>
                                    </div>
                                    <div className="rounded-lg bg-linear-to-br from-purple-500/10 to-purple-500/5 p-3 sm:p-4">
                                        <div className="text-lg sm:text-2xl font-bold text-purple-600">2.5h</div>
                                        <div className="text-xs text-muted-foreground">Focus Time</div>
                                    </div>
                                </div>

                                {/* Task list preview */}
                                <div className="space-y-2 sm:space-y-3">
                                    <div className="flex items-center gap-3 rounded-lg border bg-background/50 p-3">
                                        <div className="size-5 rounded-full border-2 border-green-500 flex items-center justify-center">
                                            <CheckIcon className="size-3 text-green-500" />
                                        </div>
                                        <span className="flex-1 text-sm line-through text-muted-foreground">Review project proposal</span>
                                        <Badge variant="secondary" className="text-xs">Done</Badge>
                                    </div>
                                    <div className="flex items-center gap-3 rounded-lg border border-primary/50 bg-primary/5 p-3">
                                        <div className="size-5 rounded-full border-2 border-primary animate-pulse" />
                                        <span className="flex-1 text-sm font-medium">Design system documentation</span>
                                        <Badge className="text-xs">In Progress</Badge>
                                    </div>
                                    <div className="flex items-center gap-3 rounded-lg border bg-background/50 p-3">
                                        <div className="size-5 rounded-full border-2 border-muted-foreground/30" />
                                        <span className="flex-1 text-sm">Team standup meeting</span>
                                        <Badge variant="outline" className="text-xs">2:00 PM</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Partner Logos - Full width */}
            <div className="relative z-10 border-t bg-background/50 backdrop-blur-sm">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <p className="mb-4 text-center text-sm text-muted-foreground">
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
                </div>
            </div>
        </section>
    );
}
