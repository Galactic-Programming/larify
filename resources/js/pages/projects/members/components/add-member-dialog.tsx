import { search } from '@/actions/App/Http/Controllers/Api/UserSearchController';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { store } from '@/routes/projects/members';
import { router } from '@inertiajs/react';
import { Eye, Search, Shield, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { ProjectRole, ProjectWithMembers, User } from '../lib/types';

interface AddMemberDialogProps {
    project: ProjectWithMembers;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const MIN_SEARCH_LENGTH = 2;
const DEBOUNCE_DELAY = 300;

export function AddMemberDialog({
    project,
    open,
    onOpenChange,
}: AddMemberDialogProps) {
    const getInitials = useInitials();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [selectedRole, setSelectedRole] = useState<ProjectRole>('editor');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Debounced search function
    const searchUsers = useCallback(
        async (query: string) => {
            if (query.length < MIN_SEARCH_LENGTH) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const response = await fetch(
                    search.url(project, { query: { query } }),
                );
                if (response.ok) {
                    const users = await response.json();
                    setSearchResults(users);
                }
            } catch (error) {
                console.error('Failed to search users:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        },
        [project],
    );

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            searchUsers(searchQuery);
        }, DEBOUNCE_DELAY);

        return () => clearTimeout(timer);
    }, [searchQuery, searchUsers]);

    const selectedUser = searchResults.find((u) => u.id === selectedUserId);

    const handleOpenChange = (isOpen: boolean) => {
        onOpenChange(isOpen);
        if (!isOpen) {
            // Reset state when closing
            setSearchQuery('');
            setSearchResults([]);
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
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <DialogHeader>
                        <DialogTitle>Add Member</DialogTitle>
                        <DialogDescription>
                            Invite a user to join &quot;{project.name}&quot; as
                            a collaborator.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Search Input */}
                    <div className="space-y-2">
                        <Label htmlFor="user-search">Search Users</Label>
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                id="user-search"
                                type="text"
                                placeholder="Enter at least 2 characters to search..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    // Clear selection when search changes
                                    setSelectedUserId(null);
                                }}
                                className="w-full rounded-md border border-input bg-background py-2 pr-4 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                            />
                            {isSearching && (
                                <Spinner className="absolute top-1/2 right-3 size-4 -translate-y-1/2" />
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Search by name or email address
                        </p>
                    </div>

                    {/* User List */}
                    <div className="space-y-2">
                        <Label>Select User</Label>
                        <ScrollArea className="h-48 rounded-md border">
                            {searchQuery.length < MIN_SEARCH_LENGTH ? (
                                <div className="flex h-full items-center justify-center py-8 text-center text-sm text-muted-foreground">
                                    <div className="px-4">
                                        <Search className="mx-auto mb-2 size-8 opacity-50" />
                                        <p>Type to search for users</p>
                                    </div>
                                </div>
                            ) : isSearching ? (
                                <div className="flex h-full items-center justify-center py-8 text-center text-sm text-muted-foreground">
                                    <div className="px-4">
                                        <Spinner className="mx-auto mb-2 size-6" />
                                        <p>Searching...</p>
                                    </div>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="flex h-full items-center justify-center py-8 text-center text-sm text-muted-foreground">
                                    <div className="px-4">
                                        <p>
                                            No users found matching "
                                            {searchQuery}"
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-2">
                                    {searchResults.map((user) => (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedUserId(user.id)
                                            }
                                            className={cn(
                                                'flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors',
                                                selectedUserId === user.id
                                                    ? 'bg-primary/10 ring-1 ring-primary'
                                                    : 'hover:bg-muted',
                                            )}
                                        >
                                            <Avatar className="size-9">
                                                <AvatarImage
                                                    src={
                                                        user.avatar ?? undefined
                                                    }
                                                    alt={user.name}
                                                />
                                                <AvatarFallback className="text-xs">
                                                    {getInitials(user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {user.name}
                                                </p>
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {user.email}
                                                </p>
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
                            <Label htmlFor="role-select">
                                Role for {selectedUser.name}
                            </Label>
                            <Select
                                value={selectedRole}
                                onValueChange={(value: ProjectRole) =>
                                    setSelectedRole(value)
                                }
                            >
                                <SelectTrigger id="role-select">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="editor">
                                        <div className="flex items-center gap-2">
                                            <Shield className="size-4 text-blue-500" />
                                            <span>Editor</span>
                                            <span className="text-xs text-muted-foreground">
                                                - Can edit tasks
                                            </span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="viewer">
                                        <div className="flex items-center gap-2">
                                            <Eye className="size-4 text-gray-500" />
                                            <span>Viewer</span>
                                            <span className="text-xs text-muted-foreground">
                                                - Can only view
                                            </span>
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
