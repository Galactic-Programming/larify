import { Link } from '@inertiajs/react';
import { motion } from 'motion/react';

import LarifyLogo from '@/assets/svg/larify-logo';
import { Separator } from '@/components/ui/separator';

export function Footer() {
    const footerLinks = ['#features', '#testimonials', '#faq', '#contact'];

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
                    {footerLinks.map((href) => (
                        <motion.a
                            key={href}
                            href={href}
                            whileHover={{ y: -2 }}
                            className="transition-colors hover:text-foreground"
                        >
                            {href.replace('#', '').charAt(0).toUpperCase() +
                                href.slice(2)}
                        </motion.a>
                    ))}
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
