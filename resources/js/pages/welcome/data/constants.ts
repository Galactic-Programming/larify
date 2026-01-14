import type { ComponentType } from 'react';

import {
    CalendarIcon,
    CheckCircle2Icon,
    ClockIcon,
    LayoutDashboardIcon,
    MailIcon,
    MapPinIcon,
    PhoneIcon,
    TargetIcon,
    ZapIcon,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type NavigationItem = {
    title: string;
    href: string;
};

export type Feature = {
    icon: ComponentType;
    title: string;
    description: string;
    cardBorderColor: string;
    hoverTextColor: string;
    hoverBgColor: string;
};

export type Testimonial = {
    name: string;
    role: string;
    company: string;
    avatar: string;
    rating: number;
    content: string;
};

export type FAQItem = {
    question: string;
    answer: string;
};

export type SocialProofFeature = {
    title: string;
    description: string;
};

export type ContactInfo = {
    title: string;
    icon: ComponentType;
    description: string;
};

// ============================================================================
// Data
// ============================================================================

export const navigationItems: NavigationItem[] = [
    { title: 'Features', href: '#features' },
    { title: 'Pricing', href: '#pricing' },
    { title: 'Testimonials', href: '#testimonials' },
    { title: 'FAQ', href: '#faq' },
    { title: 'Contact', href: '#contact' },
];

export const socialProofFeatures: SocialProofFeature[] = [
    { title: 'AI-powered task prioritization', description: '' },
    { title: 'Seamless calendar integration', description: '' },
    { title: 'Cross-platform synchronization', description: '' },
    { title: 'Advanced analytics and insights', description: '' },
    { title: 'Team collaboration tools', description: '' },
];

export const contactInfo: ContactInfo[] = [
    {
        title: 'Email Us',
        icon: MailIcon,
        description: 'support@laraflow.com',
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

export const testimonials: Testimonial[] = [
    {
        name: 'Sarah Chen',
        role: 'Product Manager',
        company: 'TechCorp',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        rating: 5,
        content:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    },
    {
        name: 'Michael Rodriguez',
        role: 'Software Engineer',
        company: 'StartupXYZ',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
        rating: 5,
        content:
            'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    },
    {
        name: 'Emily Watson',
        role: 'Freelance Designer',
        company: 'Self-employed',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
        rating: 4.5,
        content:
            'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    },
    {
        name: 'David Kim',
        role: 'Marketing Director',
        company: 'GrowthLab',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
        rating: 5,
        content:
            'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    },
];

export const faqItems: FAQItem[] = [
    {
        question: 'What is Laraflow?',
        answer: 'Laraflow is an AI-powered productivity application designed to help you achieve deep focus, manage tasks efficiently, and track your time. It combines intelligent scheduling, distraction blocking, and project management in one seamless experience.',
    },
    {
        question: 'Is there a free plan available?',
        answer: 'Yes! We offer a free plan with essential features to get you started. You can explore Laraflow and upgrade to a paid plan anytime for access to premium features.',
    },
    {
        question: 'How does the Focus Mode work?',
        answer: 'Focus Mode creates a distraction-free environment by blocking notifications, muting non-essential apps, and tracking your focus sessions. You can customize the duration and intensity of your focus sessions based on your preferences.',
    },
    {
        question: 'Can I use Laraflow with my team?',
        answer: 'Absolutely! Laraflow offers team plans that include shared projects, collaborative task management, and team analytics. You can easily assign tasks, track team progress, and improve overall productivity together.',
    },
    {
        question: 'What platforms does Laraflow support?',
        answer: 'Laraflow is available on Web, macOS, Windows, iOS, and Android. Your data syncs seamlessly across all devices, so you can stay productive wherever you are.',
    },
    {
        question: 'How secure is my data?',
        answer: 'We take security seriously. All data is encrypted in transit and at rest. We use industry-standard security practices and never share your personal information with third parties.',
    },
];

export const features: Feature[] = [
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

export const partnerLogos = [
    {
        name: 'Google',
        src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/google/google-original.svg',
        darkInvert: false,
    },
    {
        name: 'Apple',
        src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/apple/apple-original.svg',
        darkInvert: true,
    },
    {
        name: 'Microsoft',
        src: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
        darkInvert: false,
    },
    {
        name: 'Slack',
        src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/slack/slack-original.svg',
        darkInvert: false,
    },
    {
        name: 'Trello',
        src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/trello/trello-original.svg',
        darkInvert: false,
    },
    {
        name: 'Figma',
        src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/figma/figma-original.svg',
        darkInvert: false,
    },
    {
        name: 'Notion',
        src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/notion/notion-original.svg',
        darkInvert: true,
    },
    {
        name: 'GitHub',
        src: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg',
        darkInvert: true,
    },
];
