import {
    AlertTriangle,
    ArrowDown,
    ArrowRight,
    ArrowUp,
    Minus,
} from 'lucide-react';
import type { TaskPriority } from '../../../lib/types';

export const PRIORITY_OPTIONS: {
    value: TaskPriority;
    label: string;
    icon: typeof Minus;
    color: string;
}[] = [
    {
        value: 'none',
        label: 'None',
        icon: Minus,
        color: 'text-muted-foreground',
    },
    { value: 'low', label: 'Low', icon: ArrowDown, color: 'text-green-500' },
    {
        value: 'medium',
        label: 'Medium',
        icon: ArrowRight,
        color: 'text-yellow-500',
    },
    { value: 'high', label: 'High', icon: ArrowUp, color: 'text-orange-500' },
    {
        value: 'urgent',
        label: 'Urgent',
        icon: AlertTriangle,
        color: 'text-red-500',
    },
];

export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
