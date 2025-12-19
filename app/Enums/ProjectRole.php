<?php

namespace App\Enums;

enum ProjectRole: string
{
    case Owner = 'owner';
    case Editor = 'editor';
    case Viewer = 'viewer';

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Owner',
            self::Editor => 'Editor',
            self::Viewer => 'Viewer',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::Owner => 'Full access, can manage members and delete project',
            self::Editor => 'Can create and edit tasks/lists, but cannot delete or assign tasks',
            self::Viewer => 'Can only view project content',
        };
    }

    /**
     * Check if the role can edit (create, update) content.
     */
    public function canEdit(): bool
    {
        return in_array($this, [self::Owner, self::Editor]);
    }

    /**
     * Check if the role can delete content (tasks, lists).
     */
    public function canDelete(): bool
    {
        return $this === self::Owner;
    }

    /**
     * Check if the role can manage project settings (name, description, statuses).
     */
    public function canManageSettings(): bool
    {
        return $this === self::Owner;
    }

    /**
     * Check if the role can reopen completed tasks.
     */
    public function canReopen(): bool
    {
        return $this === self::Owner;
    }

    /**
     * Check if the role can manage members.
     */
    public function canManageMembers(): bool
    {
        return $this === self::Owner;
    }

    /**
     * Check if the role can assign tasks to other members.
     */
    public function canAssignTask(): bool
    {
        return $this === self::Owner;
    }
}
