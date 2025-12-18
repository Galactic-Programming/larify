# Role-Based Permission System

This document describes the role-based permission system implemented in Larify for project collaboration.

## Overview

Larify uses a three-tier role system for project access control:

| Role       | Description                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------- |
| **Owner**  | Full control over the project. Can manage members, settings, and perform all actions.                       |
| **Editor** | Can create and edit tasks/lists, complete tasks. Cannot delete or reopen tasks, manage members or settings. |
| **Viewer** | Read-only access. Can only view project content without making any changes.                                 |

## Permission Matrix

### Task Operations

| Action                 | Owner | Editor | Viewer |
| ---------------------- | :---: | :----: | :----: |
| View tasks             |  ✅   |   ✅   |   ✅   |
| Create tasks           |  ✅   |   ✅   |   ❌   |
| Edit tasks             |  ✅   |   ✅   |   ❌   |
| Delete tasks           |  ✅   |   ❌   |   ❌   |
| Complete tasks         |  ✅   |   ✅   |   ❌   |
| Reopen completed tasks |  ✅   |   ❌   |   ❌   |
| Drag/reorder tasks     |  ✅   |   ✅   |   ❌   |
| Assign tasks           |  ✅   |   ✅   |   ❌   |

### List Operations

| Action        | Owner | Editor | Viewer |
| ------------- | :---: | :----: | :----: |
| View lists    |  ✅   |   ✅   |   ✅   |
| Create lists  |  ✅   |   ✅   |   ❌   |
| Edit lists    |  ✅   |   ✅   |   ❌   |
| Delete lists  |  ✅   |   ❌   |   ❌   |
| Reorder lists |  ✅   |   ✅   |   ❌   |

### Project Management

| Action                | Owner | Editor | Viewer |
| --------------------- | :---: | :----: | :----: |
| View project          |  ✅   |   ✅   |   ✅   |
| Edit project settings |  ✅   |   ❌   |   ❌   |
| Delete project        |  ✅   |   ❌   |   ❌   |
| Manage members        |  ✅   |   ❌   |   ❌   |
| View members          |  ✅   |   ✅   |   ✅   |

## Implementation Details

### Backend

#### ProjectRole Enum

Located at `app/Enums/ProjectRole.php`:

```php
enum ProjectRole: string
{
    case Owner = 'owner';
    case Editor = 'editor';
    case Viewer = 'viewer';

    public function canEdit(): bool
    {
        return $this !== self::Viewer;
    }

    public function canDelete(): bool
    {
        return $this === self::Owner;
    }

    public function canManageSettings(): bool
    {
        return $this === self::Owner;
    }

    public function canReopen(): bool
    {
        return $this === self::Owner;
    }

    public function canManageMembers(): bool
    {
        return $this === self::Owner;
    }
}
```

#### Project Model Methods

The `Project` model provides helper methods for permission checks:

```php
// Get user's role in the project
$project->getMemberRole($user);  // Returns ProjectRole enum

// Check specific permissions
$project->canEdit($user);          // Owner or Editor
$project->canDelete($user);        // Owner only
$project->canReopen($user);        // Owner only
$project->canManageSettings($user); // Owner only

// Get all permissions as array (for frontend)
$project->getPermissions($user);
// Returns: [
//     'canEdit' => bool,
//     'canDelete' => bool,
//     'canManageSettings' => bool,
//     'canManageMembers' => bool,
//     'canReopen' => bool,
//     'role' => string
// ]
```

#### Policy Classes

Authorization is handled by Laravel Policies:

- `TaskPolicy` - Controls task CRUD operations
- `TaskListPolicy` - Controls list CRUD operations
- `ProjectPolicy` - Controls project-level operations

Example policy method:

```php
// TaskPolicy.php
public function delete(User $user, Task $task): bool
{
    return $task->list->project->canDelete($user);
}

public function reopen(User $user, Task $task): bool
{
    return $task->list->project->canReopen($user);
}
```

### Frontend

#### Permissions Interface

Located at `resources/js/pages/projects/lists/lib/types.ts`:

```typescript
export interface Permissions {
    canEdit: boolean;
    canDelete: boolean;
    canManageSettings: boolean;
    canManageMembers: boolean;
    canReopen: boolean;
    role: 'owner' | 'editor' | 'viewer';
}
```

#### Component Usage

Permissions are passed from the controller to page components:

```tsx
// In controller
return Inertia::render('projects/lists/index', [
    'project' => $project,
    'permissions' => $project->getPermissions($user),
]);

// In React component
function TaskCard({ task, permissions }: Props) {
    return (
        <div>
            {permissions.canEdit && (
                <Button onClick={handleEdit}>Edit</Button>
            )}
            {permissions.canDelete && (
                <Button onClick={handleDelete}>Delete</Button>
            )}
        </div>
    );
}
```

## UI Behavior by Role

### Owner View

- Full access to all UI elements
- Can see and use all action buttons (create, edit, delete)
- Can access project settings
- Can manage team members

### Editor View

- Can see create and edit buttons
- Delete buttons are hidden
- Reopen button is hidden on completed tasks
- Settings and member management links are hidden
- Can drag and reorder tasks/lists

### Viewer View

- Read-only interface
- All action buttons are hidden
- Cannot drag or reorder anything
- Can only view task details
- Settings and member management links are hidden

## Testing

Permission tests are located at `tests/Feature/ProjectPermissionTest.php`:

```bash
php artisan test tests/Feature/ProjectPermissionTest.php
```

The test suite covers:

- Owner permissions (full access)
- Editor permissions (create/edit only)
- Viewer permissions (view only)
- `getPermissions()` method returns correct values

## Security Notes

1. **Backend Enforcement**: All permissions are enforced server-side through Laravel Policies. Frontend checks are for UX only.

2. **Gate Checks**: Form Requests use `Gate::allows()` for authorization before validation.

3. **Policy Registration**: Policies are auto-discovered by Laravel's policy naming conventions.

4. **Audit Trail**: Consider implementing activity logging for sensitive operations.
