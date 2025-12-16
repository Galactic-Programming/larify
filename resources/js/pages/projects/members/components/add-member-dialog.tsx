import InputError from '@/components/input-error';
import { softToastSuccess } from '@/components/shadcn-studio/soft-sonner';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { store } from '@/routes/projects/members';
import { router } from '@inertiajs/react';
import { Search, UserPlus, Shield, Eye } from 'lucide-react';
import { useState, useMemo, type FormEvent } from 'react';
import type { ProjectRole, ProjectWithMembers, User } from '../lib/types';

interface AddMemberDialogProps {
    project: ProjectWithMembers;
    availableUsers: User[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddMemberDialog({ project, availableUsers, open, onOpenChange }: AddMemberDialogProps) {
    const getInitials = useInitials();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [selectedRole, setSelectedRole] = useState<ProjectRole>('editor');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Filter users based on search query
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return availableUsers;
        const query = searchQuery.toLowerCase();
        return availableUsers.filter(
            (user) =>
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query)
        );
    }, [availableUsers, searchQuery]);

    const selectedUser = availableUsers.find((u) => u.id === selectedUserId);

    const handleOpenChange = (isOpen: boolean) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            // Reset state when closing
            setSearchQuery('');
            setSelectedUserId(null);
            setSelectedRole('editor');
            setErrors({});
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) return;

        setIsSubmitting(true);
        router.post(
            store.url(project),
            { user_id: selectedUserId, role: selectedRole },
            {
                preserveScroll: true,
                onSuccess: () => {
                    handleOpenChange(false);
                    softToastSuccess('Member added successfully');
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <DialogHeader>
                        <DialogTitle>Add Member</DialogTitle>
                        <DialogDescription>
                            Invite a user to join &quot;{project.name}&quot; as a collaborator.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Search Input */}
                    <div className="space-y-2">
                        <Label htmlFor="user-search">Search Users</Label>
                        <div className="relative">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <input
                                id="user-search"
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border py-2 pr-4 pl-10 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                            />
                        </div>
                    </div>

                    {/* User List */}
                    <div className="space-y-2">
                        <Label>Select User</Label>
                        <ScrollArea className="h-48 rounded-md border">
                            {filteredUsers.length === 0 ? (
                                <div className="text-muted-foreground flex h-full items-center justify-center py-8 text-center text-sm">
                                    {searchQuery ? 'No users found matching your search' : 'No users available to add'}
                                </div>
                            ) : (
                                <div className="p-2">
                                    {filteredUsers.map((user) => (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => setSelectedUserId(user.id)}
                                            className={cn(
                                                'flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors',
                                                selectedUserId === user.id
                                                    ? 'bg-primary/10 ring-primary ring-1'
                                                    : 'hover:bg-muted'
                                            )}
                                        >
                                            <Avatar className="size-9">
                                                <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
                                                <AvatarFallback className="text-xs">
                                                    {getInitials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{user.name}</p>
                                                <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                        <InputError message={errors.user_id} />
                    </div>

                    {/* Role Selection */}
                    {selectedUser && (
                        <div className="space-y-2">
                            <Label htmlFor="role-select">Role for {selectedUser.name}</Label>
                            <Select
                                value={selectedRole}
                                onValueChange={(value: ProjectRole) => setSelectedRole(value)}
                            >
                                <SelectTrigger id="role-select">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="editor">
                                        <div className="flex items-center gap-2">
                                            <Shield className="size-4 text-blue-500" />
                                            <span>Editor</span>
                                            <span className="text-muted-foreground text-xs">- Can edit tasks</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="viewer">
                                        <div className="flex items-center gap-2">
                                            <Eye className="size-4 text-gray-500" />
                                            <span>Viewer</span>
                                            <span className="text-muted-foreground text-xs">- Can only view</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={errors.role} />
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !selectedUserId}
                            className="gap-2"
                        >
                            <UserPlus className="size-4" />
                            {isSubmitting ? 'Adding...' : 'Add Member'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
