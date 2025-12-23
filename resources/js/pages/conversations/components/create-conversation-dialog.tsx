import InputError from '@/components/input-error';
import { softToastSuccess } from '@/components/shadcn-studio/soft-sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ConversationType } from '@/types/chat';
import { router } from '@inertiajs/react';
import { MessageSquarePlus, Search, User, Users } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

interface UserOption {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}

interface CreateConversationDialogProps {
    trigger?: ReactNode;
    users?: UserOption[];
}

export function CreateConversationDialog({ trigger, users: propUsers }: CreateConversationDialogProps) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<ConversationType>('direct');
    const [name, setName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [users, setUsers] = useState<UserOption[]>(propUsers ?? []);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Fetch users when dialog opens if not provided via props
    useEffect(() => {
        if (open && !propUsers && users.length === 0) {
            setIsLoadingUsers(true);
            fetch('/api/users/search')
                .then((res) => res.json())
                .then((data) => {
                    setUsers(data.users ?? []);
                })
                .catch(console.error)
                .finally(() => setIsLoadingUsers(false));
        }
    }, [open, propUsers, users.length]);

    // Filter users by search
    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        const query = searchQuery.toLowerCase();
        return users.filter(
            (user) =>
                user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
        );
    }, [users, searchQuery]);

    const resetForm = () => {
        setType('direct');
        setName('');
        setSearchQuery('');
        setSelectedUserIds([]);
        setErrors({});
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            resetForm();
        }
    };

    const toggleUser = (userId: number) => {
        setSelectedUserIds((prev) => {
            if (prev.includes(userId)) {
                return prev.filter((id) => id !== userId);
            }
            // For direct messages, only allow 1 selection
            if (type === 'direct') {
                return [userId];
            }
            return [...prev, userId];
        });
    };

    const handleTypeChange = (newType: ConversationType) => {
        setType(newType);
        // Reset selections when changing to direct (keep max 1)
        if (newType === 'direct' && selectedUserIds.length > 1) {
            setSelectedUserIds(selectedUserIds.slice(0, 1));
        }
    };

    const canSubmit = () => {
        if (type === 'direct') {
            return selectedUserIds.length === 1;
        }
        // Group: need name and at least 1 participant
        return name.trim() && selectedUserIds.length >= 1;
    };

    const handleSubmit = async () => {
        if (!canSubmit() || isSubmitting) return;

        setIsSubmitting(true);
        setErrors({});

        try {
            const response = await fetch('/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                },
                body: JSON.stringify({
                    type,
                    name: type === 'group' ? name : '',
                    participant_ids: selectedUserIds,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    setErrors(data.errors);
                }
                return;
            }

            // Success - close dialog and navigate to the new conversation
            setOpen(false);
            resetForm();
            softToastSuccess('Conversation created successfully');

            if (data.conversation?.id) {
                router.visit(`/conversations/${data.conversation.id}`);
            }
        } catch (error) {
            console.error('Failed to create conversation:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                        {trigger ?? (
                            <Button size="sm" variant="ghost">
                                <MessageSquarePlus className="h-4 w-4" />
                            </Button>
                        )}
                    </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>New Conversation</TooltipContent>
            </Tooltip>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Start a New Conversation</DialogTitle>
                    <DialogDescription>
                        Create a direct message or a group conversation
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Conversation Type */}
                    <div className="space-y-3">
                        <Label>Conversation Type</Label>
                        <RadioGroup
                            value={type}
                            onValueChange={(v) => handleTypeChange(v as ConversationType)}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="direct" id="create-direct" />
                                <Label htmlFor="create-direct" className="flex cursor-pointer items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Direct Message
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="group" id="create-group" />
                                <Label htmlFor="create-group" className="flex cursor-pointer items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Group Conversation
                                </Label>
                            </div>
                        </RadioGroup>
                        <InputError message={errors.type} />
                    </div>

                    {/* Group Name (only for group) */}
                    {type === 'group' && (
                        <div className="space-y-2">
                            <Label htmlFor="conversation-name">
                                Group Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="conversation-name"
                                type="text"
                                placeholder="Enter group name..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                            />
                            <InputError message={errors.name} />
                        </div>
                    )}

                    {/* Participant Selection */}
                    <div className="space-y-3">
                        <Label>
                            {type === 'direct' ? 'Select a person' : 'Add participants'}
                            <span className="text-destructive"> *</span>
                        </Label>

                        {/* Search */}
                        <div className="relative">
                            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                            <Input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Selected count */}
                        {selectedUserIds.length > 0 && (
                            <p className="text-muted-foreground text-sm">
                                {selectedUserIds.length}{' '}
                                {type === 'direct'
                                    ? 'person selected'
                                    : `participant${selectedUserIds.length > 1 ? 's' : ''} selected`}
                            </p>
                        )}

                        {/* User List */}
                        <ScrollArea className="h-60 rounded-lg border">
                            {isLoadingUsers ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-muted-foreground text-sm">Loading users...</div>
                                </div>
                            ) : filteredUsers.length > 0 ? (
                                <div className="divide-y">
                                    {filteredUsers.map((user) => {
                                        const isSelected = selectedUserIds.includes(user.id);
                                        const isDisabled =
                                            type === 'direct' &&
                                            selectedUserIds.length === 1 &&
                                            !isSelected;

                                        return (
                                            <label
                                                key={user.id}
                                                className={`flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-muted ${isDisabled ? 'cursor-not-allowed opacity-50' : ''
                                                    }`}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() =>
                                                        !isDisabled && toggleUser(user.id)
                                                    }
                                                    disabled={isDisabled}
                                                />
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage
                                                        src={user.avatar}
                                                        alt={user.name}
                                                    />
                                                    <AvatarFallback className="text-sm">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-muted-foreground truncate text-xs">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Search className="text-muted-foreground mb-2 h-10 w-10" />
                                    <p className="text-muted-foreground text-sm">
                                        {searchQuery
                                            ? `No users found matching "${searchQuery}"`
                                            : 'No users available'}
                                    </p>
                                </div>
                            )}
                        </ScrollArea>

                        <InputError message={errors.participant_ids} />
                    </div>
                </div>

                <DialogFooter className="gap-3">
                    <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!canSubmit() || isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Conversation'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
