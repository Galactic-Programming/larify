<?php

namespace App\Enums;

enum UserPlan: string
{
    case Free = 'free';
    case Pro = 'pro';

    public function label(): string
    {
        return match ($this) {
            self::Free => 'Free',
            self::Pro => 'Pro',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Free => 'Personal use with full features',
            self::Pro => 'Team collaboration + premium features',
        };
    }

    /**
     * Check if this plan allows team collaboration.
     */
    public function canInviteMembers(): bool
    {
        return $this === self::Pro;
    }

    /**
     * Check if this plan has access to premium features.
     */
    public function isPremium(): bool
    {
        return $this === self::Pro;
    }

    /**
     * Get maximum number of projects allowed.
     * Returns null for unlimited.
     */
    public function maxProjects(): ?int
    {
        return match ($this) {
            self::Free => 3,
            self::Pro => null, // Unlimited
        };
    }

    /**
     * Get maximum number of task lists per project.
     * Returns null for unlimited.
     */
    public function maxListsPerProject(): ?int
    {
        return match ($this) {
            self::Free => 5,
            self::Pro => null, // Unlimited
        };
    }

    /**
     * Get activity history retention in days.
     */
    public function activityRetentionDays(): int
    {
        return match ($this) {
            self::Free => 7,
            self::Pro => 30,
        };
    }

    /**
     * Check if this plan allows chat/conversations.
     * Note: Chat is now available for all plans.
     */
    public function canUseChat(): bool
    {
        return true;
    }

    /**
     * Check if this plan allows due date reminders.
     */
    public function canUseDueDateReminders(): bool
    {
        return $this === self::Pro;
    }

    /**
     * Check if this plan has full color/icon palette.
     */
    public function hasFullPalette(): bool
    {
        return $this === self::Pro;
    }

    /**
     * Get all limits as array (useful for frontend).
     *
     * @return array<string, mixed>
     */
    public function getLimits(): array
    {
        return [
            'max_projects' => $this->maxProjects(),
            'max_lists_per_project' => $this->maxListsPerProject(),
            'activity_retention_days' => $this->activityRetentionDays(),
            'can_invite_members' => $this->canInviteMembers(),
            'can_use_chat' => $this->canUseChat(),
            'can_use_due_date_reminders' => $this->canUseDueDateReminders(),
            'has_full_palette' => $this->hasFullPalette(),
        ];
    }
}
