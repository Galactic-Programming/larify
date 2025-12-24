import { Crown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ProBadgeProps {
    className?: string;
    showTooltip?: boolean;
    tooltipText?: string;
    size?: 'sm' | 'default';
}

export function ProBadge({
    className,
    showTooltip = true,
    tooltipText = 'Pro feature - Upgrade to unlock',
    size = 'default',
}: ProBadgeProps) {
    const badge = (
        <Badge
            className={cn(
                'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700',
                size === 'sm' && 'px-1.5 py-0 text-[10px]',
                className,
            )}
        >
            <Crown
                className={cn(
                    'mr-1',
                    size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3',
                )}
            />
            Pro
        </Badge>
    );

    if (!showTooltip) {
        return badge;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{badge}</TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
