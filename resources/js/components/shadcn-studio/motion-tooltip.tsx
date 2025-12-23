'use client';

import * as React from 'react';

import {
    AnimatePresence,
    motion,
    useMotionValue,
    useSpring,
    useTransform,
} from 'motion/react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { cn } from '@/lib/utils';

export interface AnimatedTooltipItem {
    id?: string | number;
    image?: string;
    name: string;
    fallback?: string;
    designation?: string;
}

export interface AnimatedTooltipProps {
    items: AnimatedTooltipItem[];
    className?: string;
    avatarClassName?: string;
    tooltipClassName?: string;
}

function AnimatedTooltip({
    items,
    className,
    avatarClassName,
    tooltipClassName,
}: AnimatedTooltipProps) {
    const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
    const springConfig = { stiffness: 100, damping: 5 };

    // going to set this value on mouse move
    const x = useMotionValue(0);

    // rotate the tooltip
    const rotate = useSpring(
        useTransform(x, [-100, 100], [-45, 45]),
        springConfig,
    );

    // translate the tooltip
    const translateX = useSpring(
        useTransform(x, [-100, 100], [-50, 50]),
        springConfig,
    );

    const handleMouseMove = (event: React.MouseEvent<HTMLSpanElement>) => {
        const target = event.target as HTMLElement;
        const halfWidth = target.offsetWidth / 2;

        // set the x value, which is then used in transform and rotate
        x.set(event.nativeEvent.offsetX - halfWidth);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <>
            {items.map((item, index) => (
                <div
                    className={cn('relative -me-2.5', className)}
                    key={item.name}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <AnimatePresence mode="popLayout">
                        {hoveredIndex === index && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    scale: 1,
                                    transition: {
                                        type: 'spring',
                                        stiffness: 260,
                                        damping: 10,
                                    },
                                }}
                                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                                style={{
                                    translateX: translateX,
                                    rotate: rotate,
                                    whiteSpace: 'nowrap',
                                }}
                                className={cn(
                                    'absolute -top-2 left-1/2 z-50 flex -translate-x-1/2 -translate-y-full flex-col items-center justify-center rounded-md bg-foreground px-4 py-2 text-xs text-background shadow-xl',
                                    tooltipClassName,
                                )}
                            >
                                <div className="relative z-1 text-base font-semibold">
                                    {item.name}
                                </div>
                                {item.designation && (
                                    <div className="text-xs text-background/80">
                                        {item.designation}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <Avatar
                        className={cn(
                            'relative size-10 ring-2 ring-background transition-all duration-300 ease-in-out hover:z-1 hover:scale-105',
                            avatarClassName,
                        )}
                        onMouseMove={handleMouseMove}
                    >
                        <AvatarImage src={item.image} alt={item.name} />
                        <AvatarFallback className="text-xs">
                            {item.fallback || getInitials(item.name)}
                        </AvatarFallback>
                    </Avatar>
                </div>
            ))}
        </>
    );
}

export { AnimatedTooltip };
