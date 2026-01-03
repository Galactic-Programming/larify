import { Link, usePage } from '@inertiajs/react';
import { MenuIcon } from 'lucide-react';
import { motion } from 'motion/react';

import LarifyLogo from '@/assets/svg/larify-logo';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { Separator } from '@/components/ui/separator';
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';

import { navigationItems } from '../data/constants';

interface HeaderProps {
    canRegister?: boolean;
}

export function Header({ canRegister = true }: HeaderProps) {
    const { auth } = usePage<SharedData>().props;

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="sticky top-0 z-50 h-16 border-b bg-background"
        >
            <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
                {/* Logo */}
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
