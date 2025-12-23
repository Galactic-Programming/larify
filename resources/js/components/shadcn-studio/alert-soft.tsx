import { cva, type VariantProps } from 'class-variance-authority';
import {
    CheckCheckIcon,
    CircleAlertIcon,
    InfoIcon,
    LucideIcon,
    TriangleAlertIcon,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const alertSoftVariants = cva('border-none', {
    variants: {
        variant: {
            default: 'bg-primary/10',
            info: 'bg-sky-600/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400 [&>svg]:text-sky-600 dark:[&>svg]:text-sky-400',
            success:
                'bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400 [&>svg]:text-green-600 dark:[&>svg]:text-green-400',
            warning:
                'bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400',
            destructive:
                'bg-destructive/10 text-destructive [&>svg]:text-destructive',
        },
    },
    defaultVariants: {
        variant: 'default',
    },
});

const descriptionVariants = cva('', {
    variants: {
        variant: {
            default: '',
            info: 'text-sky-600/80 dark:text-sky-400/80',
            success: 'text-green-600/80 dark:text-green-400/80',
            warning: 'text-amber-600/80 dark:text-amber-400/80',
            destructive: 'text-destructive/80',
        },
    },
    defaultVariants: {
        variant: 'default',
    },
});

// Default icons for each variant
const defaultIcons: Record<
    NonNullable<VariantProps<typeof alertSoftVariants>['variant']>,
    LucideIcon
> = {
    default: CircleAlertIcon,
    info: InfoIcon,
    success: CheckCheckIcon,
    warning: CircleAlertIcon,
    destructive: TriangleAlertIcon,
};

export interface AlertSoftProps extends VariantProps<typeof alertSoftVariants> {
    title: string;
    description?: string;
    icon?: LucideIcon;
    className?: string;
}

const AlertSoft = ({
    variant = 'default',
    title,
    description,
    icon,
    className,
}: AlertSoftProps) => {
    const IconComponent = icon || defaultIcons[variant || 'default'];

    return (
        <Alert className={cn(alertSoftVariants({ variant }), className)}>
            <IconComponent className="size-4" />
            <AlertTitle>{title}</AlertTitle>
            {description && (
                <AlertDescription className={descriptionVariants({ variant })}>
                    {description}
                </AlertDescription>
            )}
        </Alert>
    );
};

export { AlertSoft, alertSoftVariants };
export default AlertSoft;
