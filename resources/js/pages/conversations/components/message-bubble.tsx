import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Message, MessageAttachment } from '@/types/chat';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { format } from 'date-fns';
import {
    Check,
    CheckCheck,
    ChevronLeft,
    ChevronRight,
    Edit2,
    FileText,
    MoreVertical,
    Play,
    Reply,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';

function formatMessageTime(dateString: string): string {
    const date = new Date(dateString);
    return format(date, 'HH:mm');
}

/**
 * Helper functions to categorize attachments by mime type
 */
function isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/') && !mimeType.includes('gif');
}

function isGif(mimeType: string): boolean {
    return mimeType === 'image/gif';
}

function isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/');
}

function isAudio(mimeType: string): boolean {
    return mimeType.startsWith('audio/');
}

/**
 * Telegram-style Image Gallery Component
 * Displays images in a grid layout similar to Telegram's implementation
 */
function ImageGallery({
    images,
}: {
    images: MessageAttachment[];
}) {
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
 * Attachments Section Component
 * Separates images from other attachments and renders them appropriately
 */
function AttachmentsSection({
    attachments,
    isMine,
}: {
    attachments: MessageAttachment[];
    isMine: boolean;
}) {
    // Separate images from other attachments
    const images = attachments.filter(
        (a) => isImage(a.mime_type) || isGif(a.mime_type),
    );
    const otherAttachments = attachments.filter(
        (a) => !isImage(a.mime_type) && !isGif(a.mime_type),
    );

    return (
        <div className="mt-2 space-y-2">
            {/* Render images in gallery layout */}
            {images.length > 0 && <ImageGallery images={images} />}

            {/* Render other attachments normally */}
            {otherAttachments.map((attachment) => (
                <AttachmentRenderer
                    key={attachment.id}
                    attachment={attachment}
                    isMine={isMine}
                />
            ))}
        </div>
    );
}

/**
 * Component to render individual attachment based on type
 * Now only handles non-image attachments (video, audio, files)
 */
function AttachmentRenderer({
    attachment,
    isMine,
}: {
    attachment: MessageAttachment;
    isMine: boolean;
}) {
    // Video attachment
    if (isVideo(attachment.mime_type)) {
        return (
            <div className="overflow-hidden rounded-lg">
                <video
                    src={attachment.url}
                    controls
                    preload="metadata"
                    className="max-h-64 max-w-64 rounded-lg"
                >
                    Your browser does not support video playback.
                </video>
                <div
                    className={cn(
                        'mt-1 flex items-center gap-1 px-1 text-[10px]',
                        isMine ? 'text-white/70' : 'text-muted-foreground',
                    )}
                >
                    <Play className="h-3 w-3" />
                    <span className="truncate">{attachment.original_name}</span>
                    <span>({attachment.human_size})</span>
                </div>
            </div>
        );
    }

    // Audio attachment
    if (isAudio(attachment.mime_type)) {
        return (
            <div className="w-full min-w-48">
                <audio
                    src={attachment.url}
                    controls
                    preload="metadata"
                    className="h-10 w-full"
                >
                    Your browser does not support audio playback.
                </audio>
                <div
                    className={cn(
                        'mt-1 flex items-center gap-1 text-[10px]',
                        isMine ? 'text-white/70' : 'text-muted-foreground',
                    )}
                >
                    <span className="truncate">{attachment.original_name}</span>
                    <span>({attachment.human_size})</span>
                </div>
            </div>
        );
    }

    // Default: File attachment
    return (
        <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                'flex items-center gap-2 rounded-lg p-2 text-xs transition-colors hover:opacity-80',
                isMine
                    ? 'bg-white/10 hover:bg-white/20'
                    : 'bg-background/50 hover:bg-background/70 dark:bg-slate-600/50',
            )}
        >
            <FileText className="h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{attachment.original_name}</p>
                <p
                    className={cn(
                        'text-[10px]',
                        isMine ? 'text-white/60' : 'text-muted-foreground',
                    )}
                >
                    {attachment.human_size}
                </p>
            </div>
        </a>
    );
}

interface MessageBubbleProps {
    message: Message;
    showAvatar: boolean;
    onReply?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    canEdit?: boolean;
    canDelete?: boolean;
}

