import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { Label, LabelColorName } from '../../lib/types';

// Color definitions matching backend Label::COLORS
const LABEL_COLOR_MAP: Record<LabelColorName, string> = {
    gray: '#6b7280',
    red: '#ef4444',
    yellow: '#f59e0b',
    green: '#22c55e',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    pink: '#ec4899',
    indigo: '#6366f1',
    cyan: '#06b6d4',
    teal: '#14b8a6',
    orange: '#f97316',
    lime: '#84cc16',
};

// Tailwind classes for label background colors (with opacity for better readability)
const LABEL_BG_CLASSES: Record<LabelColorName, string> = {
    gray: 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30',
    red: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
    yellow: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30',
    green: 'bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30',
    blue: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    purple: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    pink: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    teal: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
    orange: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
    lime: 'bg-lime-500/15 text-lime-700 dark:text-lime-300 border-lime-500/30',
};

// Solid background classes
const LABEL_SOLID_CLASSES: Record<LabelColorName, string> = {
    gray: 'bg-gray-500 text-white border-transparent',
    red: 'bg-red-500 text-white border-transparent',
    yellow: 'bg-yellow-500 text-white border-transparent',
    green: 'bg-green-500 text-white border-transparent',
    blue: 'bg-blue-500 text-white border-transparent',
    purple: 'bg-purple-500 text-white border-transparent',
    pink: 'bg-pink-500 text-white border-transparent',
    indigo: 'bg-indigo-500 text-white border-transparent',
    cyan: 'bg-cyan-500 text-white border-transparent',
    teal: 'bg-teal-500 text-white border-transparent',
    orange: 'bg-orange-500 text-white border-transparent',
    lime: 'bg-lime-500 text-white border-transparent',
};

interface LabelBadgeProps {
    label: Label;
    size?: 'sm' | 'default';
    variant?: 'default' | 'solid';
    removable?: boolean;
    onRemove?: (label: Label) => void;
    className?: string;
    showTooltip?: boolean;
    maxWidth?: number;
}

export function LabelBadge({
    label,
    size = 'default',
    variant = 'default',
    removable = false,
    onRemove,
    className,
    showTooltip = false,
    maxWidth,
}: LabelBadgeProps) {
    const colorClasses =
        variant === 'solid'
            ? LABEL_SOLID_CLASSES[label.color]
            : LABEL_BG_CLASSES[label.color];

    const sizeClasses =
        size === 'sm'
            ? 'text-[10px] px-1.5 py-0 h-4'
            : 'text-xs px-2 py-0.5 h-5';

    const badgeContent = (
        <Badge
            className={cn(
                'inline-flex items-center gap-1 font-medium transition-colors border',
                colorClasses,
                sizeClasses,
                removable && 'pr-1',
                className,
            )}
            style={maxWidth ? { maxWidth: `${maxWidth}px` } : undefined}
        >
            <span className="truncate">{label.name}</span>
            {removable && onRemove && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(label);
                    }}
                    className="hover:bg-black/10 dark:hover:bg-white/10 rounded-sm p-0.5 transition-colors"
                >
                    <X className={size === 'sm' ? 'size-2.5' : 'size-3'} />
                </button>
            )}
        </Badge>
    );

    if (showTooltip && maxWidth) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
                <TooltipContent>
                    <p>{label.name}</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    return badgeContent;
}

// Helper component to display multiple labels
interface LabelListProps {
    labels: Label[];
    size?: 'sm' | 'default';
    variant?: 'default' | 'solid';
    maxVisible?: number;
    removable?: boolean;
    onRemove?: (label: Label) => void;
    className?: string;
}

export function LabelList({
    labels,
    size = 'default',
    variant = 'default',
    maxVisible,
    removable = false,
    onRemove,
    className,
}: LabelListProps) {
    const visibleLabels =
        maxVisible && labels.length > maxVisible
            ? labels.slice(0, maxVisible)
            : labels;
    const hiddenCount =
        maxVisible && labels.length > maxVisible
            ? labels.length - maxVisible
            : 0;

    if (labels.length === 0) {
        return null;
    }

    return (
        <div className={cn('flex flex-wrap items-center gap-1', className)}>
            {visibleLabels.map((label) => (
                <LabelBadge
                    key={label.id}
                    label={label}
                    size={size}
                    variant={variant}
                    removable={removable}
                    onRemove={onRemove}
                    showTooltip
                    maxWidth={size === 'sm' ? 80 : 120}
                />
            ))}
            {hiddenCount > 0 && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Badge
                            variant="secondary"
                            className={cn(
                                'font-medium',
                                size === 'sm'
                                    ? 'text-[10px] px-1.5 py-0 h-4'
                                    : 'text-xs px-2 py-0.5 h-5',
                            )}
                        >
                            +{hiddenCount}
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                        <div className="flex flex-col gap-1">
                            {labels.slice(maxVisible).map((label) => (
                                <span key={label.id}>{label.name}</span>
                            ))}
                        </div>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}

// Export color utilities for use in other components
export { LABEL_BG_CLASSES, LABEL_COLOR_MAP, LABEL_SOLID_CLASSES };
