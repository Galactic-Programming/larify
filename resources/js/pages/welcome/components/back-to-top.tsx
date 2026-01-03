import { useEffect, useState } from 'react';

import { ArrowUpIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function BackToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            // Show button when page is scrolled down 400px
            setIsVisible(window.scrollY > 400);
        };

        window.addEventListener('scroll', toggleVisibility, { passive: true });
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={scrollToTop}
            className={cn(
                'fixed bottom-6 right-6 z-50 size-12 rounded-full shadow-lg transition-all duration-300',
                'bg-background/80 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground',
                'border-2',
                isVisible
                    ? 'translate-y-0 opacity-100'
                    : 'pointer-events-none translate-y-4 opacity-0'
            )}
            aria-label="Scroll to top"
        >
            <ArrowUpIcon className="size-5" />
        </Button>
    );
}
