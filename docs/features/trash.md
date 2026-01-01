# Trash & Restore System

This document describes the trash and restore system implemented in Larify for soft-deleting and recovering items.

## Overview

Larify uses Laravel's Soft Delete feature to provide a "trash" system where deleted items are kept for a configurable period before permanent deletion.

| Aspect               | Description                                                 |
| -------------------- | ----------------------------------------------------------- |
| **Soft Deletes**     | Items are marked as deleted but not removed from database   |
| **Retention Period** | 7 days by default (configurable via `TRASH_RETENTION_DAYS`) |
| **Cascade Behavior** | Deleting parent items cascades to children                  |
| **Restoration**      | Items can be restored within retention period               |

## Supported Item Types

| Type        | Model      | Cascade Behavior                                    |
| ----------- | ---------- | --------------------------------------------------- |
| **Project** | `Project`  | Soft-deletes all Lists and Tasks within the project |
| **List**    | `TaskList` | Soft-deletes all Tasks within the list              |
| **Task**    | `Task`     | No cascade (leaf node)                              |

## Permission Matrix

### Trash Operations

| Action               | Owner | Editor | Viewer |
| -------------------- | :---: | :----: | :----: |
| View trash           |  ✅   |   ❌   |   ❌   |
| Soft delete projects |  ✅   |   ❌   |   ❌   |
| Soft delete lists    |  ✅   |   ❌   |   ❌   |
| Soft delete tasks    |  ✅   |   ❌   |   ❌   |
| Restore projects     |  ✅   |   ❌   |   ❌   |
| Restore lists        |  ✅   |   ❌   |   ❌   |
| Restore tasks        |  ✅   |   ❌   |   ❌   |
| Permanently delete   |  ✅   |   ❌   |   ❌   |
| Empty all trash      |  ✅   |   ❌   |   ❌   |

## Implementation Details

### Backend

#### Configuration

Located at `config/trash.php`:

```php
return [
    // How many days items stay in trash before auto-deletion
    'retention_days' => env('TRASH_RETENTION_DAYS', 7),

    // Models to clean up (order matters - children before parents)
    'models' => [
        \App\Models\Task::class,
        \App\Models\TaskList::class,
        \App\Models\Project::class,
    ],
];
```

#### Model Setup

Each model that supports soft deletes uses the `SoftDeletes` trait:

```php
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use SoftDeletes;

    // Cascade soft delete to children
    protected static function booted(): void
    {
        static::deleting(function (Project $project) {
            if ($project->isForceDeleting()) {
                return;
            }
            // Soft delete all lists (which cascades to tasks)
            $project->lists()->each->delete();
        });

        static::restoring(function (Project $project) {
            // Restore all lists (which cascades to tasks)
            $project->lists()->onlyTrashed()->each->restore();
        });
    }
}
```

#### Controller

Located at `app/Http/Controllers/Trash/TrashController.php`:

```php
class TrashController extends Controller
{
    // Display all trashed items for current user
    public function index(Request $request): Response;

    // Restore operations
    public function restoreProject(Request $request, int $id): RedirectResponse;
    public function restoreList(Request $request, int $id): RedirectResponse;
    public function restoreTask(Request $request, int $id): RedirectResponse;

    // Permanent delete operations
    public function forceDeleteProject(Request $request, int $id): RedirectResponse;
    public function forceDeleteList(Request $request, int $id): RedirectResponse;
    public function forceDeleteTask(Request $request, int $id): RedirectResponse;

    // Empty all trash
    public function emptyTrash(Request $request): RedirectResponse;
}
```

#### Policy Classes

##### ProjectPolicy

```php
public function restore(User $user, Project $project): bool
{
    return $user->id === $project->user_id;
}

public function forceDelete(User $user, Project $project): bool
{
    return $user->id === $project->user_id;
}
```

##### TaskListPolicy

```php
public function restore(User $user, TaskList $taskList, Project $project): bool
{
    return $project->canDelete($user)
        && $taskList->project_id === $project->id;
}

public function forceDelete(User $user, TaskList $taskList, Project $project): bool
{
    return $user->id === $project->user_id
        && $taskList->project_id === $project->id;
}
```

##### TaskPolicy

```php
public function restore(User $user, Task $task, Project $project): bool
{
    return $project->canDelete($user)
        && $task->project_id === $project->id;
}

public function forceDelete(User $user, Task $task, Project $project): bool
{
    return $user->id === $project->user_id
        && $task->project_id === $project->id;
}
```

### Frontend

#### TypeScript Types

Located at `resources/js/types/trash.d.ts`:

```typescript
// Item types
export type TrashItemType = 'project' | 'list' | 'task';
export type TrashFilterType = 'all' | 'project' | 'list' | 'task';
export type TrashSortBy = 'recent' | 'type' | 'remaining' | 'expiring';

// Base interface
export interface BaseTrashedItem {
    id: number;
    deleted_at: string;
    days_remaining: number;
}

// Trashed Project
export interface TrashedProject extends BaseTrashedItem {
    type: 'project';
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
    lists_count: number;
    tasks_count: number;
}

// Trashed List
export interface TrashedList extends BaseTrashedItem {
    type: 'list';
    name: string;
    project_id: number;
    project_name: string;
    project_color: string;
    tasks_count: number;
    expires_at: string;
}

// Trashed Task
export interface TrashedTask extends BaseTrashedItem {
    type: 'task';
    title: string;
    description: string | null;
    priority: 'low' | 'medium' | 'high' | 'critical';
    due_date: string | null;
    project_id: number;
    project_name: string;
    list_id: number;
    list_name: string;
    expires_at: string;
}
```

#### UI Components

