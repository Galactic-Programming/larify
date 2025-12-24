import { type ComponentType, useEffect, useRef, useState } from 'react';

import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRightIcon,
    CalendarIcon,
    CheckCircle2Icon,
    CircleCheckIcon,
    ClockIcon,
    LayoutDashboardIcon,
    MailIcon,
    MapPinIcon,
    MenuIcon,
    PhoneIcon,
    TargetIcon,
    ZapIcon,
} from 'lucide-react';
import { motion } from 'motion/react';

import LarifyLogo from '@/assets/svg/larify-logo';
import { LogoLoop } from '@/components/logo-loop';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BackgroundBeamsWithCollision } from '@/components/ui/background-beams-with-collision';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';

// ============================================================================
// Types
// ============================================================================

type NavigationItem = {
    title: string;
    href: string;
};

type Feature = {
    icon: ComponentType;
    title: string;
    description: string;
    cardBorderColor: string;
    hoverTextColor: string;
    hoverBgColor: string;
};

type Testimonial = {
    name: string;
    role: string;
    company: string;
    avatar: string;
    rating: number;
    content: string;
};

type FAQItem = {
    question: string;
    answer: string;
};

type SocialProofFeature = {
    title: string;
    description: string;
};

type ContactInfo = {
    title: string;
    icon: ComponentType;
    description: string;
};

// ============================================================================
// Data
// ============================================================================

const navigationItems: NavigationItem[] = [
    { title: 'Features', href: '#features' },
    { title: 'Testimonials', href: '#testimonials' },
    { title: 'FAQ', href: '#faq' },
    { title: 'Contact', href: '#contact' },
];

const socialProofFeatures: SocialProofFeature[] = [
    { title: 'AI-powered task prioritization', description: '' },
    { title: 'Seamless calendar integration', description: '' },
    { title: 'Cross-platform synchronization', description: '' },
    { title: 'Advanced analytics and insights', description: '' },
    { title: 'Team collaboration tools', description: '' },
];

const contactInfo: ContactInfo[] = [
    {
        title: 'Email Us',
        icon: MailIcon,
        description: 'Larify@gmail.com',
    },
    {
        title: 'Call Us',
        icon: PhoneIcon,
        description: '+84 (1900) 292-968\nMonday-Friday\n9am-6pm',
    },
    {
        title: 'Visit Us',
        icon: MapPinIcon,
        description:
            '5th Floor – Emporium Tower, 184 Le Dai Hanh, Ward. Phu Tho, HCM City',
    },
];

const testimonials: Testimonial[] = [
    {
        name: 'Sarah Chen',
        role: 'Product Manager',
        company: 'TechCorp',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        rating: 5,
        content:
            'Larify has completely transformed how I manage my daily tasks. The focus mode is a game-changer for deep work sessions.',
    },
    {
        name: 'Michael Rodriguez',
        role: 'Software Engineer',
        company: 'StartupXYZ',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
        rating: 5,
        content:
            'Finally, a productivity app that understands developers. The keyboard shortcuts and quick actions save me hours every week.',
    },
    {
        name: 'Emily Watson',
        role: 'Freelance Designer',
        company: 'Self-employed',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
        rating: 4.5,
        content:
            'As a freelancer, tracking time across multiple projects was always a pain. Larify makes it effortless and even enjoyable.',
    },
    {
        name: 'David Kim',
        role: 'Marketing Director',
        company: 'GrowthLab',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
        rating: 5,
        content:
            'The smart scheduling feature has helped our entire team become more productive. Highly recommend for any team leader.',
    },
];

