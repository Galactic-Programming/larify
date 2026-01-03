import { PlanLimits, SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

/**
 * Hook to access plan limits from shared Inertia data.
 * Returns plan limits or null if user is not authenticated.
 */
export function usePlanLimits(): PlanLimits | null {
    const { planLimits } = usePage<SharedData>().props;
    return planLimits;
}

/**
 * Hook to check if user can perform specific plan-gated actions.
 */
export function usePlanFeatures() {
    const limits = usePlanLimits();

    return {
        // Feature checks
        canUseChat: limits?.can_use_chat ?? false,
        canInviteMembers: limits?.can_invite_members ?? false,
        canUseDueDateReminders: limits?.can_use_due_date_reminders ?? false,
        hasFullPalette: limits?.has_full_palette ?? false,
        canUploadAttachments: limits?.can_upload_attachments ?? false,

        // Limit checks
        canCreateProject: limits?.can_create_project ?? false,
        remainingProjectSlots: limits?.remaining_project_slots ?? 0,
        maxProjects: limits?.max_projects ?? 3,
        maxListsPerProject: limits?.max_lists_per_project ?? 5,
        activityRetentionDays: limits?.activity_retention_days ?? 7,

        // Attachment limits
        maxAttachmentSize: limits?.max_attachment_size ?? 5 * 1024 * 1024,
        maxAttachmentSizeMb: limits?.max_attachment_size_mb ?? 5,
        maxAttachmentStorage:
            limits?.max_attachment_storage ?? 50 * 1024 * 1024,
        maxAttachmentStorageMb: limits?.max_attachment_storage_mb ?? 50,
        allowedAttachmentExtensions:
            limits?.allowed_attachment_extensions ?? [],

        // Current usage
        currentProjects: limits?.current_projects ?? 0,

        // Utility
        isLoaded: limits !== null,
        isPro: limits?.can_invite_members ?? false, // Pro users can invite members
    };
}

/**
 * Hook to get upgrade prompt info based on what feature is blocked.
 */
export function useUpgradePrompt(feature: keyof PlanLimits) {
    const limits = usePlanLimits();

    const promptMessages: Record<
        string,
        { title: string; description: string }
    > = {
        can_use_chat: {
            title: 'Chat Feature',
            description: 'Communicate with your team directly within projects.',
        },
        can_invite_members: {
            title: 'Team Collaboration is Pro Only',
            description:
                'Upgrade to Pro to invite team members and collaborate on projects.',
        },
        can_use_due_date_reminders: {
            title: 'Due Date Reminders are Pro Only',
            description:
                'Upgrade to Pro to receive reminders before task deadlines.',
        },
        has_full_palette: {
            title: 'Full Color Palette is Pro Only',
            description:
                'Upgrade to Pro to access all colors and icons for your projects.',
        },
        can_create_project: {
            title: 'Project Limit Reached',
            description: `You've reached your limit of ${limits?.max_projects ?? 3} projects. Upgrade to Pro for unlimited projects.`,
        },
    };

    const isBlocked = limits ? !limits[feature] : true;
    const prompt = promptMessages[feature] ?? {
        title: 'Pro Feature',
        description: 'Upgrade to Pro to unlock this feature.',
    };

    return {
        isBlocked,
        ...prompt,
    };
}
