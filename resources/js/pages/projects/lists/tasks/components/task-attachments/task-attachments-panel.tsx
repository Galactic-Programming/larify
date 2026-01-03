import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlanFeatures } from '@/hooks/use-plan-limits';
import { Crown, Paperclip } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AttachmentList } from './attachment-list';
import { DeleteAttachmentDialog } from './delete-attachment-dialog';
import { FileUpload } from './file-upload';
import type { AttachmentsResponse, TaskAttachment } from './types';

interface TaskAttachmentsPanelProps {
    projectId: number;
    taskId: number;
    canEdit: boolean;
}

export function TaskAttachmentsPanel({
    projectId,
    taskId,
    canEdit,
}: TaskAttachmentsPanelProps) {
    const { canUploadAttachments, isPro } = usePlanFeatures();
    const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingAttachment, setDeletingAttachment] = useState<TaskAttachment | null>(null);

    // Fetch attachments
    const fetchAttachments = useCallback(async () => {
        try {
            const response = await fetch(
                `/api/projects/${projectId}/tasks/${taskId}/attachments`,
            );
            if (!response.ok) throw new Error('Failed to fetch attachments');

            const data: AttachmentsResponse = await response.json();
            setAttachments(data.attachments);
        } catch {
            toast.error('Failed to load attachments');
        } finally {
            setIsLoading(false);
        }
    }, [projectId, taskId]);

    useEffect(() => {
        fetchAttachments();
    }, [fetchAttachments]);

    // Handle upload success
    const handleUploadSuccess = () => {
        toast.success('Files uploaded successfully');
        fetchAttachments();
    };

    // Handle upload error
    const handleUploadError = (message: string) => {
        toast.error(message);
    };

    // Handle delete
    const handleDeleteAttachment = async () => {
        if (!deletingAttachment) return;

        try {
            const response = await fetch(
                `/projects/${projectId}/tasks/${taskId}/attachments/${deletingAttachment.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN':
                            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
                                ?.content || '',
                        Accept: 'application/json',
                    },
                },
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete attachment');
            }

            setAttachments((prev) => prev.filter((a) => a.id !== deletingAttachment.id));
            setDeletingAttachment(null);
            toast.success('Attachment deleted');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete attachment');
        }
    };

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Paperclip className="size-4" />
                    Attachments
                    {attachments.length > 0 && (
                        <span className="text-muted-foreground">({attachments.length})</span>
                    )}
                </h3>
                {!isPro && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">
                        <Crown className="size-3" />
                        Pro
                    </span>
                )}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-3 p-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            ) : (
                <>
                    {/* Upload section - only for Pro users who can edit */}
                    {canEdit && canUploadAttachments && (
                        <FileUpload
                            projectId={projectId}
                            taskId={taskId}
                            onSuccess={handleUploadSuccess}
                            onError={handleUploadError}
                        />
                    )}

                    {/* Upgrade prompt for Free users */}
                    {canEdit && !canUploadAttachments && (
                        <div className="border-b p-4">
                            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                                <Crown className="mx-auto mb-2 size-8 text-amber-500" />
                                <h4 className="text-sm font-semibold">
                                    Unlock Task Attachments
                                </h4>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Upgrade to Pro to attach files, documents, and images to
                                    your tasks.
                                </p>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="mt-3 bg-amber-500 hover:bg-amber-600"
                                    asChild
                                >
                                    <a href="/settings/billing">Upgrade to Pro</a>
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Attachments list */}
                    <ScrollArea className="flex-1">
                        <AttachmentList
                            attachments={attachments}
                            canDelete={canEdit && canUploadAttachments}
                            onDelete={setDeletingAttachment}
                        />
                    </ScrollArea>
                </>
            )}

            {/* Delete dialog */}
            <DeleteAttachmentDialog
                attachment={deletingAttachment}
                open={!!deletingAttachment}
                onOpenChange={(open) => !open && setDeletingAttachment(null)}
                onConfirm={handleDeleteAttachment}
            />
        </div>
    );
}
