import type { AIErrorResponse } from '@/types/ai';

import { router } from '@inertiajs/react';
import { AlertCircle, CreditCard, RefreshCcw, Timer, X } from 'lucide-react';
import { useCallback } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AIErrorDisplayProps {
    /** The error to display */
    error: AIErrorResponse | null;
    /** Variant of the error display */
    variant?: 'alert' | 'card' | 'inline';
    /** Callback when user dismisses the error */
    onDismiss?: () => void;
    /** Callback when user wants to retry */
    onRetry?: () => void;
    /** Whether retry is currently in progress */
    isRetrying?: boolean;
    /** Additional class names */
    className?: string;
    /** Title override */
    title?: string;
}

export function AIErrorDisplay({
    error,
    variant = 'alert',
    onDismiss,
    onRetry,
    isRetrying = false,
    className,
    title,
}: AIErrorDisplayProps) {
    const handleUpgrade = useCallback(() => {
        if (error?.upgrade_url) {
            router.visit(error.upgrade_url);
        }
    }, [error]);

    if (!error) return null;

    // Determine error type and icon
    const getErrorConfig = () => {
        switch (error.reason) {
            case 'subscription_required':
                return {
                    icon: CreditCard,
                    title: title || 'Upgrade Required',
                    description:
                        'AI features are available for Pro subscribers only.',
                    actionLabel: 'Upgrade Now',
                    action: handleUpgrade,
                    color: 'text-amber-500',
                    bgColor: 'bg-amber-500/10',
                    borderColor: 'border-amber-500/50',
                };
            case 'daily_limit_exceeded':
                return {
                    icon: Timer,
                    title: title || 'Daily Limit Reached',
                    description:
                        error.message ||
                        'You have reached your daily AI request limit. Try again tomorrow.',
                    actionLabel: undefined,
                    action: undefined,
                    color: 'text-orange-500',
                    bgColor: 'bg-orange-500/10',
                    borderColor: 'border-orange-500/50',
                    extra: error.resets_at
                        ? `Resets at ${new Date(error.resets_at).toLocaleTimeString()}`
                        : undefined,
                };
            default:
                return {
                    icon: AlertCircle,
                    title: title || 'AI Error',
                    description: error.message || 'Something went wrong. Please try again.',
                    actionLabel: onRetry ? 'Try Again' : undefined,
                    action: onRetry,
                    color: 'text-red-500',
                    bgColor: 'bg-red-500/10',
                    borderColor: 'border-red-500/50',
                };
        }
    };

    const config = getErrorConfig();
    const Icon = config.icon;

    // Inline variant - simple message with optional retry
    if (variant === 'inline') {
        return (
            <div
                className={cn(
                    'flex items-center gap-2 text-sm',
                    config.color,
                    className,
                )}
            >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{config.description}</span>
                {config.action && config.actionLabel && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={config.action}
                        disabled={isRetrying}
                        className="h-auto px-2 py-1 text-xs"
                    >
                        {isRetrying ? (
                            <>
                                <RefreshCcw className="mr-1 h-3 w-3 animate-spin" />
                                Retrying...
                            </>
                        ) : (
                            config.actionLabel
                        )}
                    </Button>
                )}
                {onDismiss && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onDismiss}
                        className="h-auto p-1"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>
        );
    }

    // Alert variant
    if (variant === 'alert') {
        return (
            <Alert
                variant="destructive"
                className={cn(config.bgColor, config.borderColor, className)}
            >
                <Icon className={cn('h-4 w-4', config.color)} />
                <AlertTitle className={config.color}>{config.title}</AlertTitle>
                <AlertDescription className="mt-1">
                    <p>{config.description}</p>
                    {config.extra && (
                        <p className="mt-1 text-xs opacity-80">{config.extra}</p>
                    )}
                    {(config.action || onDismiss) && (
                        <div className="mt-3 flex items-center gap-2">
                            {config.action && config.actionLabel && (
                                <Button
                                    size="sm"
                                    variant={
                                        error.reason === 'subscription_required'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={config.action}
                                    disabled={isRetrying}
                                >
                                    {isRetrying ? (
                                        <>
                                            <RefreshCcw className="mr-1 h-3 w-3 animate-spin" />
                                            Retrying...
                                        </>
                                    ) : (
                                        config.actionLabel
                                    )}
                                </Button>
                            )}
                            {onDismiss && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={onDismiss}
                                >
                                    Dismiss
                                </Button>
                            )}
                        </div>
                    )}
                </AlertDescription>
            </Alert>
        );
    }

    // Card variant - more prominent display
    return (
        <Card className={cn('border-2', config.borderColor, className)}>
            <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                    <div className={cn('rounded-full p-2', config.bgColor)}>
                        <Icon className={cn('h-5 w-5', config.color)} />
                    </div>
                    <CardTitle className="text-lg">{config.title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-sm">
                    {config.description}
                </CardDescription>
                {config.extra && (
                    <p className="mt-2 text-xs text-muted-foreground">
                        {config.extra}
                    </p>
                )}
            </CardContent>
            {(config.action || onDismiss) && (
                <CardFooter className="flex gap-2">
                    {config.action && config.actionLabel && (
                        <Button
                            onClick={config.action}
                            disabled={isRetrying}
                            variant={
                                error.reason === 'subscription_required'
                                    ? 'default'
                                    : 'outline'
                            }
                        >
                            {isRetrying ? (
                                <>
                                    <RefreshCcw className="mr-1 h-4 w-4 animate-spin" />
                                    Retrying...
                                </>
                            ) : (
                                config.actionLabel
                            )}
                        </Button>
                    )}
                    {onDismiss && (
                        <Button variant="ghost" onClick={onDismiss}>
                            Dismiss
                        </Button>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}

/**
 * Simple error toast component for AI errors
 */
interface AIErrorToastProps {
    error: AIErrorResponse | null;
    onClose: () => void;
    onRetry?: () => void;
    isRetrying?: boolean;
}

export function AIErrorToast({
    error,
    onClose,
    onRetry,
    isRetrying = false,
}: AIErrorToastProps) {
    if (!error) return null;

    return (
        <div className="animate-in slide-in-from-top-2 fixed right-4 top-4 z-50 w-full max-w-sm rounded-lg border bg-background p-4 shadow-lg">
            <AIErrorDisplay
                error={error}
                variant="inline"
                onDismiss={onClose}
                onRetry={onRetry}
                isRetrying={isRetrying}
            />
        </div>
    );
}
