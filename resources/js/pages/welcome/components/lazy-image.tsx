import { useEffect, useRef, useState } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    placeholderClassName?: string;
}

export function LazyImage({
    src,
    alt,
    className,
    placeholderClassName,
    ...props
}: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '100px' },
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={imgRef} className="relative">
            {/* Placeholder skeleton */}
            {!isLoaded && (
                <div
                    className={`absolute inset-0 animate-pulse bg-muted ${placeholderClassName ?? ''}`}
                />
            )}
            {/* Actual image - only load src when in view */}
            <img
                src={isInView ? src : undefined}
                alt={alt}
                className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className ?? ''}`}
                onLoad={() => setIsLoaded(true)}
                loading="lazy"
                decoding="async"
                {...props}
            />
        </div>
    );
}
