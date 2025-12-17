import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Crown, MoreHorizontal, Pencil, Trash2, Shield, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import type { Member, ProjectRole } from '../lib/types';

const ROLE_BADGE_CONFIG: Record<ProjectRole, { label: string; icon: typeof Crown; variant: 'default' | 'secondary' | 'outline' }> = {
    owner: { label: 'Owner', icon: Crown, variant: 'default' },
    editor: { label: 'Editor', icon: Shield, variant: 'secondary' },
    viewer: { label: 'Viewer', icon: Eye, variant: 'outline' },
};

interface MembersListProps {
    members: Member[];
    isOwner: boolean;
    onEditMember: (member: Member) => void;
    onRemoveMember: (member: Member) => void;
}

export function MembersList({ members, isOwner, onEditMember, onRemoveMember }: MembersListProps) {
    const getInitials = useInitials();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-lg border bg-card"
        >
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-75">Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        {isOwner && <TableHead className="w-17.5">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {members.map((member, index) => {
                        const roleConfig = ROLE_BADGE_CONFIG[member.role];
                        const RoleIcon = roleConfig.icon;

                        return (
                            <motion.tr
                                key={member.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                            >
                                {/* Member Info */}
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-10">
                                            <AvatarImage src={member.avatar ?? undefined} alt={member.name} />
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {getInitials(member.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{member.name}</span>
                                            <span className="text-sm text-muted-foreground">{member.email}</span>
                                        </div>
                                    </div>
                                </TableCell>

                                {/* Role Badge */}
                                <TableCell>
                                    <Badge
                                        variant={roleConfig.variant}
                                        className={cn(
                                            'gap-1.5',
                                            member.is_owner && 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400'
                                        )}
                                    >
                                        <RoleIcon className="size-3" />
                                        {roleConfig.label}
                                    </Badge>
                                </TableCell>

                                {/* Joined Date */}
                                <TableCell className="text-muted-foreground">
                                    {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                                </TableCell>

                                {/* Actions */}
                                {isOwner && (
                                    <TableCell>
                                        {!member.is_owner ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="size-8">
                                                        <MoreHorizontal className="size-4" />
                                                        <span className="sr-only">Open menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => onEditMember(member)}>
                                                        <Pencil className="mr-2 size-4" />
                                                        Change Role
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => onRemoveMember(member)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 size-4" />
                                                        Remove
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        ) : (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex size-8 items-center justify-center">
                                                        <Crown className="size-4 text-amber-500" />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>Project Owner</TooltipContent>
                                            </Tooltip>
                                        )}
                                    </TableCell>
                                )}
                            </motion.tr>
                        );
                    })}
                </TableBody>
            </Table>
        </motion.div>
    );
}
