import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { MessageAttachment } from '@/types/chat';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Lightbox component for viewing images in full screen
 */
function ImageLightbox({
    images,
    currentIndex,
    isOpen,
    onClose,
    onPrevious,
    onNext,
}: {
    images: MessageAttachment[];
    currentIndex: number;
    isOpen: boolean;
    onClose: () => void;
    onPrevious: () => void;
    onNext: () => void;
}) {
    const currentImage = images[currentIndex];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="flex aspect-square w-[90vmin] max-w-2xl items-center justify-center border-none bg-black/95 p-0">
                <VisuallyHidden>
                    <DialogTitle>Image viewer</DialogTitle>
                </VisuallyHidden>

                {/* Close button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="absolute right-4 top-4 z-50 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                >
                    <X className="h-5 w-5" />
                </Button>

                {/* Navigation - Previous */}
                {images.length > 1 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onPrevious}
                        className="absolute left-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                )}

                {/* Image container with fixed size */}
                <div className="flex h-full w-full items-center justify-center p-8">
                    <img
                        src={currentImage?.url}
                        alt={currentImage?.original_name}
                        className="max-h-full max-w-full object-contain"
                    />
                </div>

                {/* Navigation - Next */}
                {images.length > 1 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onNext}
                        className="absolute right-4 top-1/2 z-50 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                )}

                {/* Image counter */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
                        {currentIndex + 1} / {images.length}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

/**
 * Telegram-style Image Gallery Component
 * Displays images in a grid layout similar to Telegram's implementation
 */
export function ImageGallery({ images }: { images: MessageAttachment[] }) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
    const [errorImages, setErrorImages] = useState<Set<number>>(new Set());

    const handleImageLoad = (index: number) => {
        setLoadedImages((prev) => new Set(prev).add(index));
    };

    const handleImageError = (index: number) => {
        setErrorImages((prev) => new Set(prev).add(index));
    };

    const openLightbox = (index: number) => {
        setCurrentImageIndex(index);
        setLightboxOpen(true);
    };

    const goToPrevious = () => {
        setCurrentImageIndex((prev) =>
            prev === 0 ? images.length - 1 : prev - 1,
        );
    };

    const goToNext = () => {
        setCurrentImageIndex((prev) =>
            prev === images.length - 1 ? 0 : prev + 1,
        );
    };

    // Filter out errored images
    const validImages = images.filter((_, i) => !errorImages.has(i));
    const displayImages = validImages.slice(0, 4);
    const remainingCount = validImages.length - 4;

    // Single image - display larger
    if (displayImages.length === 1) {
        return (
            <>
                <button
                    onClick={() => openLightbox(0)}
                    className="block overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    {!loadedImages.has(0) && (
                        <div className="flex h-48 w-64 items-center justify-center rounded-lg bg-muted/50">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    )}
                    <img
                        src={images[0].url}
                        alt={images[0].original_name}
                        className={cn(
                            'max-h-72 max-w-80 rounded-lg object-cover transition-opacity hover:opacity-90',
                            !loadedImages.has(0) && 'hidden',
                        )}
                        onLoad={() => handleImageLoad(0)}
                        onError={() => handleImageError(0)}
                    />
                </button>
                <ImageLightbox
                    images={images}
                    currentIndex={currentImageIndex}
                    isOpen={lightboxOpen}
                    onClose={() => setLightboxOpen(false)}
                    onPrevious={goToPrevious}
                    onNext={goToNext}
                />
            </>
        );
    }

    // Two images - side by side
    if (displayImages.length === 2) {
        return (
            <>
                <div className="grid max-w-80 grid-cols-2 gap-0.5 overflow-hidden rounded-lg">
                    {displayImages.map((img, index) => (
                        <button
                            key={img.id}
                            onClick={() => openLightbox(index)}
                            className="relative aspect-square overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                        >
                            {!loadedImages.has(index) && (
                                <div className="flex h-full w-full items-center justify-center bg-muted/50">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                </div>
                            )}
                            <img
                                src={img.url}
                                alt={img.original_name}
                                className={cn(
                                    'h-full w-full object-cover transition-opacity hover:opacity-90',
                                    !loadedImages.has(index) && 'hidden',
                                )}
                                onLoad={() => handleImageLoad(index)}
                                onError={() => handleImageError(index)}
                            />
                        </button>
                    ))}
                </div>
                <ImageLightbox
                    images={images}
                    currentIndex={currentImageIndex}
                    isOpen={lightboxOpen}
                    onClose={() => setLightboxOpen(false)}
                    onPrevious={goToPrevious}
                    onNext={goToNext}
                />
            </>
        );
    }

    // Three images - one large on left, two stacked on right
    if (displayImages.length === 3) {
        return (
            <>
                <div className="grid max-w-80 grid-cols-2 gap-0.5 overflow-hidden rounded-lg">
                    <button
                        onClick={() => openLightbox(0)}
                        className="relative row-span-2 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                    >
                        {!loadedImages.has(0) && (
                            <div className="flex h-full min-h-48 w-full items-center justify-center bg-muted/50">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                        )}
                        <img
                            src={displayImages[0].url}
                            alt={displayImages[0].original_name}
                            className={cn(
                                'h-full w-full object-cover transition-opacity hover:opacity-90',
                                !loadedImages.has(0) && 'hidden',
                            )}
                            onLoad={() => handleImageLoad(0)}
                            onError={() => handleImageError(0)}
                        />
                    </button>
                    {displayImages.slice(1).map((img, i) => {
                        const index = i + 1;
                        return (
                            <button
                                key={img.id}
                                onClick={() => openLightbox(index)}
                                className="relative aspect-square overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                            >
                                {!loadedImages.has(index) && (
                                    <div className="flex h-full w-full items-center justify-center bg-muted/50">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    </div>
                                )}
                                <img
                                    src={img.url}
                                    alt={img.original_name}
                                    className={cn(
                                        'h-full w-full object-cover transition-opacity hover:opacity-90',
                                        !loadedImages.has(index) && 'hidden',
                                    )}
                                    onLoad={() => handleImageLoad(index)}
                                    onError={() => handleImageError(index)}
                                />
                            </button>
                        );
                    })}
                </div>
                <ImageLightbox
                    images={images}
                    currentIndex={currentImageIndex}
                    isOpen={lightboxOpen}
                    onClose={() => setLightboxOpen(false)}
                    onPrevious={goToPrevious}
                    onNext={goToNext}
                />
            </>
        );
    }

    // Four or more images - 2x2 grid with optional +N overlay
    return (
        <>
            <div className="grid max-w-80 grid-cols-2 gap-0.5 overflow-hidden rounded-lg">
                {displayImages.map((img, index) => {
                    const isLastWithMore = index === 3 && remainingCount > 0;
                    return (
                        <button
                            key={img.id}
                            onClick={() => openLightbox(index)}
                            className="relative aspect-square overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                        >
                            {!loadedImages.has(index) && (
                                <div className="flex h-full w-full items-center justify-center bg-muted/50">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                </div>
                            )}
                            <img
                                src={img.url}
                                alt={img.original_name}
                                className={cn(
                                    'h-full w-full object-cover transition-opacity hover:opacity-90',
                                    !loadedImages.has(index) && 'hidden',
                                )}
                                onLoad={() => handleImageLoad(index)}
                                onError={() => handleImageError(index)}
                            />
                            {isLastWithMore && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <span className="text-2xl font-semibold text-white">
                                        +{remainingCount}
                                    </span>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
            <ImageLightbox
                images={images}
                currentIndex={currentImageIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                onPrevious={goToPrevious}
                onNext={goToNext}
            />
        </>
    );
}
