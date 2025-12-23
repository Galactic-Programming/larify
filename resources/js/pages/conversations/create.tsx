import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { ConversationType } from '@/types/chat';
import { Head, router, useForm } from '@inertiajs/react';
import { Search, User, Users } from 'lucide-react';
import { useState, useMemo } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
}

interface Props {
    users: User[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Conversations', href: '/conversations' },
    { title: 'New Conversation', href: '/conversations/create' },
];

export default function CreateConversation({ users }: Props) {
    const [type, setType] = useState<ConversationType>('direct');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

    const { data, setData, post, processing, errors } = useForm({
        type: 'direct' as ConversationType,
        name: '',
        participant_ids: [] as number[],
    });

    // Filter users by search
    const filteredUsers = useMemo(() => {
        if (!searchQuery) return users;
        const query = searchQuery.toLowerCase();
        return users.filter(
            (user) =>
                user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
        );
    }, [users, searchQuery]);

    const toggleUser = (userId: number) => {
        setSelectedUserIds((prev) => {
            const newIds = prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId];

            setData('participant_ids', newIds);
            return newIds;
        });
    };

    const handleTypeChange = (newType: ConversationType) => {
        setType(newType);
        setData('type', newType);

        // Reset selections when changing type
        if (newType === 'direct') {
            // Keep max 1 user for direct
            const ids = selectedUserIds.slice(0, 1);
            setSelectedUserIds(ids);
            setData('participant_ids', ids);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/conversations');
    };

    const canSubmit = () => {
        if (type === 'direct') {
            return selectedUserIds.length === 1;
        }
        // Group: need name and at least 1 participant
        return data.name.trim() && selectedUserIds.length >= 1;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Conversation" />
            <div className="mx-auto max-w-4xl p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Start a New Conversation</CardTitle>
                        <CardDescription>
                            Create a direct message or a group conversation
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Conversation Type */}
                            <div className="space-y-3">
                                <Label>Conversation Type</Label>
                                <RadioGroup
                                    value={type}
                                    onValueChange={(v) => handleTypeChange(v as ConversationType)}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="direct" id="direct" />
                                        <Label htmlFor="direct" className="flex cursor-pointer items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Direct Message
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="group" id="group" />
                                        <Label htmlFor="group" className="flex cursor-pointer items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Group Conversation
                                        </Label>
                                    </div>
                                </RadioGroup>
                                {errors.type && (
                                    <p className="text-destructive text-sm">{errors.type}</p>
                                )}
                            </div>

                            {/* Group Name (only for group) */}
                            {type === 'group' && (
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Group Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Enter group name..."
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        autoFocus
                                    />
                                    {errors.name && (
                                        <p className="text-destructive text-sm">{errors.name}</p>
                                    )}
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
                                <ScrollArea className="border rounded-lg h-75">
                                    {filteredUsers.length > 0 ? (
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
                                                        className={`hover:bg-muted flex cursor-pointer items-center gap-3 p-3 transition-colors ${isDisabled
                                                                ? 'opacity-50 cursor-not-allowed'
                                                                : ''
                                                            }`}
                                                    >
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() =>
                                                                !isDisabled && toggleUser(user.id)
                                                            }
                                                            disabled={isDisabled}
                                                        />
                                                        <Avatar className="h-10 w-10">
                                                            <AvatarImage
                                                                src={user.avatar}
                                                                alt={user.name}
                                                            />
                                                            <AvatarFallback>
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate font-medium">
                                                                {user.name}
                                                            </p>
                                                            <p className="text-muted-foreground truncate text-sm">
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <Search className="text-muted-foreground mb-2 h-12 w-12" />
                                            <p className="text-muted-foreground">
                                                No users found matching "{searchQuery}"
                                            </p>
                                        </div>
                                    )}
                                </ScrollArea>

                                {errors.participant_ids && (
                                    <p className="text-destructive text-sm">
                                        {errors.participant_ids}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit('/conversations')}
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={!canSubmit() || processing}>
                                    {processing ? 'Creating...' : 'Create Conversation'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
