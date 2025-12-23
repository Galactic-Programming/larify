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
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ConversationType } from '@/types/chat';
import { router } from '@inertiajs/react';
import { Mail, MessageSquarePlus, Search, User, Users, X } from 'lucide-react';
import {
    type ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

interface UserOption {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}

interface CreateConversationDialogProps {
    trigger?: ReactNode;
}

const MIN_SEARCH_LENGTH = 3;
const DEBOUNCE_MS = 300;

export function CreateConversationDialog({
    trigger,
}: CreateConversationDialogProps) {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<ConversationType>('direct');
    const [name, setName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
    const [searchResults, setSearchResults] = useState<UserOption[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Debounce search query
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (searchQuery.length >= MIN_SEARCH_LENGTH) {
            debounceRef.current = setTimeout(() => {
                setDebouncedQuery(searchQuery);
            }, DEBOUNCE_MS);
        } else {
            setDebouncedQuery('');
            setSearchResults([]);
            setHasSearched(false);
        }

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [searchQuery]);

    // Search users when debounced query changes
    useEffect(() => {
        if (!debouncedQuery || debouncedQuery.length < MIN_SEARCH_LENGTH) {
            return;
        }

        const searchUsers = async () => {
            setIsSearching(true);
            try {
                const response = await fetch(
                    `/api/users/search?query=${encodeURIComponent(debouncedQuery)}`,
                    {
                        headers: {
                            Accept: 'application/json',
                        },
                    },
                );

                if (response.ok) {
                    const data = await response.json();
                    // Filter out already selected users
                    const selectedIds = selectedUsers.map((u) => u.id);
                    setSearchResults(
                        (data.users ?? []).filter(
                            (user: UserOption) =>
                                !selectedIds.includes(user.id),
                        ),
                    );
                }
            } catch (error) {
                console.error('Failed to search users:', error);
            } finally {
                setIsSearching(false);
                setHasSearched(true);
            }
        };

        searchUsers();
    }, [debouncedQuery, selectedUsers]);

    const resetForm = useCallback(() => {
        setType('direct');
        setName('');
        setSearchQuery('');
        setDebouncedQuery('');
        setSelectedUsers([]);
        setSearchResults([]);
        setHasSearched(false);
        setErrors({});
    }, []);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            resetForm();
        }
    };

    const selectUser = (user: UserOption) => {
        // For direct messages, only allow 1 selection
        if (type === 'direct') {
            setSelectedUsers([user]);
        } else {
            setSelectedUsers((prev) => [...prev, user]);
        }
        // Remove from search results
        setSearchResults((prev) => prev.filter((u) => u.id !== user.id));
        // Clear search
        setSearchQuery('');
        setDebouncedQuery('');
        setHasSearched(false);
    };

    const removeUser = (userId: number) => {
        setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
    };

    const handleTypeChange = (newType: ConversationType) => {
        setType(newType);
        // Reset selections when changing to direct (keep max 1)
        if (newType === 'direct' && selectedUsers.length > 1) {
            setSelectedUsers(selectedUsers.slice(0, 1));
        }
    };

    const canSubmit = () => {
        if (type === 'direct') {
            return selectedUsers.length === 1;
        }
        // Group: need name and at least 1 participant
        return name.trim() && selectedUsers.length >= 1;
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
                        document.querySelector<HTMLMetaElement>(
                            'meta[name="csrf-token"]',
                        )?.content ?? '',
                },
                body: JSON.stringify({
                    type,
                    name: type === 'group' ? name : '',
                    participant_ids: selectedUsers.map((u) => u.id),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    // Laravel returns errors as arrays, convert to strings
                    const formattedErrors: Record<string, string> = {};
                    for (const [key, value] of Object.entries(data.errors)) {
                        formattedErrors[key] = Array.isArray(value) ? value[0] : String(value);
                    }
                    setErrors(formattedErrors);
                } else if (data.message) {
                    // Handle general error message
                    setErrors({ general: data.message });
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

                {/* General error message */}
                {errors.general && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        {errors.general}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Conversation Type */}
                    <div className="space-y-3">
                        <Label>Conversation Type</Label>
                        <RadioGroup
                            value={type}
                            onValueChange={(v) =>
                                handleTypeChange(v as ConversationType)
                            }
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="direct"
                                    id="create-direct"
                                />
                                <Label
                                    htmlFor="create-direct"
                                    className="flex cursor-pointer items-center gap-2"
                                >
                                    <User className="h-4 w-4" />
                                    Direct Message
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="group"
                                    id="create-group"
                                />
                                <Label
                                    htmlFor="create-group"
                                    className="flex cursor-pointer items-center gap-2"
                                >
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
                                Group Name{' '}
                                <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="conversation-name"
                                type="text"
                                placeholder="Enter group name..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <InputError message={errors.name} />
                        </div>
                    )}

                    {/* Participant Selection */}
                    <div className="space-y-3">
                        <Label>
                            {type === 'direct'
                                ? 'Find a person by email'
                                : 'Add participants by email'}
                            <span className="text-destructive"> *</span>
                        </Label>

                        {/* Selected Users */}
                        {selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {selectedUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-2 rounded-full bg-secondary py-1 pr-1 pl-3 text-sm text-secondary-foreground"
                                    >
                                        <Avatar className="h-5 w-5">
                                            <AvatarImage
                                                src={user.avatar}
                                                alt={user.name}
                                            />
                                            <AvatarFallback className="text-[10px]">
                                                {user.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="max-w-32 truncate">
                                            {user.name}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 rounded-full"
                                            onClick={() => removeUser(user.id)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Search Input */}
                        {(type === 'group' || selectedUsers.length === 0) && (
                            <div className="relative">
                                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="Enter email address to search..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="pl-9"
                                    autoComplete="off"
                                />
                                {isSearching && (
                                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                        <Spinner className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Search hint */}
                        {searchQuery.length > 0 &&
                            searchQuery.length < MIN_SEARCH_LENGTH && (
                                <p className="text-xs text-muted-foreground">
                                    Enter at least {MIN_SEARCH_LENGTH}{' '}
                                    characters to search
                                </p>
                            )}

                        {/* Search Results */}
                        {(searchResults.length > 0 ||
                            (hasSearched && !isSearching)) && (
                                <ScrollArea className="max-h-48 rounded-lg border">
                                    {searchResults.length > 0 ? (
                                        <div className="divide-y">
                                            {searchResults.map((user) => (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted"
                                                    onClick={() => selectUser(user)}
                                                >
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage
                                                            src={user.avatar}
                                                            alt={user.name}
                                                        />
                                                        <AvatarFallback className="text-sm">
                                                            {user.name
                                                                .charAt(0)
                                                                .toUpperCase()}
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
                                    ) : (
                                        hasSearched &&
                                        !isSearching &&
                                        debouncedQuery.length >=
                                        MIN_SEARCH_LENGTH && (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <Search className="mb-2 h-8 w-8 text-muted-foreground" />
                                                <p className="text-sm text-muted-foreground">
                                                    No users found with email "
                                                    {debouncedQuery}"
                                                </p>
                                            </div>
                                        )
                                    )}
                                </ScrollArea>
                            )}

                        {/* Empty state when no search and no selection */}
                        {selectedUsers.length === 0 &&
                            !hasSearched &&
                            searchQuery.length === 0 && (
                                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
                                    <Mail className="mb-2 h-8 w-8 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        Search by email address to find users
                                    </p>
                                </div>
                            )}

                        <InputError message={errors.participant_ids} />
                    </div>
                </div>

                <DialogFooter className="gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!canSubmit() || isSubmitting}
                    >
                        {isSubmitting ? 'Creating...' : 'Create Conversation'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