const faqItems: FAQItem[] = [
    {
        question: 'What is Larify?',
        answer: 'Larify is an AI-powered productivity application designed to help you achieve deep focus, manage tasks efficiently, and track your time. It combines intelligent scheduling, distraction blocking, and project management in one seamless experience.',
    },
    {
        question: 'Is there a free plan available?',
        answer: 'Yes! We offer a free plan with essential features to get you started. You can explore Larify and upgrade to a paid plan anytime for access to premium features.',
    },
    {
        question: 'How does the Focus Mode work?',
        answer: 'Focus Mode creates a distraction-free environment by blocking notifications, muting non-essential apps, and tracking your focus sessions. You can customize the duration and intensity of your focus sessions based on your preferences.',
    },
    {
        question: 'Can I use Larify with my team?',
        answer: 'Absolutely! Larify offers team plans that include shared projects, collaborative task management, and team analytics. You can easily assign tasks, track team progress, and improve overall productivity together.',
    },
    {
        question: 'What platforms does Larify support?',
        answer: 'Larify is available on Web, macOS, Windows, iOS, and Android. Your data syncs seamlessly across all devices, so you can stay productive wherever you are.',
    },
    {
        question: 'How secure is my data?',
        answer: 'We take security seriously. All data is encrypted in transit and at rest. We use industry-standard security practices and never share your personal information with third parties.',
    },
];

const features: Feature[] = [
    {
        icon: TargetIcon,
        title: 'Focus Mode',
        description:
            'Eliminate distractions and enter deep work sessions with our intelligent focus mode that blocks interruptions.',
        cardBorderColor: 'hover:border-blue-500/50',
        hoverTextColor: 'group-hover:text-blue-600',
        hoverBgColor: 'group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30',
    },
    {
        icon: CalendarIcon,
        title: 'Smart Scheduling',
        description:
            'AI-powered scheduling that learns your productivity patterns and suggests optimal times for different tasks.',
        cardBorderColor: 'hover:border-green-500/50',
        hoverTextColor: 'group-hover:text-green-600',
        hoverBgColor:
            'group-hover:bg-green-100 dark:group-hover:bg-green-900/30',
    },
    {
        icon: LayoutDashboardIcon,
        title: 'Project Dashboard',
        description:
            "Get a bird's eye view of all your projects with intuitive dashboards and progress tracking.",
        cardBorderColor: 'hover:border-purple-500/50',
        hoverTextColor: 'group-hover:text-purple-600',
        hoverBgColor:
            'group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30',
    },
    {
        icon: ClockIcon,
        title: 'Time Tracking',
        description:
            'Automatic time tracking with detailed reports to help you understand where your time goes.',
        cardBorderColor: 'hover:border-orange-500/50',
        hoverTextColor: 'group-hover:text-orange-600',
        hoverBgColor:
            'group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30',
    },
    {
        icon: ZapIcon,
        title: 'Quick Actions',
        description:
            'Keyboard shortcuts and quick actions to manage tasks without breaking your flow state.',
        cardBorderColor: 'hover:border-yellow-500/50',
        hoverTextColor: 'group-hover:text-yellow-600',
        hoverBgColor:
            'group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/30',
    },
    {
        icon: CheckCircle2Icon,
        title: 'Task Management',
        description:
            'Organize tasks with priorities, tags, and due dates. Never miss a deadline again.',
        cardBorderColor: 'hover:border-red-500/50',
        hoverTextColor: 'group-hover:text-red-600',
        hoverBgColor: 'group-hover:bg-red-100 dark:group-hover:bg-red-900/30',
    },
];

// ============================================================================
// Header Component
// ============================================================================

