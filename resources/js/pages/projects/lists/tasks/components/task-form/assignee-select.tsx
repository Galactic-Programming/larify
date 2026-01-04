import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserCircle } from 'lucide-react';
import type { User } from '../../../lib/types';
import { getInitials } from './constants';

interface AssigneeSelectProps {
    value: number | null;
    onChange: (value: number | null) => void;
    error?: string;
    members: User[];
    projectOwnerId: number;
    // For read-only mode
    readOnly?: boolean;
    readOnlyUser?: User | null;
    readOnlyTooltip?: string;
    // For form submission
    includeHiddenInput?: boolean;
    effectiveAssigneeId?: number | null;
}

export function AssigneeSelect({
    value,
    onChange,
    error,
    members,
    projectOwnerId,
    readOnly = false,
    readOnlyUser,
    readOnlyTooltip,
    includeHiddenInput = true,
    effectiveAssigneeId,
}: AssigneeSelectProps) {
    const selectedAssignee = members.find((m) => m.id === value);
    const assigneeIdForInput = effectiveAssigneeId ?? value;

    if (readOnly) {
        return (
            <div className="grid gap-2">
                <Label>Assignee</Label>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex h-9 items-center gap-2 rounded-md border bg-muted/50 px-3">
                            {readOnlyUser ? (
                                <>
                                    <Avatar className="size-5">
                                        <AvatarImage
                                            src={readOnlyUser.avatar ?? undefined}
                                        />
                                        <AvatarFallback className="text-[10px]">
                                            {getInitials(readOnlyUser.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate text-sm">
                                        {readOnlyUser.name}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <UserCircle className="size-5 text-muted-foreground" />
                                    <span className="truncate text-sm text-muted-foreground">
                                        Unassigned
                                    </span>
                                </>
                            )}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>{readOnlyTooltip}</TooltipContent>
                </Tooltip>
                {includeHiddenInput && (
                    <input
                        type="hidden"
                        name="assigned_to"
                        value={assigneeIdForInput ?? ''}
                    />
                )}
                <InputError message={error} />
            </div>
        );
    }

    return (
        <div className="grid gap-2">
            <Label>Assignee</Label>
            <Select
                value={value?.toString() ?? 'unassigned'}
                onValueChange={(v) =>
                    onChange(v === 'unassigned' ? null : parseInt(v, 10))
                }
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select assignee">
                        {selectedAssignee ? (
                            <div className="flex items-center gap-2">
                                <Avatar className="size-5">
                                    <AvatarImage
                                        src={selectedAssignee.avatar ?? undefined}
                                    />
                                    <AvatarFallback className="text-[10px]">
                                        {getInitials(selectedAssignee.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="truncate">
                                    {selectedAssignee.name}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <UserCircle className="size-5 text-muted-foreground" />
                                <span>Unassigned</span>
                            </div>
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="unassigned">
                        <div className="flex items-center gap-2">
                            <UserCircle className="size-5 text-muted-foreground" />
                            <span>Unassigned</span>
                        </div>
                    </SelectItem>
                    {members.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                            <div className="flex items-center gap-2">
                                <Avatar className="size-5">
                                    <AvatarImage
                                        src={member.avatar ?? undefined}
                                    />
                                    <AvatarFallback className="text-[10px]">
                                        {getInitials(member.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <span>{member.name}</span>
                                {member.id === projectOwnerId && (
                                    <span className="text-xs text-muted-foreground">
                                        (Owner)
                                    </span>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {includeHiddenInput && (
                <input
                    type="hidden"
                    name="assigned_to"
                    value={assigneeIdForInput ?? ''}
                />
            )}
            <InputError message={error} />
        </div>
    );
}
