import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { type User } from '@/types';
import { Crown } from 'lucide-react';

export function UserInfo({
    user,
    showEmail = false,
    showPlanBadge = false,
}: {
    user: User;
    showEmail?: boolean;
    showPlanBadge?: boolean;
}) {
    const getInitials = useInitials();
    const isPro = user.plan === 'pro';

    return (
        <>
            <Avatar className="h-8 w-8 overflow-hidden rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="flex items-center gap-1.5 truncate font-medium">
                    {user.name}
                    {showPlanBadge && (
                        <Badge
                            variant={isPro ? 'default' : 'secondary'}
                            className={cn(
                                'px-1.5 py-0 text-[10px] font-medium',
                                isPro &&
                                'bg-linear-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700',
                            )}
                        >
                            {isPro && <Crown className="mr-0.5 h-2.5 w-2.5" />}
                            {user.plan_label ?? 'Free'}
                        </Badge>
                    )}
                </span>
                {showEmail && (
                    <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
