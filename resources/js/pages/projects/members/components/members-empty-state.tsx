import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { UserPlus, Users } from 'lucide-react';
import { motion } from 'motion/react';

interface MembersEmptyStateProps {
    isOwner: boolean;
    onAddMember?: () => void;
}

export function MembersEmptyState({ isOwner, onAddMember }: MembersEmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
        >
            {isOwner ? (
                /* Owner view - can add members */
                <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-16">
                    <div className="relative mb-6">
                        <div className="flex size-20 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 shadow-xl shadow-primary/10">
                            <Users className="size-10 text-primary" />
                        </div>
                        <div className="absolute -top-2 -right-2 flex size-8 animate-bounce items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                            <UserPlus className="size-4" />
                        </div>
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">No team members yet</h3>
                    <p className="mb-6 max-w-sm text-center text-muted-foreground">
                        Start collaborating by adding team members to your project.
                        They'll be able to view or edit tasks based on their role.
                    </p>
                    {onAddMember && (
                        <Button
                            onClick={onAddMember}
                            size="lg"
                            className="gap-2 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
                        >
                            <UserPlus className="size-4" />
                            Add your first member
                        </Button>
                    )}
                </div>
            ) : (
                /* Non-owner view */
                <Empty className="border">
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <Users />
                        </EmptyMedia>
                        <EmptyTitle>Project Members</EmptyTitle>
                        <EmptyDescription>
                            Only the project owner can manage team members.
                            Contact the owner if you need to add collaborators.
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            )}
        </motion.div>
    );
}
