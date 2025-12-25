import { GithubIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Separator } from '@/components/ui/separator';

import Logo from '@/assets/svg/logo';

export type NavLink = {
    label: string;
    href: string;
};

export type SocialLink = {
    icon: ReactNode;
    href: string;
    label?: string;
};

type Props = {
    navLinks?: NavLink[];
    socialLinks?: SocialLink[];
    brandName?: string;
    tagline?: string;
    showLogo?: boolean;
    className?: string;
};

const defaultNavLinks: NavLink[] = [
    { label: 'About', href: '/about' },
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Contact', href: '/contact' },
];

const defaultSocialLinks: SocialLink[] = [
    {
        icon: <GithubIcon className="size-5" />,
        href: 'https://github.com/Galactic-Programming/flow-state',
        label: 'GitHub',
    },
];

const Footer = ({
    navLinks = defaultNavLinks,
    socialLinks = defaultSocialLinks,
    brandName = 'LaraFlow',
    tagline = 'Made with ❤️ for better productivity',
    showLogo = true,
    className,
}: Props) => {
    return (
        <footer className={className}>
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 max-md:flex-col sm:px-6 sm:py-6 md:gap-6 md:py-8">
                {showLogo && (
                    <a href="/">
                        <div className="flex items-center gap-3">
                            <Logo className="gap-3" />
                        </div>
                    </a>
                )}

                {navLinks.length > 0 && (
                    <div className="flex items-center gap-5 whitespace-nowrap">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="transition-colors hover:text-primary"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                )}

                {socialLinks.length > 0 && (
                    <div className="flex items-center gap-4">
                        {socialLinks.map((social, index) => (
                            <a
                                key={index}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={social.label}
                                className="transition-colors hover:text-primary"
                            >
                                {social.icon}
                            </a>
                        ))}
                    </div>
                )}
            </div>

            <Separator />

            <div className="mx-auto flex max-w-7xl justify-center px-4 py-8 sm:px-6">
                <p className="text-center font-medium text-balance">
                    {`©${new Date().getFullYear()}`}{' '}
                    <a href="/" className="text-primary hover:underline">
                        {brandName}
                    </a>
                    , {tagline}
                </p>
            </div>
        </footer>
    );
};

export default Footer;
