import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

export type Appearance = 'light' | 'dark' | 'system';

// Custom event name for syncing appearance across components
const APPEARANCE_CHANGE_EVENT = 'appearance-change';

const prefersDark = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyTheme = (appearance: Appearance) => {
    const isDark =
        appearance === 'dark' || (appearance === 'system' && prefersDark());

    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
};

const mediaQuery = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.matchMedia('(prefers-color-scheme: dark)');
};

const handleSystemThemeChange = () => {
    const currentAppearance = localStorage.getItem('appearance') as Appearance;
    applyTheme(currentAppearance || 'system');
};

export function initializeTheme() {
    const savedAppearance =
        (localStorage.getItem('appearance') as Appearance) || 'system';

    applyTheme(savedAppearance);

    // Add the event listener for system theme changes...
    mediaQuery()?.addEventListener('change', handleSystemThemeChange);
}

type TransitionConfig = {
    enableTransition?: boolean;
    positionRef?: React.RefObject<HTMLElement | null>;
    duration?: number;
    easing?: string;
};

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>(() => {
        if (typeof window === 'undefined') {
            return 'system';
        }
        return (localStorage.getItem('appearance') as Appearance) || 'system';
    });

    const updateAppearance = useCallback(
        async (mode: Appearance, config?: TransitionConfig) => {
            const {
                enableTransition = false,
                positionRef,
                duration = 700,
                easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
            } = config || {};

            const performUpdate = () => {
                setAppearance(mode);

                // Store in localStorage for client-side persistence...
                localStorage.setItem('appearance', mode);

                // Store in cookie for SSR...
                setCookie('appearance', mode);

                applyTheme(mode);

                // Dispatch custom event to sync other components
                window.dispatchEvent(
                    new CustomEvent(APPEARANCE_CHANGE_EVENT, { detail: mode }),
                );
            };

            // Check if View Transitions API is supported and enabled
            if (
                enableTransition &&
                'startViewTransition' in document &&
                positionRef?.current
            ) {
                const button = positionRef.current;

                try {
                    await (
                        document as Document & {
                            startViewTransition: (
                                callback: () => void,
                            ) => { ready: Promise<void> };
                        }
                    ).startViewTransition(() => {
                        flushSync(performUpdate);
                    }).ready;

                    // Calculate animation origin from button position
                    const { top, left, width, height } =
                        button.getBoundingClientRect();
                    const x = left + width / 2;
                    const y = top + height / 2;
                    const maxRadius = Math.hypot(
                        Math.max(left, window.innerWidth - left),
                        Math.max(top, window.innerHeight - top),
                    );

                    // Animate the circular expansion
                    document.documentElement.animate(
                        {
                            clipPath: [
                                `circle(0px at ${x}px ${y}px)`,
                                `circle(${maxRadius}px at ${x}px ${y}px)`,
                            ],
                        },
                        {
                            duration,
                            easing,
                            pseudoElement: '::view-transition-new(root)',
                        },
                    );
                } catch {
                    // Fallback if view transition fails
                    performUpdate();
                }
            } else {
                performUpdate();
            }
        },
        [],
    );

    useEffect(() => {
        // Listen for appearance changes from other components
        const handleAppearanceChange = (event: CustomEvent<Appearance>) => {
            setAppearance(event.detail);
        };

        // Listen for storage changes (for cross-tab sync)
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'appearance' && event.newValue) {
                setAppearance(event.newValue as Appearance);
            }
        };

        window.addEventListener(
            APPEARANCE_CHANGE_EVENT,
            handleAppearanceChange as EventListener,
        );
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener(
                APPEARANCE_CHANGE_EVENT,
                handleAppearanceChange as EventListener,
            );
            window.removeEventListener('storage', handleStorageChange);
            mediaQuery()?.removeEventListener(
                'change',
                handleSystemThemeChange,
            );
        };
    }, []);

    return { appearance, updateAppearance } as const;
}
