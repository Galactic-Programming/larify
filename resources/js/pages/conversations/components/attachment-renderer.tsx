import { cn } from '@/lib/utils';
import type { MessageAttachment } from '@/types/chat';
import { FileText, Play } from 'lucide-react';
import { ImageGallery } from './image-gallery';
import { MessageStatus } from './message-bubble';

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
            <div className="overflow-hidden rounded-2xl">
                <video
                    src={attachment.url}
                    controls
                    preload="metadata"
                    className="max-h-72 max-w-80 rounded-2xl"
                >
                    Your browser does not support video playback.
                </video>
                <div
                    className={cn(
                        'mt-1 flex items-center gap-1 px-1 text-[10px]',
                        isMine ? 'text-muted-foreground' : 'text-muted-foreground',
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
            <div
                className={cn(
                    'w-full min-w-52 rounded-2xl p-3',
                    isMine
                        ? 'bg-primary/10'
                        : 'bg-slate-200 dark:bg-slate-700',
                )}
            >
                <audio
                    src={attachment.url}
                    controls
                    preload="metadata"
                    className="h-10 w-full"
                >
                    Your browser does not support audio playback.
                </audio>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
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
                'flex items-center gap-3 rounded-2xl p-3 text-sm transition-colors',
                isMine
                    ? 'bg-primary/10 hover:bg-primary/20'
                    : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600',
            )}
        >
            <div
                className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    isMine ? 'bg-primary/20' : 'bg-slate-300 dark:bg-slate-600',
                )}
            >
                <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{attachment.original_name}</p>
                <p className="text-xs text-muted-foreground">
                    {attachment.human_size}
                </p>
            </div>
        </a>
    );
}

/**
 * Attachments Section Component
 * Separates images from other attachments and renders them appropriately
 * iMessage-style: Images displayed outside bubble with time overlay
 */
export function AttachmentsSection({
    attachments,
    isMine,
    time,
    isRead,
}: {
    attachments: MessageAttachment[];
    isMine: boolean;
    time: string;
    isRead: boolean;
}) {
    // Separate images from other attachments
    const images = attachments.filter(
        (a) => isImage(a.mime_type) || isGif(a.mime_type),
    );
    const otherAttachments = attachments.filter(
        (a) => !isImage(a.mime_type) && !isGif(a.mime_type),
    );

    return (
        <div className="space-y-1">
            {/* Render images in gallery layout with time overlay */}
            {images.length > 0 && (
                <ImageGallery
                    images={images}
                    isMine={isMine}
                    time={time}
                    isRead={isRead}
                />
            )}

            {/* Render other attachments */}
            {otherAttachments.length > 0 && (
                <div className="space-y-1">
                    {otherAttachments.map((attachment) => (
                        <AttachmentRenderer
                            key={attachment.id}
                            attachment={attachment}
                            isMine={isMine}
                        />
                    ))}
                    {/* Show time below non-image attachments if no images */}
                    {images.length === 0 && (
                        <div
                            className={cn(
                                'flex',
                                isMine ? 'justify-end' : 'justify-start',
                            )}
                        >
                            <MessageStatus
                                time={time}
                                isRead={isRead}
                                isMine={isMine}
                                variant="default"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
