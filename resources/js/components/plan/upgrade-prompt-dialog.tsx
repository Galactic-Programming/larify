import { Link } from '@inertiajs/react';
import { Crown, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { index as billingIndex } from '@/routes/billing';

interface UpgradePromptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    feature?: string;
}

export function UpgradePromptDialog({
    open,
    onOpenChange,
    title = 'Upgrade to Pro',
    description = 'Unlock this feature and more with a Pro subscription.',
    feature,
}: UpgradePromptDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center sm:text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-amber-600">
                        <Crown className="h-6 w-6 text-white" />
                    </div>
                    <DialogTitle className="text-xl">{title}</DialogTitle>
                    <DialogDescription className="text-balance">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {feature && (
                    <div className="rounded-lg border bg-muted/50 p-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span>Pro Feature: {feature}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">
                        With Pro you get:
                    </p>
                    <ul className="ml-4 list-disc space-y-1">
                        <li>Unlimited projects</li>
                        <li>Unlimited lists per project</li>
                        <li>Team collaboration</li>
                        <li>30-day activity history</li>
                        <li>Due date reminders</li>
                        <li>Full color & icon palette</li>
                    </ul>
                </div>

                <DialogFooter className="gap-3">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Maybe Later
                    </Button>
                    <Button asChild className="gap-2">
                        <Link href={billingIndex.url()}>
                            <Crown className="h-4 w-4" />
                            View Plans
                        </Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
