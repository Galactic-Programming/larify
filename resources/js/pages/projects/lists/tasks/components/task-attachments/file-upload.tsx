import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePlanFeatures } from '@/hooks/use-plan-limits';
import { cn } from '@/lib/utils';
import { CloudUpload, File, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
    projectId: number;
    taskId: number;
    onSuccess: () => void;
    onError: (message: string) => void;
}

export function FileUpload({ projectId, taskId, onSuccess, onError }: FileUploadProps) {
    const { maxAttachmentSize, maxAttachmentSizeMb, allowedAttachmentExtensions } =
        usePlanFeatures();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(
        (acceptedFiles: File[], rejectedFiles: { file: File; errors: { code: string; message: string }[] }[]) => {
            setError(null);

            if (rejectedFiles.length > 0) {
                const firstError = rejectedFiles[0].errors[0];
                if (firstError.code === 'file-too-large') {
                    setError(`File too large. Maximum size is ${maxAttachmentSizeMb}MB`);
                } else if (firstError.code === 'file-invalid-type') {
                    setError('File type not allowed for your plan');
                } else {
                    setError(firstError.message);
                }
                return;
            }

            setFiles((prev) => [...prev, ...acceptedFiles].slice(0, 10));
        },
        [maxAttachmentSizeMb],
    );

    // Build accept object from allowed extensions
    const accept = allowedAttachmentExtensions.reduce(
        (acc, ext) => {
            const mimeMap: Record<string, string> = {
                jpg: 'image/jpeg',
                jpeg: 'image/jpeg',
                png: 'image/png',
                gif: 'image/gif',
                webp: 'image/webp',
                svg: 'image/svg+xml',
                pdf: 'application/pdf',
                txt: 'text/plain',
                md: 'text/markdown',
                doc: 'application/msword',
                docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                xls: 'application/vnd.ms-excel',
                xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ppt: 'application/vnd.ms-powerpoint',
                pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                csv: 'text/csv',
                json: 'application/json',
                zip: 'application/zip',
                rar: 'application/x-rar-compressed',
            };
            const mime = mimeMap[ext];
            if (mime) {
                acc[mime] = acc[mime] || [];
                acc[mime].push(`.${ext}`);
            }
            return acc;
        },
        {} as Record<string, string[]>,
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxSize: maxAttachmentSize,
        accept,
        maxFiles: 10,
    });

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setProgress(0);
        setError(null);

        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files[]', file);
        });

        try {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    setProgress(Math.round((e.loaded / e.total) * 100));
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    setFiles([]);
                    onSuccess();
                } else {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        const errorMessage =
                            response.message || response.errors?.files?.[0] || 'Upload failed';
                        setError(errorMessage);
                        onError(errorMessage);
                    } catch {
                        setError('Upload failed');
                        onError('Upload failed');
                    }
                }
                setUploading(false);
                setProgress(0);
            });

            xhr.addEventListener('error', () => {
                setError('Upload failed');
                onError('Upload failed');
                setUploading(false);
                setProgress(0);
            });

            xhr.open('POST', `/projects/${projectId}/tasks/${taskId}/attachments`);
            xhr.setRequestHeader(
                'X-CSRF-TOKEN',
                document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
            );
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.send(formData);
        } catch {
            setError('Upload failed');
            onError('Upload failed');
            setUploading(false);
            setProgress(0);
        }
    };

    return (
        <div className="space-y-3 p-3">
            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={cn(
                    'cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors',
                    isDragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-primary/50',
                )}
            >
                <input {...getInputProps()} />
                <CloudUpload className="mx-auto mb-2 size-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                    {isDragActive ? 'Drop files here...' : 'Drag & drop or click to upload'}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground/70">
                    Max {maxAttachmentSizeMb}MB per file
                </p>
            </div>

            {/* Error */}
            {error && <p className="text-xs text-destructive">{error}</p>}

            {/* Selected files */}
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 rounded-md bg-muted/50 p-2"
                        >
                            <File className="size-4 shrink-0 text-muted-foreground" />
                            <span className="flex-1 truncate text-xs">{file.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                                {(file.size / 1024).toFixed(1)} KB
                            </span>
                            <button
                                onClick={() => removeFile(index)}
                                className="rounded p-0.5 hover:bg-background"
                                disabled={uploading}
                            >
                                <X className="size-3" />
                            </button>
                        </div>
                    ))}

                    {uploading && <Progress value={progress} className="h-1.5" />}

                    <Button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="w-full"
                        size="sm"
                    >
                        {uploading ? `Uploading... ${progress}%` : `Upload ${files.length} file(s)`}
                    </Button>
                </div>
            )}
        </div>
    );
}
