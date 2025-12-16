import { softToastSuccess } from '@/components/shadcn-studio/soft-sonner';
import { RadioGroupCard } from '@/components/shadcn-studio/radio-group-card-radio';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import { update } from '@/routes/projects/members';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { Member, ProjectRole, ProjectWithMembers } from '../lib/types';

interface UpdateRoleDialogProps {
    project: ProjectWithMembers;
    member: Member;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const ROLE_OPTIONS = [
    {
        value: 'editor',
        label: 'Editor',
        description: 'Can create, edit and delete tasks and lists',
    },
    {
        value: 'viewer',
        label: 'Viewer',
        description: 'Can only view project content',
    },
];

export function UpdateRoleDialog({ project, member, open, onOpenChange }: UpdateRoleDialogProps) {
    const getInitials = useInitials();
    const [selectedRole, setSelectedRole] = useState<ProjectRole>(member.role);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = () => {
        if (selectedRole === member.role) {
            onOpenChange(false);
            return;
        }

        setIsUpdating(true);
        router.patch(
            update.url({ project, member: member.id }),
            { role: selectedRole },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                    softToastSuccess('Member role updated successfully');
                },
                onFinish: () => {
                    setIsUpdating(false);
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Change Role</DialogTitle>
                    <DialogDescription>
                        Update the role for this team member.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Member Info */}
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                        <Avatar className="size-10">
                            <AvatarImage src={member.avatar ?? undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(member.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2">
                        <Label>Select Role</Label>
                        <RadioGroupCard
                            options={ROLE_OPTIONS}
                            value={selectedRole}
                            onChange={(value) => setSelectedRole(value as ProjectRole)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isUpdating}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdate}
                        disabled={isUpdating || selectedRole === member.role}
                    >
                        {isUpdating ? 'Updating...' : 'Update Role'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
