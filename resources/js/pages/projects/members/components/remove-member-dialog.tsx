import { softToastSuccess } from '@/components/shadcn-studio/soft-sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { destroy } from '@/routes/projects/members';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { Member, ProjectWithMembers } from '../lib/types';

interface RemoveMemberDialogProps {
    project: ProjectWithMembers;
    member: Member;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RemoveMemberDialog({
    project,
    member,
    open,
    onOpenChange,
}: RemoveMemberDialogProps) {
    const getInitials = useInitials();
    const [isRemoving, setIsRemoving] = useState(false);

    const handleRemove = () => {
        setIsRemoving(true);
        router.delete(destroy.url({ project, member: member.pivot_id! }), {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                softToastSuccess('Member removed successfully');
            },
            onFinish: () => {
                setIsRemoving(false);
            },
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Remove Member</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <p>
                                Are you sure you want to remove this member from
                                the project? They will lose access to all
                                project content.
                            </p>
                            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                                <Avatar className="size-10">
                                    <AvatarImage
                                        src={member.avatar ?? undefined}
                                    />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {getInitials(member.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-foreground">
                                        {member.name}
                                    </p>
                                    <p className="text-sm">{member.email}</p>
                                </div>
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isRemoving}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleRemove}
                        disabled={isRemoving}
                        className="bg-destructive text-white hover:bg-destructive/90"
                    >
                        {isRemoving ? 'Removing...' : 'Remove Member'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
