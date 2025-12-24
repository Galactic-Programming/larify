import {
    BookOpen,
    Briefcase,
    Code,
    Database,
    FileText,
    Folder,
    FolderKanban,
    Globe,
    Layers,
    Layout,
    Lightbulb,
    type LucideIcon,
    MessageSquare,
    Package,
    PenTool,
    Rocket,
    Server,
    ShoppingCart,
    Smartphone,
    Target,
    Users,
} from 'lucide-react';

export interface ProjectIcon {
    name: string;
    icon: LucideIcon;
    label: string;
    isPro?: boolean; // If true, only available for Pro users
}

// First 8 icons are available to Free users, rest require Pro
export const PROJECT_ICONS: ProjectIcon[] = [
    // Free icons (first 8)
    { name: 'folder-kanban', icon: FolderKanban, label: 'Kanban' },
    { name: 'folder', icon: Folder, label: 'Folder' },
    { name: 'briefcase', icon: Briefcase, label: 'Briefcase' },
    { name: 'code', icon: Code, label: 'Code' },
    { name: 'rocket', icon: Rocket, label: 'Rocket' },
    { name: 'target', icon: Target, label: 'Target' },
    { name: 'lightbulb', icon: Lightbulb, label: 'Lightbulb' },
    { name: 'users', icon: Users, label: 'Users' },
    // Pro icons (remaining 12)
    { name: 'globe', icon: Globe, label: 'Globe', isPro: true },
    { name: 'layers', icon: Layers, label: 'Layers', isPro: true },
    { name: 'layout', icon: Layout, label: 'Layout', isPro: true },
    { name: 'package', icon: Package, label: 'Package', isPro: true },
    { name: 'database', icon: Database, label: 'Database', isPro: true },
    { name: 'server', icon: Server, label: 'Server', isPro: true },
    { name: 'smartphone', icon: Smartphone, label: 'Smartphone', isPro: true },
    { name: 'shopping-cart', icon: ShoppingCart, label: 'Shopping', isPro: true },
    { name: 'pen-tool', icon: PenTool, label: 'Design', isPro: true },
    { name: 'file-text', icon: FileText, label: 'Document', isPro: true },
    { name: 'book-open', icon: BookOpen, label: 'Book', isPro: true },
    { name: 'message-square', icon: MessageSquare, label: 'Chat', isPro: true },
];

// Free users get first 8 icons only
export const FREE_ICONS_COUNT = 8;

// Get icons available for a user based on their plan
export const getAvailableIcons = (hasFullPalette: boolean): ProjectIcon[] =>
    hasFullPalette ? PROJECT_ICONS : PROJECT_ICONS.filter((i) => !i.isPro);

// Check if icon is a Pro-only icon
export const isProIcon = (iconName: string) =>
    PROJECT_ICONS.find((i) => i.name === iconName)?.isPro ?? false;

export function getProjectIcon(iconName?: string | null): LucideIcon {
    if (!iconName) return FolderKanban;
    const found = PROJECT_ICONS.find((i) => i.name === iconName);
    return found?.icon ?? FolderKanban;
}