function Header({ canRegister = true }: { canRegister?: boolean }) {
    const { auth } = usePage<SharedData>().props;

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="sticky top-0 z-50 h-16 border-b bg-background"
        >
            <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
                {/* LarifyLogo */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                >
                    <Link href="/" className="flex items-center gap-2">
                        <LarifyLogo className="size-8" />
                        <span className="text-xl font-bold">Larify</span>
                    </Link>
                </motion.div>

                {/* Navigation */}
                <NavigationMenu className="max-md:hidden">
                    <NavigationMenuList className="flex-wrap justify-start gap-0">
                        {navigationItems.map((item, index) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: 0.3 + index * 0.1,
                                    duration: 0.3,
                                }}
                            >
                                <NavigationMenuItem>
                                    <NavigationMenuLink
                                        href={item.href}
                                        className="px-3 py-1.5 text-base font-medium text-muted-foreground hover:bg-transparent hover:text-primary"
                                    >
                                        {item.title}
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            </motion.div>
                        ))}
                    </NavigationMenuList>
                </NavigationMenu>

                {/* Auth Buttons */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                    className="flex items-center gap-2 max-md:hidden"
                >
                    {auth.user ? (
                        <Button className="rounded-lg" asChild>
                            <Link href={dashboard()}>Dashboard</Link>
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                className="rounded-lg"
                                asChild
                            >
                                <Link href={login()}>Log in</Link>
                            </Button>
                            {canRegister && (
                                <Button className="rounded-lg" asChild>
                                    <Link href={register()}>Get Started</Link>
                                </Button>
                            )}
                        </>
                    )}
                </motion.div>

                {/* Mobile Navigation */}
                <div className="flex gap-2 md:hidden">
                    {auth.user ? (
                        <Button className="rounded-lg" size="sm" asChild>
                            <Link href={dashboard()}>Dashboard</Link>
                        </Button>
                    ) : (
                        <Button className="rounded-lg" size="sm" asChild>
                            <Link href={login()}>Log in</Link>
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MenuIcon />
                                <span className="sr-only">Menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            {navigationItems.map((item) => (
                                <DropdownMenuItem key={item.title} asChild>
                                    <a href={item.href}>{item.title}</a>
                                </DropdownMenuItem>
                            ))}
                            {!auth.user && canRegister && (
                                <>
                                    <Separator className="my-1" />
                                    <DropdownMenuItem asChild>
                                        <Link href={register()}>
                                            Get Started
                                        </Link>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </motion.header>
    );
}

// ============================================================================
// Hero Section Component
// ============================================================================

function HeroSection({ canRegister = true }: { canRegister?: boolean }) {
    const { auth } = usePage<SharedData>().props;

    const partnerLogos = [
        {
            node: (
                <img
                    src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/google/google-original.svg"
                    alt="Google"
                    className="h-6 w-auto opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0"
                />
            ),
        },
        {
            node: (
                <img
                    src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/apple/apple-original.svg"
                    alt="Apple"
                    className="h-6 w-auto opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0 dark:invert"
                />
            ),
        },
        {
            node: (
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
                    alt="Microsoft"
                    className="h-6 w-auto opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0"
                />
            ),
        },
        {
            node: (
                <img
                    src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/slack/slack-original.svg"
                    alt="Slack"
                    className="h-6 w-auto opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0"
                />
            ),
        },
        {
            node: (
                <img
                    src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/trello/trello-original.svg"
                    alt="Trello"
                    className="h-6 w-auto opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0"
                />
            ),
        },
        {
            node: (
                <img
                    src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg"
                    alt="Figma"
                    className="h-6 w-auto opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0"
                />
            ),
        },
        {
            node: (
                <img
                    src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/notion/notion-original.svg"
                    alt="Notion"
                    className="h-6 w-auto opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0 dark:invert"
                />
            ),
        },
        {
            node: (
                <img
                    src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg"
                    alt="GitHub"
                    className="h-6 w-auto opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0 dark:invert"
                />
            ),
        },
    ];

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
                        logos={partnerLogos}
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

// ============================================================================
// Features Section Component
// ============================================================================

function FeaturesSection() {
    return (
        <section id="features" className="py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6 }}
                    className="mb-8 space-y-3 sm:mb-10 lg:mb-12"
                >
                    <h2 className="text-2xl font-semibold md:text-3xl lg:text-4xl">
                        Everything You Need to Stay Productive
                    </h2>
                    <p className="max-w-3xl text-lg text-muted-foreground">
                        Powerful features designed to help you focus, organize,
                        and accomplish your goals with ease.
                    </p>
                </motion.div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-50px' }}
                            transition={{
                                delay: index * 0.1,
                                duration: 0.5,
                                ease: 'easeOut',
                            }}
                            whileHover={{
                                y: -8,
                                transition: { duration: 0.2 },
                            }}
                        >
                            <Card
                                className={cn(
                                    'group h-full shadow-none transition-all duration-300 hover:shadow-lg',
                                    feature.cardBorderColor,
                                )}
                            >
                                <CardContent>
                                    <Avatar
                                        className={cn(
                                            'mb-6 size-10 rounded-md text-foreground transition-colors duration-300',
                                            feature.hoverTextColor,
                                        )}
                                    >
                                        <AvatarFallback
                                            className={cn(
                                                'rounded-md bg-muted transition-colors duration-300 [&>svg]:size-6',
                                                feature.hoverBgColor,
                                            )}
                                        >
                                            <feature.icon />
                                        </AvatarFallback>
                                    </Avatar>
                                    <h6 className="mb-2 text-lg font-semibold">
                                        {feature.title}
                                    </h6>
                                    <p className="text-muted-foreground">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// Testimonials Section Component
// ============================================================================

function TestimonialsSection() {
    return (
        <section id="testimonials" className="py-12 sm:py-16 lg:py-20">
            <Carousel
                className="mx-auto flex max-w-7xl gap-8 px-4 max-sm:flex-col sm:items-center sm:gap-10 sm:px-6 lg:gap-12 lg:px-8"
                opts={{
                    align: 'start',
                    slidesToScroll: 1,
                }}
            >
                {/* Left Content */}
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6 }}
                    className="space-y-4 sm:w-1/2 lg:w-1/3"
                >
                    <p className="text-sm font-medium text-primary uppercase">
                        Real customers
                    </p>
                    <h2 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">
                        What Our Users Say
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Discover how Larify has helped thousands achieve their
                        productivity goals.
                    </p>
                    <div className="flex items-center gap-4">
                        <CarouselPrevious
                            variant="default"
                            className="static translate-y-0 rounded-md disabled:bg-primary/10 disabled:text-primary disabled:opacity-100"
                        />
                        <CarouselNext
                            variant="default"
                            className="static translate-y-0 rounded-md disabled:bg-primary/10 disabled:text-primary disabled:opacity-100"
                        />
                    </div>
                </motion.div>

                {/* Right Testimonial Carousel */}
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="relative max-w-196 sm:w-1/2 lg:w-2/3"
                >
                    <CarouselContent className="sm:-ml-6">
                        {testimonials.map((testimonial, index) => (
                            <CarouselItem
                                key={index}
                                className="sm:pl-6 lg:basis-1/2"
                            >
                                <Card className="h-full transition-colors duration-300 hover:border-primary">
                                    <CardContent className="space-y-5">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-10 rounded-full">
                                                <AvatarImage
                                                    src={testimonial.avatar}
                                                    alt={testimonial.name}
                                                />
                                                <AvatarFallback className="rounded-full text-sm">
                                                    {testimonial.name
                                                        .split(' ', 2)
                                                        .map((n) => n[0])
                                                        .join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <h4 className="font-medium">
                                                    {testimonial.name}
                                                </h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {testimonial.role} at{' '}
                                                    <span className="font-semibold text-card-foreground">
                                                        {testimonial.company}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {Array.from({ length: 5 }).map(
                                                (_, i) => (
                                                    <svg
                                                        key={i}
                                                        className={cn(
                                                            'size-5',
                                                            i <
                                                                testimonial.rating
                                                                ? 'text-yellow-400'
                                                                : 'text-gray-300',
                                                        )}
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ),
                                            )}
                                        </div>
                                        <p className="text-muted-foreground">
                                            {testimonial.content}
                                        </p>
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </motion.div>
            </Carousel>
        </section>
    );
}

// ============================================================================
// FAQ Section Component
// ============================================================================

function FAQSection() {
    return (
        <section id="faq" className="bg-muted/50 py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* FAQ Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6 }}
                    className="mb-8 space-y-3 text-center sm:mb-10 lg:mb-12"
                >
                    <h2 className="text-2xl font-semibold md:text-3xl lg:text-4xl">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Everything you need to know about Larify. Can't find
                        what you're looking for? Contact us.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mx-auto max-w-3xl"
                >
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full"
                        defaultValue="item-1"
                    >
                        {faqItems.map((item, index) => (
                            <AccordionItem
                                key={index}
                                value={`item-${index + 1}`}
                            >
                                <AccordionTrigger className="text-left text-lg">
                                    {item.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-base text-muted-foreground">
                                    {item.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </motion.div>
            </div>
        </section>
    );
}

// ============================================================================
// Animated Counter Component
// ============================================================================

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

// ============================================================================
// Social Proof Section Component
// ============================================================================

function SocialProofSection() {
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

// ============================================================================
// Contact Section Component
// ============================================================================

function ContactSection() {
    return (
        <section id="contact" className="bg-muted py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.5 }}
                    className="relative mx-auto mb-8 w-fit sm:mb-10 lg:mb-12"
                >
                    <h2 className="text-2xl font-semibold md:text-3xl lg:text-4xl">
                        Get in Touch
                    </h2>
                    <motion.span
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="absolute top-9 left-0 h-px w-full origin-left bg-primary"
                    />
                </motion.div>

                <div className="grid items-center gap-12 lg:grid-cols-2">
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.6 }}
                        whileHover={{ scale: 1.02 }}
                        className="flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-primary/10 lg:aspect-square"
                    >
                        <img
                            src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80"
                            alt="Team collaboration"
                            className="h-full w-full object-cover"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <h3 className="mb-6 text-2xl font-semibold">
                            Happy to help you!
                        </h3>
                        <p className="mb-10 text-lg font-medium text-muted-foreground">
                            Have questions about Larify? Want to learn more
                            about our team plans? Or just want to say hello?
                            We're here for you.
                        </p>

                        {/* Contact Info Grid */}
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {contactInfo.map((info, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        delay: 0.3 + index * 0.1,
                                        duration: 0.4,
                                    }}
                                >
                                    <HoverCard openDelay={100} closeDelay={100}>
                                        <HoverCardTrigger asChild>
                                            <Card className="h-full cursor-pointer border-none shadow-none transition-all hover:-translate-y-1 hover:shadow-md">
                                                <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
                                                    <Avatar className="size-12 border">
                                                        <AvatarFallback className="bg-primary/10 [&>svg]:size-6">
                                                            <info.icon />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </CardContent>
                                            </Card>
                                        </HoverCardTrigger>
                                        <HoverCardContent
                                            className="w-72"
                                            side="top"
                                            align="center"
                                        >
                                            <div className="flex justify-between gap-4">
                                                <Avatar className="size-10">
                                                    <AvatarFallback className="bg-primary/10 [&>svg]:size-5">
                                                        <info.icon />
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 space-y-1">
                                                    <h4 className="text-sm font-semibold">
                                                        {info.title}
                                                    </h4>
                                                    <div className="text-sm text-muted-foreground">
                                                        {info.description
                                                            .split('\n')
                                                            .map(
                                                                (line, idx) => (
                                                                    <p
                                                                        key={
                                                                            idx
                                                                        }
                                                                    >
                                                                        {line}
                                                                    </p>
                                                                ),
                                                            )}
                                                    </div>
                                                </div>
                                            </div>
                                        </HoverCardContent>
                                    </HoverCard>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

// ============================================================================
// Footer Component
// ============================================================================

function Footer() {
    return (
        <motion.footer
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="border-t"
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 max-md:flex-col sm:px-6 sm:py-6 md:gap-6 md:py-8">
                <Link href="/" className="flex items-center gap-2">
                    <LarifyLogo className="size-6" />
                    <span className="font-semibold">Larify</span>
                </Link>

                <div className="flex items-center gap-5 text-sm whitespace-nowrap text-muted-foreground">
                    {['#features', '#testimonials', '#faq', '#contact'].map(
                        (href) => (
                            <motion.a
                                key={href}
                                href={href}
                                whileHover={{ y: -2 }}
                                className="transition-colors hover:text-foreground"
                            >
                                {href.replace('#', '').charAt(0).toUpperCase() +
                                    href.slice(2)}
                            </motion.a>
                        ),
                    )}
                </div>
            </div>

            <Separator />

            <div className="mx-auto flex max-w-7xl justify-center px-4 py-6 sm:px-6">
                <p className="text-center text-sm text-balance text-muted-foreground">
                    © {new Date().getFullYear()} Larify - All rights reserved.
                </p>
            </div>
        </motion.footer>
    );
}

// ============================================================================
// Main Welcome Page
// ============================================================================

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    return (
        <>
            <Head title="Welcome to Larify" />
            <div className="min-h-screen bg-background text-foreground">
                <Header canRegister={canRegister} />
                <main>
                    <HeroSection canRegister={canRegister} />
                    <FeaturesSection />
                    <SocialProofSection />
                    <TestimonialsSection />
                    <FAQSection />
                    <ContactSection />
                </main>
                <Footer />
            </div>
        </>
    );
}
