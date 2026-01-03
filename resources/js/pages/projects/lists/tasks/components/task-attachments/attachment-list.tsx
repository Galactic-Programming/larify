import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
import { formatDistanceToNow } from 'date-fns';
import {
    Download,
    FileIcon,
    FileSpreadsheet,
    FileText,
    Image,
    MoreVertical,
    Music,
    Trash2,
    Video,
} from 'lucide-react';
import type { TaskAttachment } from './types';

interface AttachmentListProps {
    attachments: TaskAttachment[];
    canDelete: boolean;
    onDelete: (attachment: TaskAttachment) => void;
}

const getFileIcon = (type: string, mimeType: string) => {
    if (type === 'image') return Image;
    if (type === 'video') return Video;
    if (type === 'audio') return Music;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
    if (type === 'document') return FileText;
    return FileIcon;
};

export function AttachmentList({ attachments, canDelete, onDelete }: AttachmentListProps) {
    if (attachments.length === 0) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                <FileIcon className="mb-3 size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No attachments yet</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                    Upload files to share with your team
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2 p-3">
            {attachments.map((attachment) => {
                const Icon = getFileIcon(attachment.type, attachment.mime_type);
                const isImage = attachment.type === 'image';

                return (
                    <div
                        key={attachment.id}
                        className="group flex items-start gap-3 rounded-lg border bg-card p-2.5 transition-colors hover:bg-muted/50"
                    >
                        {/* Thumbnail or Icon */}
                        {isImage ? (
                            <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 overflow-hidden rounded-md"
                            >
                                <img
                                    src={attachment.url}
                                    alt={attachment.original_name}
                                    className="size-12 object-cover transition-transform hover:scale-105"
                                />
                            </a>
                        ) : (
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted">
                                <Icon className="size-6 text-muted-foreground" />
                            </div>
                        )}

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                            <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block truncate text-sm font-medium hover:underline"
                                title={attachment.original_name}
                            >
                                {attachment.original_name}
                            </a>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{attachment.human_size}</span>
                                <span>•</span>
                                <span>
                                    {formatDistanceToNow(new Date(attachment.created_at), {
                                        addSuffix: true,
                                    })}
                                </span>
                            </div>
                            {attachment.uploaded_by && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="mt-1.5 flex items-center gap-1.5">
                                                <Avatar className="size-4">
                                                    <AvatarImage
                                                        src={attachment.uploaded_by.avatar || undefined}
                                                    />
                                                    <AvatarFallback className="text-[8px]">
                                                        {attachment.uploaded_by.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs text-muted-foreground">
                                                    {attachment.uploaded_by.name}
                                                </span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Uploaded by {attachment.uploaded_by.name}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                    <MoreVertical className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <a href={attachment.download_url} download>
                                        <Download className="mr-2 size-4" />
                                        Download
                                    </a>
                                </DropdownMenuItem>
                                {canDelete && (
                                    <DropdownMenuItem
                                        onClick={() => onDelete(attachment)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="mr-2 size-4" />
                                        Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            })}
        </div>
    );
}
