import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    shortcut?: string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    // Plan-related fields from HandleInertiaRequests
    plan?: 'free' | 'pro';
    plan_label?: string;
    is_premium?: boolean;
    can_invite_members?: boolean;
    // Other fields
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

// Stat Card types for SectionCards component
export interface StatCardItem {
    title: string;
    value: string;
    change: string;
    changeType: 'up' | 'down';
    description: string;
    footerNote: string;
}

// Chart types for ChartAreaInteractive component
export interface ChartDataPoint {
    date: string;
    [key: string]: string | number;
}

export interface ChartAreaConfig {
    dataKey: string;
    label: string;
    color: string;
    fillOpacity?: number;
}

export interface TimeRangeOption {
    value: string;
    label: string;
    days: number;
}

// Social Provider types
export type SocialProvider = 'google' | 'github';

export interface SocialConnections {
    google: boolean;
    github: boolean;
}
