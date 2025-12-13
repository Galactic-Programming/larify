"use client";

import { Plus, UserRoundIcon, X } from "lucide-react";
import { type ReactNode, useCallback, useRef, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AvatarUploadData {
    name: string;
    title: string;
    image: string | null;
}

export interface DialogAvatarUploadProps {
    /** Controlled open state */
    open?: boolean;
    /** Default open state for uncontrolled mode */
    defaultOpen?: boolean;
    /** Callback when open state changes */
    onOpenChange?: (open: boolean) => void;
    /** Initial values */
    defaultValues?: Partial<AvatarUploadData>;
    /** Callback when save is clicked */
    onSave?: (data: AvatarUploadData) => void;
    /** Callback when cancel is clicked */
    onCancel?: () => void;
    /** Dialog title */
    dialogTitle?: string;
    /** Name field label */
    nameLabel?: string;
    /** Name field placeholder */
    namePlaceholder?: string;
    /** Title field label */
    titleLabel?: string;
    /** Title field placeholder */
    titlePlaceholder?: string;
    /** Whether name field is required */
    nameRequired?: boolean;
    /** Max file size in bytes (default: 1MB) */
    maxFileSize?: number;
    /** Accepted file types */
    acceptedFileTypes?: string;
    /** Save button text */
    saveButtonText?: string;
    /** Cancel button text */
    cancelButtonText?: string;
    /** Custom trigger element */
    trigger?: ReactNode;
    /** Whether to show the trigger */
    showTrigger?: boolean;
    /** Custom class name for dialog content */
    className?: string;
    /** Callback when file size exceeds limit */
    onFileSizeError?: (fileSize: number, maxSize: number) => void;
}

export default function DialogAvatarUpload({
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    defaultValues,
    onSave,
    onCancel,
    dialogTitle = "Add a writer",
    nameLabel = "Author name",
    namePlaceholder,
    titleLabel = "Title",
    titlePlaceholder,
    nameRequired = true,
    maxFileSize = 1048576, // 1MB
    acceptedFileTypes = "image/*",
    saveButtonText = "Save Changes",
    cancelButtonText = "Cancel",
    trigger,
    showTrigger = true,
    className,
    onFileSizeError,
}: DialogAvatarUploadProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const [name, setName] = useState(defaultValues?.name ?? "");
    const [title, setTitle] = useState(defaultValues?.title ?? "");
    const [image, setImage] = useState<string | null>(defaultValues?.image ?? null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

    const setOpen = useCallback(
        (value: boolean) => {
            if (!isControlled) {
                setUncontrolledOpen(value);
            }
            onOpenChange?.(value);
        },
        [isControlled, onOpenChange]
    );

    const formatFileSize = (bytes: number) => {
        if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)}MB`;
        if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
        return `${bytes}B`;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > maxFileSize) {
                if (onFileSizeError) {
                    onFileSizeError(file.size, maxFileSize);
                } else {
                    alert(`File size exceeds ${formatFileSize(maxFileSize)} limit`);
                }
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleSave = () => {
        onSave?.({ name, title, image });
        setOpen(false);
    };

    const handleCancel = () => {
        onCancel?.();
        setOpen(false);
    };

    const resetImage = () => {
        setImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            {showTrigger && (
                <DialogTrigger asChild>
                    {trigger ?? <Button>Open Dialog</Button>}
                </DialogTrigger>
            )}
            <DialogContent className={`sm:max-w-lg p-0 rounded-3xl gap-0 ${className ?? ""}`}>
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle className="font-medium">{dialogTitle}</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-5 px-6 pt-4 pb-6">
                    <div className="flex flex-col items-center justify-center md:col-span-2">
                        <div className="relative mb-2">
                            <Avatar className="h-24 w-24 border-2 border-muted">
                                <AvatarImage src={image || undefined} alt="Profile" />
                                <AvatarFallback>
                                    <UserRoundIcon
                                        size={52}
                                        className="text-muted-foreground"
                                        aria-hidden="true"
                                    />
                                </AvatarFallback>
                            </Avatar>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute -top-0.5 -right-0.5 bg-accent rounded-full border-[3px] border-background h-8 w-8 hover:bg-accent"
                                onClick={() => {
                                    if (image) {
                                        resetImage();
                                    } else {
                                        triggerFileInput();
                                    }
                                }}
                            >
                                {image ? (
                                    <X className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Plus className="h-3 w-3 text-muted-foreground" />
                                )}
                                <span className="sr-only">
                                    {image ? "Remove image" : "Upload image"}
                                </span>
                            </Button>
                        </div>

                        <p className="text-center font-medium">Upload Image</p>
                        <p className="text-center text-sm text-muted-foreground">
                            Max file size: {formatFileSize(maxFileSize)}
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept={acceptedFileTypes}
                            className="hidden"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={triggerFileInput}
                        >
                            Add Image
                        </Button>
                    </div>

                    <div className="flex flex-col justify-between md:col-span-3">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <Label htmlFor="avatar-name" className="flex items-center">
                                    {nameLabel} {nameRequired && <span className="text-primary">*</span>}
                                </Label>
                                <Input
                                    id="avatar-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={namePlaceholder}
                                    required={nameRequired}
                                />
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center">
                                    <Label htmlFor="avatar-title">{titleLabel}</Label>
                                </div>
                                <Input
                                    id="avatar-title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder={titlePlaceholder}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={handleCancel}>
                                {cancelButtonText}
                            </Button>
                            <Button
                                className="bg-foreground text-background hover:bg-foreground/90"
                                onClick={handleSave}
                                disabled={nameRequired && !name.trim()}
                            >
                                {saveButtonText}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
