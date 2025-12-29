import { useRef, useState } from 'react';

import { destroy, update } from '@/routes/avatar';
import { type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { router, usePage } from '@inertiajs/react';
import { Camera, Trash2, User } from 'lucide-react';

import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface AvatarUploadProps {
    className?: string;
}

export default function AvatarUpload({ className }: AvatarUploadProps) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recentlySuccessful, setRecentlySuccessful] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'image/gif',
        ];
        if (!allowedTypes.includes(file.type)) {
            setError(
                'Please select a valid image file (JPG, PNG, WebP, or GIF)',
            );
            return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('Image size must be less than 10MB');
            return;
        }

        setError(null);

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload file
        uploadFile(file);
    };

    const uploadFile = (file: File) => {
        setUploading(true);
        setError(null);

        router.post(
            update.url(),
            {
                _method: 'PATCH',
                avatar: file,
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setPreview(null);
                    setRecentlySuccessful(true);
                    setTimeout(() => setRecentlySuccessful(false), 2000);
                },
                onError: (errors) => {
                    setPreview(null);
                    setError(errors.avatar || 'Failed to upload avatar');
                },
                onFinish: () => {
                    setUploading(false);
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                },
            },
        );
    };

    const handleDelete = () => {
        setDeleting(true);
        setError(null);

        router.delete(destroy.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setRecentlySuccessful(true);
                setTimeout(() => setRecentlySuccessful(false), 2000);
            },
            onError: () => {
                setError('Failed to remove avatar');
            },
            onFinish: () => {
                setDeleting(false);
            },
        });
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const displayAvatar = preview || user.avatar;

    return (
        <div className={className}>
            <div className="flex items-center gap-6">
                {/* Avatar Display */}
                <div className="relative">
                    <Avatar className="size-24">
                        <AvatarImage
                            src={displayAvatar || undefined}
                            alt={user.name}
                        />
                        <AvatarFallback className="text-2xl">
                            {user.name ? (
                                getInitials(user.name)
                            ) : (
                                <User className="size-8" />
                            )}
                        </AvatarFallback>
                    </Avatar>

                    {/* Loading overlay */}
                    {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                            <div className="size-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                        {/* Upload Button */}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={triggerFileInput}
                            disabled={uploading}
                        >
                            <Camera className="mr-2 size-4" />
                            {user.avatar ? 'Change' : 'Upload'}
                        </Button>

                        {/* Delete Button */}
                        {user.avatar && (
                            <Dialog
                                open={deleteDialogOpen}
                                onOpenChange={setDeleteDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={uploading || deleting}
                                    >
                                        <Trash2 className="mr-2 size-4" />
                                        Remove
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Remove avatar</DialogTitle>
                                        <DialogDescription>
                                            Are you sure you want to remove your
                                            avatar? This action cannot be
                                            undone.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button
                                                variant="outline"
                                                disabled={deleting}
                                            >
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDelete}
                                            disabled={deleting}
                                        >
                                            {deleting
                                                ? 'Removing...'
                                                : 'Remove'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    {/* Help text */}
                    <p className="text-xs text-muted-foreground">
                        JPG, PNG, WebP. Max 10MB.
                    </p>

                    {/* Success message */}
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-green-600">Saved</p>
                    </Transition>
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* Error message */}
            <InputError message={error || undefined} className="mt-2" />
        </div>
    );
}
