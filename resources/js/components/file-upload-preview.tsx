'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { HelpCircle, Trash2, Upload } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

export interface FileUploadMember {
    id: string;
    name: string;
    avatar?: string;
}

export interface FileUploadData {
    projectName: string;
    projectLead: string;
    files: File[];
}

export interface FileUploadPreviewProps {
    /** Dialog title */
    title?: string;
    /** Dialog description */
    description?: string;
    /** Project name field label */
    projectNameLabel?: string;
    /** Default project name */
    defaultProjectName?: string;
    /** Project lead field label */
    projectLeadLabel?: string;
    /** Default project lead id */
    defaultProjectLead?: string;
    /** Available project leads/members */
    members?: FileUploadMember[];
    /** Upload area title */
    uploadTitle?: string;
    /** Upload area description */
    uploadDescription?: string;
    /** Max file size in bytes (default: 4MB) */
    maxFileSize?: number;
    /** Accepted file types */
    acceptedFileTypes?: string;
    /** Help tooltip title */
    helpTitle?: string;
    /** Help tooltip content */
    helpContent?: string;
    /** Submit button text */
    submitButtonText?: string;
    /** Cancel button text */
    cancelButtonText?: string;
    /** Callback when form is submitted */
    onSubmit?: (data: FileUploadData) => void;
    /** Callback when cancel is clicked */
    onCancel?: () => void;
    /** Callback when file size exceeds limit */
    onFileSizeError?: (file: File, maxSize: number) => void;
    /** Callback when files change */
    onFilesChange?: (files: File[]) => void;
    /** Custom class name */
    className?: string;
    /** Whether to show help button */
    showHelp?: boolean;
    /** Whether to simulate upload progress */
    simulateProgress?: boolean;
    /** Custom upload progress handler (returns cleanup function) */
    onFileUpload?: (
        file: File,
        onProgress: (progress: number) => void,
    ) => (() => void) | void;
}

