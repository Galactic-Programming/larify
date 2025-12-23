import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as conversationsIndex } from '@/routes/conversations';
import { index as notificationsIndex } from '@/routes/notifications';
import { index as projectsIndex } from '@/routes/projects';
import { index as trashIndex } from '@/actions/App/Http/Controllers/Trash/TrashController';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Bell, FolderKanban, LayoutGrid, MessageCircle, Trash2 } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
        shortcut: 'd',
    },
    {
        title: 'Projects',
        href: projectsIndex(),
        icon: FolderKanban,
        shortcut: 'p',
    },
    {
        title: 'Conversations',
        href: conversationsIndex(),
        icon: MessageCircle,
        shortcut: 'm',
    },
    {
        title: 'Notifications',
        href: notificationsIndex(),
        icon: Bell,
        shortcut: 'n',
    },
    {
        title: 'Trash',
        href: trashIndex(),
        icon: Trash2,
    },
];

const footerNavItems: NavItem[] = [

];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
