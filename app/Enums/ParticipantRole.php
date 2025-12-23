<?php

namespace App\Enums;

enum ParticipantRole: string
{
    case Owner = 'owner';
    case Member = 'member';

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Owner',
            self::Member => 'Member',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Owner => 'Can manage group settings, add/remove members, and delete conversation',
            self::Member => 'Can send messages and view conversation',
        };
    }

    /**
     * Check if the role is owner.
     */
    public function isOwner(): bool
    {
        return $this === self::Owner;
    }

    /**
     * Check if the role can manage members (add/remove).
     */
    public function canManageMembers(): bool
    {
        return $this === self::Owner;
    }

    /**
     * Check if the role can delete the conversation.
     */
    public function canDeleteConversation(): bool
    {
        return $this === self::Owner;
    }

    /**
     * Check if the role can update group settings (name, avatar).
     */
    public function canUpdateSettings(): bool
    {
        return $this === self::Owner;
    }
}