export default function FileUploadPreview({
    title = 'Create a new project',
    description = 'Drag and drop files to create a new project.',
    projectNameLabel = 'Project name',
    defaultProjectName = '',
    projectLeadLabel = 'Project lead',
    defaultProjectLead,
    members,
    uploadTitle = 'Upload a project image',
    uploadDescription,
    maxFileSize = 4194304, // 4MB
    acceptedFileTypes = 'image/*',
    helpTitle = 'Need assistance?',
    helpContent = 'Upload project images by dragging and dropping files or using the file browser. Supported formats: JPG, PNG, SVG.',
    submitButtonText = 'Continue',
    cancelButtonText = 'Cancel',
    onSubmit,
    onCancel,
    onFileSizeError,
    onFilesChange,
    className,
    showHelp = true,
    simulateProgress = true,
    onFileUpload,
}: FileUploadPreviewProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [projectName, setProjectName] = useState(defaultProjectName);
    const [projectLead, setProjectLead] = useState(
        defaultProjectLead ?? members?.[0]?.id ?? '',
    );
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [fileProgresses, setFileProgresses] = useState<
        Record<string, number>
    >({});

    const formatFileSize = (bytes: number) => {
        if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)}MB`;
        if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
        return `${bytes}B`;
    };

    const handleFileSelect = useCallback(
        (files: FileList | null) => {
            if (!files) return;

            const newFiles: File[] = [];

            Array.from(files).forEach((file) => {
                if (file.size > maxFileSize) {
                    if (onFileSizeError) {
                        onFileSizeError(file, maxFileSize);
                    } else {
                        alert(
                            `File "${file.name}" exceeds ${formatFileSize(maxFileSize)} limit`,
                        );
                    }
                    return;
                }
                newFiles.push(file);
            });

            if (newFiles.length === 0) return;

            setUploadedFiles((prev) => {
                const updated = [...prev, ...newFiles];
                onFilesChange?.(updated);
                return updated;
            });

            // Handle upload progress
            newFiles.forEach((file) => {
                if (onFileUpload) {
                    onFileUpload(file, (progress) => {
                        setFileProgresses((prev) => ({
                            ...prev,
                            [file.name]: Math.min(progress, 100),
                        }));
                    });
                } else if (simulateProgress) {
                    let progress = 0;
                    const interval = setInterval(() => {
                        progress += Math.random() * 10;
                        if (progress >= 100) {
                            progress = 100;
                            clearInterval(interval);
                        }
                        setFileProgresses((prev) => ({
                            ...prev,
                            [file.name]: Math.min(progress, 100),
                        }));
                    }, 300);
                } else {
                    setFileProgresses((prev) => ({
                        ...prev,
                        [file.name]: 100,
                    }));
                }
            });
        },
        [
            maxFileSize,
            onFileSizeError,
            onFilesChange,
            onFileUpload,
            simulateProgress,
        ],
    );

    const handleBoxClick = () => {
        fileInputRef.current?.click();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        handleFileSelect(e.dataTransfer.files);
    };

    const removeFile = (filename: string) => {
        setUploadedFiles((prev) => {
            const updated = prev.filter((file) => file.name !== filename);
            onFilesChange?.(updated);
            return updated;
        });
        setFileProgresses((prev) => {
            const newProgresses = { ...prev };
            delete newProgresses[filename];
            return newProgresses;
        });
    };

    const handleSubmit = () => {
        onSubmit?.({
            projectName,
            projectLead,
            files: uploadedFiles,
        });
    };

    const computedHelpContent = `${helpContent} Maximum file size: ${formatFileSize(maxFileSize)}.`;

    return (
        <div className={cn('flex items-center justify-center p-10', className)}>
            <Card className="mx-auto w-full max-w-lg rounded-lg bg-background p-0 shadow-md">
                <CardContent className="p-0">
                    <div className="p-6 pb-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-medium text-foreground">
                                    {title}
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {description}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-2 px-6 pb-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="projectName" className="mb-2">
                                    {projectNameLabel}
                                </Label>
                                <Input
                                    id="projectName"
                                    type="text"
                                    value={projectName}
                                    onChange={(e) =>
                                        setProjectName(e.target.value)
                                    }
                                />
                            </div>

                            <div>
                                <Label htmlFor="projectLead" className="mb-2">
                                    {projectLeadLabel}
                                </Label>
                                <Select
                                    value={projectLead}
                                    onValueChange={setProjectLead}
                                >
                                    <SelectTrigger
                                        id="projectLead"
                                        className="w-full ps-2"
                                    >
                                        <SelectValue
                                            placeholder={`Select ${projectLeadLabel.toLowerCase()}`}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {members?.map((member) => (
                                                <SelectItem
                                                    key={member.id}
                                                    value={member.id}
                                                >
                                                    {member.avatar && (
                                                        <img
                                                            className="size-5 rounded"
                                                            src={member.avatar}
                                                            alt={member.name}
                                                            width={20}
                                                            height={20}
                                                        />
                                                    )}
                                                    <span className="truncate">
                                                        {member.name}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="px-6">
                        <div
                            className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-border p-8 text-center"
                            onClick={handleBoxClick}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <div className="mb-2 rounded-full bg-muted p-3">
                                <Upload className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-foreground">
                                {uploadTitle}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {uploadDescription ?? (
                                    <>
                                        or,{' '}
                                        <label
                                            htmlFor="fileUpload"
                                            className="cursor-pointer font-medium text-primary hover:text-primary/90"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            click to browse
                                        </label>{' '}
                                        ({formatFileSize(maxFileSize)} max)
                                    </>
                                )}
                            </p>
                            <input
                                type="file"
                                id="fileUpload"
                                ref={fileInputRef}
                                className="hidden"
                                accept={acceptedFileTypes}
                                onChange={(e) =>
                                    handleFileSelect(e.target.files)
                                }
                            />
                        </div>
                    </div>

                    <div
                        className={cn(
                            'space-y-3 px-6 pb-5',
                            uploadedFiles.length > 0 ? 'mt-4' : '',
                        )}
                    >
                        {uploadedFiles.map((file, index) => {
                            const imageUrl = URL.createObjectURL(file);

                            return (
                                <div
                                    className="flex flex-col rounded-lg border border-border p-2"
                                    key={file.name + index}
                                    onLoad={() => {
                                        return () =>
                                            URL.revokeObjectURL(imageUrl);
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="row-span-2 flex h-14 w-18 items-center justify-center self-start overflow-hidden rounded-sm bg-muted">
                                            <img
                                                src={imageUrl}
                                                alt={file.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>

                                        <div className="flex-1 pr-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="max-w-62.5 truncate text-sm text-foreground">
                                                        {file.name}
                                                    </span>
                                                    <span className="text-sm whitespace-nowrap text-muted-foreground">
                                                        {Math.round(
                                                            file.size / 1024,
                                                        )}{' '}
                                                        KB
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 bg-transparent! hover:text-red-500"
                                                    onClick={() =>
                                                        removeFile(file.name)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{
                                                            width: `${fileProgresses[file.name] || 0}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs whitespace-nowrap text-muted-foreground">
                                                    {Math.round(
                                                        fileProgresses[
                                                            file.name
                                                        ] || 0,
                                                    )}
                                                    %
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between rounded-b-lg border-t border-border bg-muted px-6 py-3">
                        {showHelp ? (
                            <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex items-center text-muted-foreground hover:text-foreground"
                                        >
                                            <HelpCircle className="mr-1 h-4 w-4" />
                                            Need help?
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="border bg-background py-3 text-foreground">
                                        <div className="space-y-1">
                                            <p className="text-[13px] font-medium">
                                                {helpTitle}
                                            </p>
                                            <p className="dark:text-muted-background max-w-50 text-xs text-muted-foreground">
                                                {computedHelpContent}
                                            </p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ) : (
                            <div />
                        )}

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="h-9 px-4 text-sm font-medium"
                                onClick={onCancel}
                            >
                                {cancelButtonText}
                            </Button>
                            <Button
                                className="h-9 px-4 text-sm font-medium"
                                onClick={handleSubmit}
                            >
                                {submitButtonText}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
