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
}
