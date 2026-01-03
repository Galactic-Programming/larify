import Heading from '@/components/heading';
import { buttonVariants } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn, isSameUrl, resolveUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { show } from '@/routes/two-factor';
import { edit as editPassword } from '@/routes/user-password';
import { type NavItem } from '@/types';
import { Link, router } from '@inertiajs/react';
import {
    CreditCard,
    Key,
    Link2,
    Palette,
    Receipt,
    ShieldCheck,
    User,
} from 'lucide-react';
import { type PropsWithChildren, useState, type JSX } from 'react';

type SettingsNavItem = NavItem & {
    icon: JSX.Element;
};

const sidebarNavItems: SettingsNavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: <User size={18} />,
    },
    {
        title: 'Password',
        href: editPassword(),
        icon: <Key size={18} />,
    },
    {
        title: 'Two-Factor Auth',
        href: show(),
        icon: <ShieldCheck size={18} />,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: <Palette size={18} />,
    },
    {
        title: 'Connections',
        href: '/settings/connections',
        icon: <Link2 size={18} />,
    },
    {
        title: 'Subscription',
        href: '/settings/subscription',
        icon: <CreditCard size={18} />,
    },
    {
        title: 'Invoices',
        href: '/settings/invoices',
        icon: <Receipt size={18} />,
    },
];

function SidebarNav({
    items,
    currentPath,
}: {
    items: SettingsNavItem[];
    currentPath: string;
}) {
    const [val, setVal] = useState(currentPath);

    const handleSelect = (href: string) => {
        setVal(href);
        router.visit(href);
    };

    const currentItem = items.find((item) => isSameUrl(currentPath, item.href));

    return (
        <>
            {/* Mobile: Select Dropdown */}
            <div className="p-1 md:hidden">
                <Select value={val} onValueChange={handleSelect}>
                    <SelectTrigger className="h-12 w-full">
                        <SelectValue>
                            {currentItem && (
                                <div className="flex items-center gap-3">
                                    <span className="scale-110">
                                        {currentItem.icon}
                                    </span>
                                    <span>{currentItem.title}</span>
                                </div>
                            )}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        {items.map((item) => (
                            <SelectItem
                                key={resolveUrl(item.href)}
                                value={resolveUrl(item.href)}
                            >
                                <div className="flex items-center gap-3 px-2 py-1">
                                    <span className="scale-110">
                                        {item.icon}
                                    </span>
                                    <span>{item.title}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Desktop: Vertical Nav with ScrollArea */}
            <ScrollArea
                orientation="horizontal"
                className="hidden w-full min-w-40 bg-background px-1 py-2 md:block"
            >
                <nav className="flex flex-col space-y-1">
                    {items.map((item) => (
                        <Link
                            key={resolveUrl(item.href)}
                            href={item.href}
                            className={cn(
                                buttonVariants({ variant: 'ghost' }),
                                isSameUrl(currentPath, item.href)
                                    ? 'bg-muted hover:bg-accent'
                                    : 'hover:bg-accent hover:underline',
                                'justify-start',
                            )}
                        >
                            <span className="me-2">{item.icon}</span>
                            {item.title}
                        </Link>
                    ))}
                </nav>
            </ScrollArea>
        </>
    );
}

export default function SettingsLayout({ children }: PropsWithChildren) {
    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    const currentPath = window.location.pathname;

    return (
        <div className="px-4 py-4 sm:py-6">
            <Heading
                title="Settings"
                description="Manage your profile and account settings"
            />

            <Separator className="my-4 lg:my-6" />

            <div className="flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="top-0 lg:sticky lg:w-1/5">
                    <SidebarNav
                        items={sidebarNavItems}
                        currentPath={currentPath}
                    />
                </aside>

                <div className="flex w-full overflow-y-hidden p-1">
                    <section className="max-w-xl flex-1 space-y-8 sm:space-y-12">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