export function MessageBubble({
    message,
    showAvatar,
    onReply,
    onEdit,
    onDelete,
    canEdit,
    canDelete,
}: MessageBubbleProps) {
    const isMine = message.is_mine;

    return (
        <div
            className={cn(
                'group flex items-end gap-2',
                isMine && 'flex-row-reverse',
            )}
        >
            {/* Avatar */}
            {!isMine && showAvatar ? (
                <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage
                        src={message.sender?.avatar}
                        alt={message.sender?.name ?? 'User'}
                    />
                    <AvatarFallback className="text-xs">
                        {message.sender?.name?.charAt(0).toUpperCase() ?? 'U'}
                    </AvatarFallback>
                </Avatar>
            ) : !isMine ? (
                <div className="w-8" />
            ) : null}

            {/* Message Content */}
            <div
                className={cn(
                    'flex max-w-[70%] flex-col gap-1',
                    isMine && 'items-end',
                )}
            >
                {/* Sender name */}
                {!isMine && showAvatar && message.sender && (
                    <span className="text-xs text-muted-foreground">
                        {message.sender.name}
                    </span>
                )}

                {/* Bubble */}
                <div className="relative flex items-center gap-1">
                    {/* Actions (visible on hover) */}
                    <div
                        className={cn(
                            'flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100',
                            isMine ? 'order-first' : 'order-last',
                        )}
                    >
                        <TooltipProvider>
                            {onReply && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={onReply}
                                        >
                                            <Reply className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Reply</TooltipContent>
                                </Tooltip>
                            )}

                            {(canEdit || canDelete) && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                        >
                                            <MoreVertical className="h-3.5 w-3.5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align={isMine ? 'end' : 'start'}
                                    >
                                        {canEdit && (
                                            <DropdownMenuItem onClick={onEdit}>
                                                <Edit2 className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                        )}
                                        {canDelete && (
                                            <DropdownMenuItem
                                                onClick={onDelete}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </TooltipProvider>
                    </div>

                    <div
                        className={cn(
                            'rounded-2xl px-3 py-2',
                            isMine
                                ? 'rounded-br-md bg-primary text-primary-foreground'
                                : 'rounded-bl-md bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100',
                        )}
                    >
                        {/* Reply reference - Telegram style (inside bubble) */}
                        {message.parent && (
                            <div
                                className={cn(
                                    'mb-2 rounded-md border-l-2 py-1 pl-2 pr-3',
                                    isMine
                                        ? 'border-white/70 bg-black/20'
                                        : 'border-primary bg-primary/10 dark:border-primary/70 dark:bg-primary/20',
                                )}
                            >
                                {message.parent.is_deleted ? (
                                    <p className="text-xs italic opacity-70">
                                        Deleted message
                                    </p>
                                ) : (
                                    <>
                                        <span
                                            className={cn(
                                                'text-xs font-semibold',
                                                isMine
                                                    ? 'text-white'
                                                    : 'text-primary dark:text-primary',
                                            )}
                                        >
                                            {message.parent.sender_name}
                                        </span>
                                        <p
                                            className={cn(
                                                'truncate text-xs',
                                                isMine
                                                    ? 'text-white/80'
                                                    : 'text-slate-600 dark:text-slate-300',
                                            )}
                                        >
                                            {message.parent.content}
                                        </p>
                                    </>
                                )}
                            </div>
                        )}

                        <p className="wrap-break-word whitespace-pre-wrap text-sm">
                            {message.content}
                        </p>

                        {/* Attachments */}
                        {message.attachments.length > 0 && (
                            <AttachmentsSection
                                attachments={message.attachments}
                                isMine={isMine}
                            />
                        )}

                        {/* Time & Status */}
                        <div
                            className={cn(
                                'mt-1 flex items-center gap-1 text-xs',
                                isMine
                                    ? 'text-primary-foreground/70'
                                    : 'text-muted-foreground',
                            )}
                        >
                            <span>{formatMessageTime(message.created_at)}</span>
                            {message.is_edited && <span>(edited)</span>}
                            {/* Read status checkmarks (only for own messages) */}
                            {isMine &&
                                (message.is_read ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                                ) : (
                                    <Check className="h-3.5 w-3.5 text-slate-400 dark:text-slate-300" />
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
