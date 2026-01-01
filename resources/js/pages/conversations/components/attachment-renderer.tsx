import { cn } from '@/lib/utils';
import type { MessageAttachment } from '@/types/chat';
import { FileText, Play } from 'lucide-react';
import { ImageGallery } from './image-gallery';

/**
 * Helper functions to categorize attachments by mime type
 */
export function isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/') && !mimeType.includes('gif');
}

export function isGif(mimeType: string): boolean {
    return mimeType === 'image/gif';
}

export function isVideo(mimeType: string): boolean {
    return mimeType.startsWith('video/');
}

export function isAudio(mimeType: string): boolean {
    return mimeType.startsWith('audio/');
}

/**
 * Component to render individual attachment based on type
 * Handles video, audio, and file attachments (images use ImageGallery)
 */
export function AttachmentRenderer({
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

/**
 * Attachments Section Component
 * Separates images from other attachments and renders them appropriately
 */
export function AttachmentsSection({
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
