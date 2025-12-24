import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface StatsCardProps {
    icon: ReactNode;
    value: string | number;
    title: string;
    subtitle?: ReactNode;
    subtitleVariant?: 'default' | 'warning' | 'success';
    index?: number;
    className?: string;
}

export function StatsCard({
    icon,
    value,
    title,
    subtitle,
    subtitleVariant = 'default',
    index = 0,
    className,
}: StatsCardProps) {
    const subtitleColors = {
        default: 'text-muted-foreground',
        warning: 'text-destructive',
        success: 'text-green-600 dark:text-green-500',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
        >
            <Card className={cn('relative overflow-hidden', className)}>
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                            duration: 0.3,
                            delay: 0.2 + index * 0.1,
                            type: 'spring',
                            stiffness: 200,
                        }}
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                    >
                        {icon}
                    </motion.div>
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="text-2xl font-bold"
                    >
                        {value}
                    </motion.span>
                </CardHeader>
                <CardContent className="pt-0">
                    <p className="font-medium text-foreground">{title}</p>
                    <p
                        className={cn(
                            'mt-1 min-h-5 text-sm',
                            subtitle
                                ? subtitleColors[subtitleVariant]
                                : 'text-transparent',
                        )}
                    >
                        {subtitle || '\u00A0'}
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );
}
