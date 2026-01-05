import { useAIStatus } from '@/hooks/use-ai';
import { cn } from '@/lib/utils';
import { Info, Sparkles, Zap } from 'lucide-react';
import { useEffect } from 'react';

import { Progress } from '@/components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface AIUsageIndicatorProps {
    /** Display variant */
    variant?: 'compact' | 'full' | 'minimal';
    /** Additional class names */
    className?: string;
    /** Auto-refresh interval in milliseconds (0 to disable) */
    refreshInterval?: number;
    /** Show the component even if AI is disabled */
    showWhenDisabled?: boolean;
    /** External remaining requests count (from API response) */
    externalRemaining?: number | null;
}

export function AIUsageIndicator({
    variant = 'compact',
    className,
    refreshInterval = 60000, // Refresh every minute
    showWhenDisabled = false,
    externalRemaining,
}: AIUsageIndicatorProps) {
    const { status, isLoading, checkStatus } = useAIStatus();

    // Auto-refresh status
    useEffect(() => {
        if (refreshInterval > 0) {
            const interval = setInterval(checkStatus, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [refreshInterval, checkStatus]);

    // Use external remaining if provided (more up-to-date from API responses)
    const remaining = externalRemaining ?? status?.remaining_requests ?? 0;
    const dailyLimit = 500; // Pro plan limit
    const usagePercent = status
        ? Math.round(((dailyLimit - remaining) / dailyLimit) * 100)
        : 0;

    // Don't render if AI is disabled and we don't want to show when disabled
    if (!showWhenDisabled && (!status || !status.enabled)) {
        return null;
    }

    // Don't show if user can't use AI
    if (!status?.can_use && !status?.has_subscription) {
        return null;
    }

    // Determine status color
    const getStatusColor = () => {
        if (remaining <= 0) return 'text-red-500';
        if (remaining <= 50) return 'text-yellow-500';
        return 'text-emerald-500';
    };

    const getProgressColor = () => {
        if (usagePercent >= 90) return 'bg-red-500';
        if (usagePercent >= 70) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };

    // Minimal variant - just the count
    if (variant === 'minimal') {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={cn(
                                'flex items-center gap-1 text-xs',
                                getStatusColor(),
                                className,
                            )}
                        >
                            <Zap className="h-3 w-3" />
                            <span>{remaining}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{remaining} AI requests remaining today</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Compact variant - icon + count + progress
    if (variant === 'compact') {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={cn(
                                'flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm',
                                className,
                            )}
                        >
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            <div className="flex flex-col gap-0.5">
                                <span className={cn('font-medium', getStatusColor())}>
                                    {remaining}
                                </span>
                                <Progress
                                    value={100 - usagePercent}
                                    className={cn('h-1 w-16', getProgressColor())}
                                />
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="end">
                        <div className="space-y-1 text-xs">
                            <p className="font-medium">AI Usage Today</p>
                            <p>
                                {dailyLimit - remaining} / {dailyLimit} requests used
                            </p>
                            <p>{remaining} remaining</p>
                            {remaining <= 50 && remaining > 0 && (
                                <p className="text-yellow-500">
                                    Running low on AI requests
                                </p>
                            )}
                            {remaining <= 0 && (
                                <p className="text-red-500">
                                    Daily limit reached. Resets at midnight.
                                </p>
                            )}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Full variant - detailed card
    return (
        <div
            className={cn(
                'rounded-lg border bg-card p-4 shadow-sm',
                className,
            )}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <span className="font-medium">AI Usage</span>
                </div>
                <span className={cn('text-lg font-bold', getStatusColor())}>
                    {remaining}
                </span>
            </div>

            <div className="mt-3">
                <Progress
                    value={100 - usagePercent}
                    className={cn('h-2', getProgressColor())}
                />
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                    {dailyLimit - remaining} / {dailyLimit} used
                </span>
                <span>{remaining} remaining</span>
            </div>

            {remaining <= 50 && remaining > 0 && (
                <div className="mt-2 flex items-start gap-2 rounded-md bg-yellow-500/10 p-2 text-xs text-yellow-600 dark:text-yellow-500">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>Running low on AI requests for today.</span>
                </div>
            )}

            {remaining <= 0 && (
                <div className="mt-2 flex items-start gap-2 rounded-md bg-red-500/10 p-2 text-xs text-red-600 dark:text-red-500">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" />
                    <span>Daily limit reached. Your quota resets at midnight.</span>
                </div>
            )}

            {isLoading && (
                <div className="mt-2 text-xs text-muted-foreground">
                    Updating...
                </div>
            )}
        </div>
    );
}
