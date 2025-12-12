<?php

namespace App\Enums;

enum UserPlan: string
{
    case Free = 'free';
    case Premium = 'premium';

    public function label(): string
    {
        return match ($this) {
            self::Free => 'Free',
            self::Premium => 'Premium',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Free => 'Basic features with limited access',
            self::Premium => 'Full access to all features',
        };
    }
}
