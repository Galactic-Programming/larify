import { useState, type ReactNode } from 'react';

import { usePlanFeatures } from '@/hooks/use-plan-limits';

import { UpgradePromptDialog } from './upgrade-prompt-dialog';

type FeatureKey =
    | 'canUseChat'
    | 'canInviteMembers'
    | 'canUseDueDateReminders'
    | 'hasFullPalette'
    | 'canCreateProject';

interface FeatureGateProps {
    feature: FeatureKey;
    children: ReactNode;
    fallback?: ReactNode;
    /** If true, show upgrade dialog when blocked. If false, show fallback or nothing */
    showUpgradePrompt?: boolean;
    /** Custom title for upgrade dialog */
    upgradeTitle?: string;
    /** Custom description for upgrade dialog */
    upgradeDescription?: string;
    /** Feature name shown in upgrade dialog */
    featureName?: string;
}

const featureMessages: Record<
    FeatureKey,
    { title: string; description: string; name: string }
> = {
    canUseChat: {
        title: 'Chat is a Pro Feature',
        description:
            'Upgrade to Pro to communicate with your team directly within projects.',
        name: 'Team Chat',
    },
    canInviteMembers: {
        title: 'Team Collaboration is Pro Only',
        description:
            'Upgrade to Pro to invite team members and collaborate on projects.',
        name: 'Team Collaboration',
    },
    canUseDueDateReminders: {
        title: 'Due Date Reminders are Pro Only',
        description:
            'Upgrade to Pro to receive reminders before task deadlines.',
        name: 'Due Date Reminders',
    },
    hasFullPalette: {
        title: 'Full Color Palette is Pro Only',
        description:
            'Upgrade to Pro to access all colors and icons for your projects.',
        name: 'Full Color Palette',
    },
    canCreateProject: {
        title: 'Project Limit Reached',
        description:
            "You've reached your project limit. Upgrade to Pro for unlimited projects.",
        name: 'Unlimited Projects',
    },
};

/**
 * Conditionally render children based on user's plan features.
 * Optionally shows an upgrade prompt dialog when access is denied.
 */
export function FeatureGate({
    feature,
    children,
    fallback = null,
    showUpgradePrompt = false,
    upgradeTitle,
    upgradeDescription,
    featureName,
}: FeatureGateProps) {
    const features = usePlanFeatures();
    const [showDialog, setShowDialog] = useState(false);

    const hasAccess = features[feature];
    const messages = featureMessages[feature];

    if (hasAccess) {
        return <>{children}</>;
    }

    if (showUpgradePrompt) {
        return (
            <>
                <div onClick={() => setShowDialog(true)}>{fallback}</div>
                <UpgradePromptDialog
                    open={showDialog}
                    onOpenChange={setShowDialog}
                    title={upgradeTitle ?? messages.title}
                    description={upgradeDescription ?? messages.description}
                    feature={featureName ?? messages.name}
                />
            </>
        );
    }

    return <>{fallback}</>;
}

interface FeatureGateButtonProps {
    feature: FeatureKey;
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    /** Custom title for upgrade dialog */
    upgradeTitle?: string;
    /** Custom description for upgrade dialog */
    upgradeDescription?: string;
    /** Feature name shown in upgrade dialog */
    featureName?: string;
}

/**
 * A button wrapper that shows upgrade dialog when user doesn't have access.
 * If user has access, the onClick handler is called normally.
 */
export function FeatureGateButton({
    feature,
    children,
    onClick,
    className,
    upgradeTitle,
    upgradeDescription,
    featureName,
}: FeatureGateButtonProps) {
    const features = usePlanFeatures();
    const [showDialog, setShowDialog] = useState(false);

    const hasAccess = features[feature];
    const messages = featureMessages[feature];

    const handleClick = () => {
        if (hasAccess) {
            onClick?.();
        } else {
            setShowDialog(true);
        }
    };

    return (
        <>
            <div onClick={handleClick} className={className}>
                {children}
            </div>
            <UpgradePromptDialog
                open={showDialog}
                onOpenChange={setShowDialog}
                title={upgradeTitle ?? messages.title}
                description={upgradeDescription ?? messages.description}
                feature={featureName ?? messages.name}
            />
        </>
    );
}
