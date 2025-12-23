<?php

namespace App\Enums;

enum ConversationType: string
{
    case Direct = 'direct';
    case Group = 'group';

    public function label(): string
    {
        return match ($this) {
            self::Direct => 'Direct Message',
            self::Group => 'Group Chat',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Direct => 'One-on-one private conversation',
            self::Group => 'Group conversation with multiple participants',
        };
    }

    /**
     * Check if the conversation type is a group.
     */
    public function isGroup(): bool
    {
        return $this === self::Group;
    }

    /**
     * Check if the conversation type is direct.
     */
    public function isDirect(): bool
    {
        return $this === self::Direct;
    }
}
