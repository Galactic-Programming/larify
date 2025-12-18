<?php

namespace App\Enums;

enum ActivityType: string
{
    // Task activities
    case TaskCreated = 'task.created';
    case TaskUpdated = 'task.updated';
    case TaskCompleted = 'task.completed';
    case TaskReopened = 'task.reopened';
    case TaskDeleted = 'task.deleted';
    case TaskAssigned = 'task.assigned';
    case TaskMoved = 'task.moved';

    // Project activities
    case ProjectCreated = 'project.created';
    case ProjectUpdated = 'project.updated';
    case ProjectArchived = 'project.archived';
    case ProjectRestored = 'project.restored';

    // Member activities
    case MemberAdded = 'member.added';
    case MemberRemoved = 'member.removed';
    case MemberRoleChanged = 'member.role_changed';

    // List activities
    case ListCreated = 'list.created';
    case ListUpdated = 'list.updated';
    case ListDeleted = 'list.deleted';
    case ListReordered = 'list.reordered';

    /**
     * Get the human-readable label for the activity type.
     */
    public function label(): string
    {
        return match ($this) {
            self::TaskCreated => 'created a task',
            self::TaskUpdated => 'updated a task',
            self::TaskCompleted => 'completed a task',
            self::TaskReopened => 'reopened a task',
            self::TaskDeleted => 'deleted a task',
            self::TaskAssigned => 'assigned a task',
            self::TaskMoved => 'moved a task',
            self::ProjectCreated => 'created the project',
            self::ProjectUpdated => 'updated the project',
            self::ProjectArchived => 'archived the project',
            self::ProjectRestored => 'restored the project',
            self::MemberAdded => 'added a member',
            self::MemberRemoved => 'removed a member',
            self::MemberRoleChanged => 'changed member role',
            self::ListCreated => 'created a list',
            self::ListUpdated => 'updated a list',
            self::ListDeleted => 'deleted a list',
            self::ListReordered => 'reordered lists',
        };
    }

    /**
     * Get the icon name for the activity type.
     */
    public function icon(): string
    {
        return match ($this) {
            self::TaskCreated => 'plus-circle',
            self::TaskUpdated => 'pencil',
            self::TaskCompleted => 'check-circle',
            self::TaskReopened => 'rotate-ccw',
            self::TaskDeleted => 'trash',
            self::TaskAssigned => 'user-plus',
            self::TaskMoved => 'move',
            self::ProjectCreated => 'folder-plus',
            self::ProjectUpdated => 'folder-edit',
            self::ProjectArchived => 'archive',
            self::ProjectRestored => 'archive-restore',
            self::MemberAdded => 'user-plus',
            self::MemberRemoved => 'user-minus',
            self::MemberRoleChanged => 'shield',
            self::ListCreated => 'list-plus',
            self::ListUpdated => 'list',
            self::ListDeleted => 'list-x',
            self::ListReordered => 'arrow-up-down',
        };
    }
}