| Component                 | Purpose                                |
| ------------------------- | -------------------------------------- |
| `trash-filters.tsx`       | Filter by type, search, sort controls  |
| `trash-item-card.tsx`     | Display individual trashed item        |
| `trash-empty-state.tsx`   | Empty state when no trashed items      |
| `empty-trash-dialog.tsx`  | Confirmation dialog for emptying trash |
| `project-trash-sheet.tsx` | Per-project trash sheet (in sidebar)   |

## Trash Data Response

### Trashed Project

```json
{
    "id": 1,
    "type": "project",
    "name": "Website Redesign",
    "description": "Complete website overhaul",
    "color": "#3B82F6",
    "icon": "folder",
    "deleted_at": "2025-12-20T10:00:00Z",
    "deleted_at_human": "2 hours ago",
    "expires_at": "2025-12-27T10:00:00Z",
    "expires_at_human": "in 7 days",
    "lists_count": 3,
    "tasks_count": 15
}
```

### Trashed List

```json
{
    "id": 5,
    "type": "list",
    "name": "To Do",
    "project": {
        "id": 1,
        "name": "Website Redesign",
        "color": "#3B82F6"
    },
    "deleted_at": "2025-12-20T10:00:00Z",
    "deleted_at_human": "2 hours ago",
    "expires_at": "2025-12-27T10:00:00Z",
    "expires_at_human": "in 7 days",
    "tasks_count": 5
}
```

### Trashed Task

```json
{
    "id": 42,
    "type": "task",
    "title": "Design homepage",
    "description": "Create mockup for homepage",
    "priority": "high",
    "due_date": "2025-12-25",
    "project": {
        "id": 1,
        "name": "Website Redesign",
        "color": "#3B82F6"
    },
    "list": {
        "id": 5,
        "name": "To Do"
    },
    "assignee": {
        "id": 2,
        "name": "John Doe",
        "avatar": "https://..."
    },
    "deleted_at": "2025-12-20T10:00:00Z",
    "deleted_at_human": "2 hours ago",
    "expires_at": "2025-12-27T10:00:00Z",
    "expires_at_human": "in 7 days"
}
```

## UI Features

### Trash Page

- **Filter Buttons**: All / Projects / Lists / Tasks
- **Search**: Search by name/title
- **Sort Options**: Most Recent, By Type, Time Remaining
- **Actions**: Restore, Permanently Delete per item
- **Bulk Action**: Empty All Trash button
- **Animations**: Smooth entrance/exit animations using Framer Motion

### Per-Project Trash (Sidebar)

- **Sheet Component**: Slide-out panel showing trashed items from specific project
- **Quick Access**: Available from project sidebar
- **Filtered View**: Only shows lists/tasks from that project

### Item Display

Each trashed item shows:

- Type icon with color coding
- Name/title
- Parent info (project/list name)
- Time since deletion
- Expiration countdown
- Action buttons (Restore / Delete)

## Cascade Behavior

### Deleting a Project

```
Project (soft deleted)
├── List 1 (soft deleted)
│   ├── Task 1 (soft deleted)
│   └── Task 2 (soft deleted)
└── List 2 (soft deleted)
    └── Task 3 (soft deleted)
```

### Restoring a Project

When a project is restored, all its children are also restored automatically.

### Orphan Prevention

When viewing trash:

- **Lists**: Only shown if their parent project is NOT deleted
- **Tasks**: Only shown if their parent project AND list are NOT deleted

This prevents showing orphaned items that would have no parent to restore to.

## Automatic Cleanup

### Cleanup Command

```bash
php artisan trash:cleanup
```

This command should be scheduled to run daily:

```php
// routes/console.php or app/Console/Kernel.php
Schedule::command('trash:cleanup')->daily();
```

### Cleanup Logic

```php
// Delete items older than retention period
$cutoff = now()->subDays(config('trash.retention_days'));

foreach (config('trash.models') as $model) {
    $model::onlyTrashed()
        ->where('deleted_at', '<', $cutoff)
        ->forceDelete();
}
```

## Routes

| Method   | URI                            | Action               |
| -------- | ------------------------------ | -------------------- |
| `GET`    | `/trash`                       | `index`              |
| `POST`   | `/trash/projects/{id}/restore` | `restoreProject`     |
| `DELETE` | `/trash/projects/{id}`         | `forceDeleteProject` |
| `POST`   | `/trash/lists/{id}/restore`    | `restoreList`        |
| `DELETE` | `/trash/lists/{id}`            | `forceDeleteList`    |
| `POST`   | `/trash/tasks/{id}/restore`    | `restoreTask`        |
| `DELETE` | `/trash/tasks/{id}`            | `forceDeleteTask`    |
| `DELETE` | `/trash/empty`                 | `emptyTrash`         |

## Testing

Trash system tests can be run with:

```bash
php artisan test tests/Feature/TrashTest.php
```

The test suite covers:

- Soft delete operations for all item types
- Cascade soft deletes
- Restore operations
- Permanent delete operations
- Empty trash functionality
- Permission enforcement
- Orphan item filtering

## Security Notes

1. **Backend Enforcement**: All permissions are enforced server-side through Laravel Policies
2. **Owner-Only Access**: Only project owners can access trash for their projects
3. **Cascade Safety**: Restoring an item checks that its parent exists and is not deleted
4. **Gate Authorization**: All trash operations use `Gate::authorize()` before execution
5. **Orphan Protection**: Orphaned items (deleted parent) are not shown in trash UI

## Environment Variables

| Variable               | Default | Description                         |
| ---------------------- | ------- | ----------------------------------- |
| `TRASH_RETENTION_DAYS` | `7`     | Days before auto-permanent deletion |
