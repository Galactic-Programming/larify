import { type ReactNode, useEffect, useRef, useState } from 'react';

interface LazySectionProps {
    children: ReactNode;
    className?: string;
    fallback?: ReactNode;
    rootMargin?: string;
}

/**
 * Lazy load section - only renders children when in viewport
 * Helps reduce initial render time for long pages
 */
export function LazySection({
    children,
    className,
    fallback,
    rootMargin = '200px',
}: LazySectionProps) {
    const [isInView, setIsInView] = useState(false);
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin },
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, [rootMargin]);

    return (
        <div ref={sectionRef} className={className}>
            {isInView
                ? children
                : (fallback ?? (
                    <div className="flex min-h-50 items-center justify-center">
                        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                ))}
        </div>
    );
}
