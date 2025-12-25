import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import AppLogoIcon from './app-logo-icon';
import { Badge } from './ui/badge';

export default function AppLogo() {
    const { auth } = usePage<SharedData>().props;
    const plan = auth?.user?.plan || 'free';

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <div className="flex items-center gap-2">
                    <span className="mb-0.5 truncate leading-tight font-semibold">
                        LaraFlow
                    </span>
                    <Badge
                        variant={plan === 'pro' ? 'default' : 'secondary'}
                        className="h-4 px-1.5 py-0 text-[10px]"
                    >
                        {plan === 'pro' ? 'Pro' : 'Free'}
                    </Badge>
                </div>
            </div>
        </>
    );
}
