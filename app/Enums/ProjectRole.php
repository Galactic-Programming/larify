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
            self::Editor => 'Can create, edit and delete tasks and lists',
            self::Viewer => 'Can only view project content',
        };
    }

    public function canEdit(): bool
    {
        return in_array($this, [self::Owner, self::Editor]);
    }

    public function canManageMembers(): bool
    {
        return $this === self::Owner;
    }
}
