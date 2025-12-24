import { Link } from '@inertiajs/react';
import { AlertCircle, Crown, Infinity } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePlanFeatures } from '@/hooks/use-plan-limits';
import { cn } from '@/lib/utils';
import { index as billingIndex } from '@/routes/billing';

interface PlanLimitIndicatorProps {
    className?: string;
    showUpgradeButton?: boolean;
    compact?: boolean;
}

/**
 * Shows current project usage against plan limits.
 * Displays a progress bar for Free users and "Unlimited" badge for Pro users.
 */
export function PlanLimitIndicator({
    className,
    showUpgradeButton = true,
    compact = false,
}: PlanLimitIndicatorProps) {
    const {
        currentProjects,
        maxProjects,
        canCreateProject,
        remainingProjectSlots,
        isPro,
    } = usePlanFeatures();

    if (isPro) {
        return (
            <div className={cn('flex items-center gap-2', className)}>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Infinity className="h-4 w-4 text-amber-500" />
                    <span>
                        {currentProjects} project
                        {currentProjects !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>
        );
    }

    const usagePercentage = (currentProjects / maxProjects) * 100;
    const isAtLimit = !canCreateProject;
    const isNearLimit =
        remainingProjectSlots !== null && remainingProjectSlots <= 1;

    if (compact) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className={cn(
                                'flex items-center gap-1.5 text-sm',
                                isAtLimit
                                    ? 'text-destructive'
                                    : isNearLimit
                                        ? 'text-amber-500'
                                        : 'text-muted-foreground',
                                className,
                            )}
                        >
                            {isAtLimit && (
                                <AlertCircle className="h-3.5 w-3.5" />
                            )}
                            <span>
                                {currentProjects}/{maxProjects}
                            </span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            {isAtLimit
                                ? 'Project limit reached. Upgrade for unlimited projects.'
                                : `${remainingProjectSlots} project slot${remainingProjectSlots !== 1 ? 's' : ''} remaining`}
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Projects</span>
                <span
                    className={cn(
                        'font-medium',
                        isAtLimit
                            ? 'text-destructive'
                            : isNearLimit
                                ? 'text-amber-500'
                                : '',
                    )}
                >
                    {currentProjects} / {maxProjects}
                </span>
            </div>
            <Progress
                value={usagePercentage}
                className={cn(
                    'h-2',
                    isAtLimit && '[&>div]:bg-destructive',
                    isNearLimit && !isAtLimit && '[&>div]:bg-amber-500',
                )}
            />
            {isAtLimit && (
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-destructive">
                        You've reached your project limit
                    </p>
                    {showUpgradeButton && (
                        <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs"
                        >
                            <Link href={billingIndex.url()}>
                                <Crown className="h-3 w-3" />
                                Upgrade
                            </Link>
                        </Button>
                    )}
                </div>
            )}
            {isNearLimit && !isAtLimit && (
                <p className="text-xs text-amber-600 dark:text-amber-500">
                    {remainingProjectSlots} project slot
                    {remainingProjectSlots !== 1 ? 's' : ''} remaining
                </p>
            )}
        </div>
    );
}

interface ListLimitIndicatorProps {
    currentLists: number;
    maxLists: number | null;
    className?: string;
    compact?: boolean;
}

/**
 * Shows current list usage against plan limits for a project.
 */
export function ListLimitIndicator({
    currentLists,
    maxLists,
    className,
    compact = false,
}: ListLimitIndicatorProps) {
    // Unlimited (Pro user)
    if (maxLists === null) {
        if (compact) {
            return (
                <span className="text-sm text-muted-foreground">
                    {currentLists} list{currentLists !== 1 ? 's' : ''}
                </span>
            );
        }
        return (
            <div className={cn('flex items-center gap-2', className)}>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Infinity className="h-4 w-4 text-amber-500" />
                    <span>
                        {currentLists} list{currentLists !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>
        );
    }

    const usagePercentage = (currentLists / maxLists) * 100;
    const isAtLimit = currentLists >= maxLists;
    const isNearLimit = maxLists - currentLists <= 1;
    const remaining = maxLists - currentLists;

    if (compact) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span
                            className={cn(
                                'text-sm',
                                isAtLimit
                                    ? 'text-destructive'
                                    : isNearLimit
                                        ? 'text-amber-500'
                                        : 'text-muted-foreground',
                            )}
                        >
                            {currentLists}/{maxLists}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            {isAtLimit
                                ? 'List limit reached'
                                : `${remaining} list slot${remaining !== 1 ? 's' : ''} remaining`}
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Lists</span>
                <span
                    className={cn(
                        'font-medium',
                        isAtLimit
                            ? 'text-destructive'
                            : isNearLimit
                                ? 'text-amber-500'
                                : '',
                    )}
                >
                    {currentLists} / {maxLists}
                </span>
            </div>
            <Progress
                value={usagePercentage}
                className={cn(
                    'h-2',
                    isAtLimit && '[&>div]:bg-destructive',
                    isNearLimit && !isAtLimit && '[&>div]:bg-amber-500',
                )}
            />
            {isAtLimit && (
                <p className="text-xs text-destructive">
                    List limit reached for this project
                </p>
            )}
        </div>
    );
}
