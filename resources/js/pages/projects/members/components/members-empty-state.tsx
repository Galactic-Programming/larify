import { Button } from '@/components/ui/button';
import { index as billingIndex } from '@/routes/billing';
import { Link } from '@inertiajs/react';
import { Crown, Sparkles, UserPlus, Users } from 'lucide-react';
import { motion } from 'motion/react';

interface MembersEmptyStateProps {
    canManageMembers: boolean;
    onAddMember?: () => void;
}

export function MembersEmptyState({ canManageMembers, onAddMember }: MembersEmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
        >
            {canManageMembers ? (
                /* Pro plan owner view - can add members */
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
                /* Free plan - show upgrade prompt */
                <div className="flex flex-col items-center justify-center rounded-lg border bg-linear-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 py-16">
                    <div className="relative mb-6">
                        <div className="flex size-20 items-center justify-center rounded-2xl bg-linear-to-br from-amber-500/20 to-orange-500/20 shadow-xl shadow-amber-500/10">
                            <Users className="size-10 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full bg-linear-to-br from-amber-500 to-orange-500 text-white shadow-lg">
                            <Crown className="size-4" />
                        </div>
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                        <h3 className="text-xl font-semibold">Team Collaboration</h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-xs font-medium text-white">
                            <Sparkles className="size-3" />
                            Pro
                        </span>
                    </div>
                    <p className="mb-6 max-w-md text-center text-muted-foreground">
                        Invite team members to collaborate on your projects.
                        Assign tasks, track progress together, and boost your productivity.
                    </p>
                    <div className="flex flex-col items-center gap-3">
                        <Button
                            asChild
                            size="lg"
                            className="gap-2 bg-linear-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25 transition-all duration-300 hover:from-amber-600 hover:to-orange-600 hover:shadow-xl hover:shadow-amber-500/30"
                        >
                            <Link href={billingIndex().url}>
                                <Crown className="size-4" />
                                Upgrade to Pro
                            </Link>
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            Starting at $9.99/month • Cancel anytime
                        </p>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
