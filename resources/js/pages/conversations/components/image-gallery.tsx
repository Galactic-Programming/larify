import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MessageAttachment } from '@/types/chat';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageStatus } from './message-bubble';

/**
 * Full-screen Lightbox component for viewing images
 * Modern design with smooth animations and gesture support
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

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    onPrevious();
                    break;
                case 'ArrowRight':
                    onNext();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        // Prevent body scroll when lightbox is open
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose, onPrevious, onNext]);

    if (!isOpen) return null;

    const lightboxContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-100 flex items-center justify-center"
                    onClick={onClose}
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
                    />

                    {/* Top bar */}
                    <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
                        <div className="text-sm text-white/70">
                            {currentImage?.original_name}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(currentImage?.url, '_blank');
                                }}
                                className="h-10 w-10 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                            >
                                <Download className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                                className="h-10 w-10 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Navigation - Previous */}
                    {images.length > 1 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPrevious();
                            }}
                            className="absolute left-4 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                    )}

                    {/* Image container */}
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="relative z-0 flex max-h-[85vh] max-w-[90vw] items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={currentImage?.url}
                            alt={currentImage?.original_name}
                            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
                            draggable={false}
                        />
                    </motion.div>

                    {/* Navigation - Next */}
                    {images.length > 1 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onNext();
                            }}
                            className="absolute right-4 top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full bg-black/30 text-white hover:bg-black/50 hover:text-white"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    )}

                    {/* Bottom bar - Image counter and thumbnails */}
                    {images.length > 1 && (
                        <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
                            {/* Thumbnails */}
                            <div className="flex items-center justify-center gap-2">
                                {images.map((img, index) => (
                                    <button
                                        key={img.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Navigate to specific image
                                            const diff = index - currentIndex;
                                            if (diff > 0) {
                                                for (let i = 0; i < diff; i++) onNext();
                                            } else {
                                                for (let i = 0; i < Math.abs(diff); i++) onPrevious();
                                            }
                                        }}
                                        className={cn(
                                            'h-12 w-12 overflow-hidden rounded-lg border-2 transition-all',
                                            index === currentIndex
                                                ? 'border-white'
                                                : 'border-transparent opacity-50 hover:opacity-75',
                                        )}
                                    >
                                        <img
                                            src={img.url}
                                            alt={img.original_name}
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                            {/* Counter */}
                            <div className="mt-2 text-center text-sm text-white/70">
                                {currentIndex + 1} / {images.length}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );

    // Render to body using portal to ensure full-screen overlay
    return createPortal(lightboxContent, document.body);
}

/**
 * Single image thumbnail component
 */
function ImageThumbnail({
    image,
    onClick,
    className,
    children,
}: {
    image: MessageAttachment;
    onClick: () => void;
    className?: string;
    children?: React.ReactNode;
}) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);

    if (error) return null;

    return (
        <button
            onClick={onClick}
            className={cn(
                'relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                className,
            )}
        >
            {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            )}
            <img
                src={image.url}
                alt={image.original_name}
                className={cn(
                    'h-full w-full object-cover transition-transform hover:scale-105',
                    !loaded && 'opacity-0',
                )}
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
                draggable={false}
            />
            {children}
        </button>
    );
}

/**
 * iMessage-style Image Gallery Component
 * Displays images with rounded corners and time overlay
 */
export function ImageGallery({
    images,
    isMine,
    time,
    isRead,
}: {
    images: MessageAttachment[];
    isMine: boolean;
    time: string;
    isRead: boolean;
}) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const openLightbox = useCallback((index: number) => {
        setCurrentImageIndex(index);
        setLightboxOpen(true);
    }, []);

    const goToPrevious = useCallback(() => {
        setCurrentImageIndex((prev) =>
            prev === 0 ? images.length - 1 : prev - 1,
        );
    }, [images.length]);

    const goToNext = useCallback(() => {
        setCurrentImageIndex((prev) =>
            prev === images.length - 1 ? 0 : prev + 1,
        );
    }, [images.length]);

    const displayImages = images.slice(0, 4);
    const remainingCount = images.length - 4;

    // Render time overlay
    const renderTimeOverlay = (className?: string) => (
        <div className={cn('absolute bottom-2 right-2', className)}>
            <MessageStatus
                time={time}
                isRead={isRead}
                isMine={isMine}
                variant="overlay"
            />
        </div>
    );

    // Single image - display larger with natural aspect ratio
    if (displayImages.length === 1) {
        return (
            <>
                <ImageThumbnail
                    image={images[0]}
                    onClick={() => openLightbox(0)}
                    className="max-h-80 max-w-72 rounded-2xl"
                >
                    {renderTimeOverlay()}
                </ImageThumbnail>
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
                <div className="grid max-w-72 grid-cols-2 gap-0.5 overflow-hidden rounded-2xl">
                    {displayImages.map((img, index) => (
                        <ImageThumbnail
                            key={img.id}
                            image={img}
                            onClick={() => openLightbox(index)}
                            className="aspect-square"
                        >
                            {index === 1 && renderTimeOverlay()}
                        </ImageThumbnail>
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
                <div className="grid max-w-72 grid-cols-2 gap-0.5 overflow-hidden rounded-2xl">
                    <ImageThumbnail
                        image={displayImages[0]}
                        onClick={() => openLightbox(0)}
                        className="row-span-2 h-full min-h-36"
                    />
                    {displayImages.slice(1).map((img, i) => {
                        const index = i + 1;
                        return (
                            <ImageThumbnail
                                key={img.id}
                                image={img}
                                onClick={() => openLightbox(index)}
                                className="aspect-square"
                            >
                                {index === 2 && renderTimeOverlay()}
                            </ImageThumbnail>
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
            <div className="grid max-w-72 grid-cols-2 gap-0.5 overflow-hidden rounded-2xl">
                {displayImages.map((img, index) => {
                    const isLastWithMore = index === 3 && remainingCount > 0;
                    const isLast = index === displayImages.length - 1;
                    return (
                        <ImageThumbnail
                            key={img.id}
                            image={img}
                            onClick={() => openLightbox(index)}
                            className="aspect-square"
                        >
                            {isLastWithMore && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                    <span className="text-2xl font-semibold text-white">
                                        +{remainingCount}
                                    </span>
                                </div>
                            )}
                            {isLast && renderTimeOverlay()}
                        </ImageThumbnail>
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
