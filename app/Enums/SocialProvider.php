<?php

namespace App\Enums;

enum SocialProvider: string
{
    case Google = 'google';
    case GitHub = 'github';

    public function label(): string
    {
        return match ($this) {
            self::Google => 'Google',
            self::GitHub => 'GitHub',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::Google => 'google',
            self::GitHub => 'github',
        };
    }
}
