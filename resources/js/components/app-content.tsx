import { SidebarInset } from '@/components/ui/sidebar';
import { useBackgroundContext } from '@/hooks/use-background';
import { cn } from '@/lib/utils';
import * as React from 'react';

interface AppContentProps extends React.ComponentProps<'main'> {
    variant?: 'header' | 'sidebar';
}

function BackgroundLayer() {
    const { config, backgroundUrl } = useBackgroundContext();

    if (!backgroundUrl) {
        return null;
    }

    return (
        <>
            {/* Background image layer */}
            <div
                className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url(${backgroundUrl})`,
                    opacity: config.opacity / 100,
                }}
            />
            {/* Dark overlay for light mode - helps text readability */}
            <div
                className="pointer-events-none absolute inset-0 z-0 bg-black/20 dark:bg-transparent"
                style={{
                    opacity:
                        config.opacity > 30 ? (config.opacity - 30) / 100 : 0,
                }}
            />
        </>
    );
}

export function AppContent({
    variant = 'header',
    children,
    ...props
}: AppContentProps) {
    if (variant === 'sidebar') {
        return (
            <SidebarInset
                {...props}
                className={cn('relative', props.className)}
            >
                <BackgroundLayer />
                <div className="relative z-10 flex flex-1 flex-col">
                    {children}
                </div>
            </SidebarInset>
        );
    }

    return (
        <main
            className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-4 rounded-xl"
            {...props}
        >
            {children}
        </main>
    );
}
