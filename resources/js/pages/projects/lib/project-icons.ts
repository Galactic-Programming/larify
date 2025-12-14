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
}

export const PROJECT_ICONS: ProjectIcon[] = [
    { name: 'folder-kanban', icon: FolderKanban, label: 'Kanban' },
    { name: 'folder', icon: Folder, label: 'Folder' },
    { name: 'briefcase', icon: Briefcase, label: 'Briefcase' },
    { name: 'code', icon: Code, label: 'Code' },
    { name: 'rocket', icon: Rocket, label: 'Rocket' },
    { name: 'target', icon: Target, label: 'Target' },
    { name: 'lightbulb', icon: Lightbulb, label: 'Lightbulb' },
    { name: 'users', icon: Users, label: 'Users' },
    { name: 'globe', icon: Globe, label: 'Globe' },
    { name: 'layers', icon: Layers, label: 'Layers' },
    { name: 'layout', icon: Layout, label: 'Layout' },
    { name: 'package', icon: Package, label: 'Package' },
    { name: 'database', icon: Database, label: 'Database' },
    { name: 'server', icon: Server, label: 'Server' },
    { name: 'smartphone', icon: Smartphone, label: 'Smartphone' },
    { name: 'shopping-cart', icon: ShoppingCart, label: 'Shopping' },
    { name: 'pen-tool', icon: PenTool, label: 'Design' },
    { name: 'file-text', icon: FileText, label: 'Document' },
    { name: 'book-open', icon: BookOpen, label: 'Book' },
    { name: 'message-square', icon: MessageSquare, label: 'Chat' },
];

export function getProjectIcon(iconName?: string | null): LucideIcon {
    if (!iconName) return FolderKanban;
    const found = PROJECT_ICONS.find((i) => i.name === iconName);
    return found?.icon ?? FolderKanban;
}
