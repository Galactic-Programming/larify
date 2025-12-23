import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Kbd } from '@/components/ui/kbd';
import { resolveUrl } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();

    // Handle keyboard shortcuts for navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Only trigger with Ctrl/Cmd + key
            if (!(event.metaKey || event.ctrlKey)) return;

            const item = items.find(
                (i) => i.shortcut?.toLowerCase() === event.key.toLowerCase(),
            );

            if (item) {
                event.preventDefault();
                router.visit(resolveUrl(item.href));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [items]);

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={page.url.startsWith(
                                resolveUrl(item.href),
                            )}
                            tooltip={{
                                children: (
                                    <span className="flex items-center gap-2">
                                        {item.title}
                                        {item.shortcut && (
                                            <Kbd className="ml-auto">
                                                ⌘{item.shortcut.toUpperCase()}
                                            </Kbd>
                                        )}
                                    </span>
                                ),
                            }}
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
