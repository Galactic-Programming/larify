import { Link } from '@inertiajs/react';

import LaraflowLogo from '@/assets/svg/larify-logo';
import { Separator } from '@/components/ui/separator';

export function Footer() {
    const footerLinks = [
        { href: '#features', label: 'Features' },
        { href: '#testimonials', label: 'Testimonials' },
        { href: '#faq', label: 'FAQ' },
        { href: '#contact', label: 'Contact' },
    ];

    return (
        <footer className="border-t">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 md:py-8">
                <Link href="/" className="flex items-center gap-2">
                    <LaraflowLogo className="size-6" />
                    <span className="font-semibold">Laraflow</span>
                </Link>

                <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:gap-5">
                    {footerLinks.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="transition-colors hover:text-foreground"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>
            </div>

            <Separator />

            <div className="mx-auto flex max-w-7xl justify-center px-4 py-4 sm:py-6">
                <p className="text-center text-xs text-balance text-muted-foreground sm:text-sm">
                    © {new Date().getFullYear()} Laraflow - All rights reserved.
                </p>
            </div>
        </footer>
    );
}
