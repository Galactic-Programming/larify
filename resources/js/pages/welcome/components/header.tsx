import { Link, usePage } from '@inertiajs/react';
import { MenuIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

import LaraflowLogo from '@/assets/svg/larify-logo';
import { Button } from '@/components/ui/button';
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

import { navigationItems } from '../data/constants';

interface HeaderProps {
    canRegister?: boolean;
}

export function Header({ canRegister = true }: HeaderProps) {
    const { auth } = usePage<SharedData>().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="animate-in fade-in slide-in-from-top-2 sticky top-0 z-50 h-16 border-b bg-background/95 backdrop-blur-sm duration-500">
            <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/" className="flex shrink-0 items-center gap-2">
                    <LaraflowLogo className="size-8" />
                    <span className="text-xl font-bold">Laraflow</span>
                </Link>

                {/* Desktop Navigation */}
                <NavigationMenu className="max-md:hidden">
                    <NavigationMenuList className="flex-wrap justify-start gap-0">
                        {navigationItems.map((item) => (
                            <NavigationMenuItem key={item.title}>
                                <NavigationMenuLink
                                    href={item.href}
                                    className="px-3 py-1.5 text-base font-medium text-muted-foreground transition-colors hover:bg-transparent hover:text-primary"
                                >
                                    {item.title}
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        ))}
                    </NavigationMenuList>
                </NavigationMenu>

                {/* Desktop Auth Buttons */}
                <div className="flex items-center gap-2 max-md:hidden">
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
                </div>

                {/* Mobile Menu Button */}
                <div className="flex items-center gap-2 md:hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={mobileMenuOpen}
                    >
                        {mobileMenuOpen ? (
                            <XIcon className="size-5" />
                        ) : (
                            <MenuIcon className="size-5" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu Panel */}
            <div
                className={cn(
                    'absolute left-0 right-0 top-16 z-50 overflow-hidden border-b bg-background transition-all duration-300 ease-in-out md:hidden',
                    mobileMenuOpen
                        ? 'max-h-96 opacity-100'
                        : 'max-h-0 opacity-0',
                )}
            >
                <nav className="flex flex-col gap-1 p-4">
                    {navigationItems.map((item) => (
                        <a
                            key={item.title}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="rounded-lg px-4 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted/80"
                        >
                            {item.title}
                        </a>
                    ))}

                    <Separator className="my-2" />

                    {auth.user ? (
                        <Button className="w-full rounded-lg" asChild>
                            <Link href={dashboard()}>Dashboard</Link>
                        </Button>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="outline"
                                className="w-full rounded-lg"
                                asChild
                            >
                                <Link href={login()}>Log in</Link>
                            </Button>
                            {canRegister && (
                                <Button className="w-full rounded-lg" asChild>
                                    <Link href={register()}>Get Started</Link>
                                </Button>
                            )}
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
}
