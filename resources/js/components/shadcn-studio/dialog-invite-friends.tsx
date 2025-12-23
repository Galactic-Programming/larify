import { UserPlusIcon } from 'lucide-react';
import { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface InvitablePerson {
    id: string | number;
    name: string;
    email: string;
    avatarSrc?: string;
    avatarFallback?: string;
}

export interface DialogInviteFriendsProps {
    /** List of people that can be invited */
    people?: InvitablePerson[];
    /** Callback when email invite is submitted */
    onEmailInvite?: (email: string) => void | Promise<void>;
    /** Callback when a person is invited */
    onPersonInvite?: (person: InvitablePerson) => void | Promise<void>;
    /** Dialog title */
    title?: string;
    /** Trigger button text */
    triggerText?: string;
    /** Email input placeholder */
    emailPlaceholder?: string;
    /** Section title for people list */
    peopleListTitle?: string;
    /** Custom trigger element */
    trigger?: React.ReactNode;
    /** Control open state externally */
    open?: boolean;
    /** Callback when open state changes */
    onOpenChange?: (open: boolean) => void;
    className?: string;
}

const DialogInviteFriends = ({
    people = [],
    onEmailInvite,
    onPersonInvite,
    title = 'Invite new members',
    triggerText = 'Invite',
    emailPlaceholder = 'example@gmail.com',
    peopleListTitle = 'Invite Friends',
    trigger,
    open,
    onOpenChange,
    className,
}: DialogInviteFriendsProps) => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [invitingId, setInvitingId] = useState<string | number | null>(null);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !onEmailInvite) return;

        setIsSubmitting(true);
        try {
            await onEmailInvite(email);
            setEmail('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePersonInvite = async (person: InvitablePerson) => {
        if (!onPersonInvite) return;

        setInvitingId(person.id);
        try {
            await onPersonInvite(person);
        } finally {
            setInvitingId(null);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">{triggerText}</Button>}
            </DialogTrigger>
            <DialogContent className={cn('sm:max-w-lg', className)}>
                <DialogHeader className="text-center">
                    <DialogTitle className="text-xl">{title}</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={handleEmailSubmit}
                    className="flex gap-4 max-sm:flex-col"
                >
                    <div className="grid flex-1 gap-3">
                        <Label htmlFor="invite-email">Email</Label>
                        <Input
                            type="email"
                            id="invite-email"
                            name="email"
                            placeholder={emailPlaceholder}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <Button
                        type="submit"
                        className="sm:self-end"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Sending...' : 'Send Invite'}
                    </Button>
                </form>
                {people.length > 0 && (
                    <>
                        <p className="mt-2">{peopleListTitle}</p>
                        <ul className="space-y-4">
                            {people.map((person) => (
                                <li
                                    key={person.id}
                                    className="flex items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3 max-[420px]:w-50">
                                        <Avatar className="size-10">
                                            <AvatarImage
                                                src={person.avatarSrc}
                                                alt={person.name}
                                            />
                                            <AvatarFallback className="text-xs">
                                                {person.avatarFallback ||
                                                    getInitials(person.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-1 flex-col overflow-hidden">
                                            <span>{person.name}</span>
                                            <span className="truncate text-sm text-muted-foreground">
                                                {person.email}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            handlePersonInvite(person)
                                        }
                                        disabled={invitingId === person.id}
                                        className="bg-sky-600 text-white hover:bg-sky-600/90 focus-visible:ring-sky-600 dark:bg-sky-400 dark:hover:bg-sky-400/90 dark:focus-visible:ring-sky-400"
                                    >
                                        <UserPlusIcon />
                                        {invitingId === person.id
                                            ? 'Inviting...'
                                            : 'Invite'}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export { DialogInviteFriends };
export default DialogInviteFriends;
