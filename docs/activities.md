# Activity Feed System

This document describes the activity feed system implemented in Larify for tracking and displaying project events.

## Overview

Larify uses an activity logging system to record all significant actions within projects. The activity feed provides a chronological history of what happened, who did it, and when.

| Aspect      | Description                                                  |
| ----------- | ------------------------------------------------------------ |
| **Purpose** | Track project history and provide audit trail                |
| **Scope**   | Per-project - activities belong to specific projects         |
| **Storage** | Database table with polymorphic relationships                |
| **Display** | Activities tab in Notifications page + Project activity feed |

## Activity Types

### Task Activities

| Type             | Label            | Icon           | Description                      |
| ---------------- | ---------------- | -------------- | -------------------------------- |
| `task.created`   | created a task   | `plus-circle`  | A new task was created           |
| `task.updated`   | updated a task   | `pencil`       | A task was modified              |
| `task.completed` | completed a task | `check-circle` | A task was marked as complete    |
| `task.reopened`  | reopened a task  | `rotate-ccw`   | A completed task was reopened    |
| `task.deleted`   | deleted a task   | `trash`        | A task was deleted               |
| `task.assigned`  | assigned a task  | `user-plus`    | A task was assigned to someone   |
| `task.moved`     | moved a task     | `move`         | A task was moved to another list |

### List Activities

| Type             | Label           | Icon            | Description            |
| ---------------- | --------------- | --------------- | ---------------------- |
| `list.created`   | created a list  | `list-plus`     | A new list was created |
| `list.updated`   | updated a list  | `list`          | A list was modified    |
| `list.deleted`   | deleted a list  | `list-x`        | A list was deleted     |
| `list.reordered` | reordered lists | `arrow-up-down` | Lists were reordered   |

### Project Activities

| Type               | Label                | Icon              | Description                    |
| ------------------ | -------------------- | ----------------- | ------------------------------ |
| `project.created`  | created the project  | `folder-plus`     | A new project was created      |
| `project.updated`  | updated the project  | `folder-edit`     | Project settings were modified |
| `project.archived` | archived the project | `archive`         | A project was archived         |
| `project.restored` | restored the project | `archive-restore` | A project was unarchived       |

### Member Activities

| Type                  | Label               | Icon         | Description                       |
| --------------------- | ------------------- | ------------ | --------------------------------- |
| `member.added`        | added a member      | `user-plus`  | A new member was added to project |
| `member.removed`      | removed a member    | `user-minus` | A member was removed from project |
| `member.role_changed` | changed member role | `shield`     | A member's role was changed       |

## Implementation Details

### Backend

#### ActivityType Enum

Located at `app/Enums/ActivityType.php`:

```php
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

    public function label(): string
    {
        return match ($this) {
            self::TaskCreated => 'created a task',
            self::TaskCompleted => 'completed a task',
            // ... other labels
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::TaskCreated => 'plus-circle',
            self::TaskCompleted => 'check-circle',
            // ... other icons
        };
    }
}
```

#### Activity Model

Located at `app/Models/Activity.php`:

```php
class Activity extends Model
{
    protected $fillable = [
        'user_id',
        'project_id',
        'subject_type',
        'subject_id',
        'type',
        'description',
        'properties',
    ];

    protected function casts(): array
    {
        return [
            'type' => ActivityType::class,
            'properties' => 'array',
        ];
    }

    // Relationships
    public function user(): BelongsTo;      // Who performed the action
    public function project(): BelongsTo;   // Which project
    public function subject(): MorphTo;     // The subject (Task, List, etc.)

    // Static helper to log activities
    public static function log(
        ActivityType $type,
        ?Model $subject = null,
        ?Project $project = null,
        ?User $user = null,
        ?string $description = null,
        array $properties = []
    ): self;

    // Scopes
    public function scopeForProject($query, Project $project);
    public function scopeByUser($query, User $user);
    public function scopeOfType($query, ActivityType $type);
}
```

#### Database Schema

Located at `database/migrations/0001_01_01_000012_create_activities_table.php`:

```php
Schema::create('activities', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('project_id')->nullable()->constrained()->cascadeOnDelete();
    $table->nullableMorphs('subject'); // subject_type + subject_id
    $table->string('type');
    $table->string('description')->nullable();
    $table->json('properties')->nullable();
    $table->timestamps();

    // Indexes
    $table->index('type');
    $table->index(['project_id', 'created_at']);
    $table->index(['user_id', 'created_at']);
});
```

#### Controller

Located at `app/Http/Controllers/Activities/ActivityController.php`:

```php
class ActivityController extends Controller
{
    // Display activity feed page
    public function index(Request $request): Response;

    // Get activities for a specific project
    public function forProject(Request $request, Project $project): JsonResponse;

    // Get activities list for API/AJAX
    public function list(Request $request): JsonResponse;
}
```

### Frontend

#### TypeScript Interfaces

Located at `resources/js/types/notifications.d.ts`:

```typescript
export interface ActivityUser {
    id: number;
    name: string;
    avatar?: string;
}

export interface ActivityProject {
    id: number;
    name: string;
    color: string;
    icon?: string;
}

export interface Activity {
    id: number;
    type: string;
    type_label: string;
    type_icon: string;
    description: string;
    properties: Record<string, unknown> | null;
    user: ActivityUser | null;
    project: ActivityProject | null;
    subject_type: string | null;
    subject_id: number | null;
    created_at: string;
    created_at_human: string;
}
```

#### Component Usage

```tsx
// Activity icon mapping
const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
    'task.created': <PlusCircle className="size-4 text-green-500" />,
    'task.updated': <Pencil className="size-4 text-blue-500" />,
    'task.completed': <CheckCircle className="size-4 text-green-500" />,
    'task.reopened': <RotateCcw className="size-4 text-yellow-500" />,
    'task.deleted': <Trash className="size-4 text-red-500" />,
    'task.assigned': <UserPlus className="size-4 text-blue-500" />,
    'task.moved': <Move className="size-4 text-purple-500" />,
    'project.created': <FolderPlus className="size-4 text-green-500" />,
    'project.updated': <FolderEdit className="size-4 text-blue-500" />,
    'project.archived': <Archive className="size-4 text-orange-500" />,
    'project.restored': <ArchiveRestore className="size-4 text-green-500" />,
    'member.added': <UserPlus className="size-4 text-green-500" />,
    'member.removed': <UserMinus className="size-4 text-red-500" />,
    'member.role_changed': <Shield className="size-4 text-indigo-500" />,
    'list.created': <ListPlus className="size-4 text-green-500" />,
    'list.updated': <List className="size-4 text-blue-500" />,
    'list.deleted': <Trash className="size-4 text-red-500" />,
    'list.reordered': <Move className="size-4 text-purple-500" />,
};
```

## Logging Activities

### Example: Logging Task Creation

```php
use App\Enums\ActivityType;
use App\Models\Activity;

// When creating a task
Activity::log(
    type: ActivityType::TaskCreated,
    subject: $task,
    project: $task->project,
    user: auth()->user(),
    description: "Created task \"{$task->title}\""
);
```

### Example: Logging Task Completion

```php
Activity::log(
    type: ActivityType::TaskCompleted,
    subject: $task,
    project: $task->project,
    user: auth()->user(),
    description: "Completed task \"{$task->title}\"",
    properties: [
        'completed_at' => now()->toISOString(),
    ]
);
```

### Example: Logging Member Role Change

```php
Activity::log(
    type: ActivityType::MemberRoleChanged,
    subject: $user,
    project: $project,
    user: auth()->user(),
    description: "Changed {$user->name}'s role from {$oldRole->label()} to {$newRole->label()}",
    properties: [
        'old_role' => $oldRole->value,
        'new_role' => $newRole->value,
    ]
);
```

## Activity vs Notification

| Aspect          | Activity                        | Notification                   |
| --------------- | ------------------------------- | ------------------------------ |
| **Purpose**     | Historical record / Audit trail | Alert user of important events |
| **Audience**    | All project members             | Specific user                  |
| **Persistence** | Permanent (unless deleted)      | Can be deleted by user         |
| **Read Status** | No read/unread concept          | Has read/unread status         |
| **Channels**    | Database only                   | Database, Email, Broadcast     |
| **User Action** | No action required              | May require user attention     |

## UI Features

### Activities Tab (Notifications Page)

- **Timeline View**: Chronological list with animated timeline indicators
- **Avatar Display**: Shows who performed each action
- **Project Badge**: Links to the related project
- **Time Display**: Human-readable timestamps (e.g., "2 hours ago")
- **Animations**: Smooth entrance animations using Framer Motion

### Activity Item Display

```
[Icon] [Avatar] User Name action label
       Description of the activity
       [Project Badge] · 2 hours ago
```

## Scoping Activities

### User's Activities

Activities are scoped to projects the user has access to:

```php
// Get project IDs user can access
$projectIds = $user->allProjects()->pluck('id');

// Query activities from those projects
$activities = Activity::whereIn('project_id', $projectIds)
    ->with(['user:id,name,avatar', 'project:id,name,color,icon'])
    ->latest()
    ->paginate(30);
```

### Project-specific Activities

```php
$activities = $project->activities()
    ->with(['user:id,name,avatar'])
    ->latest()
    ->paginate(30);
```

## Testing

Activity tests can be run with:

```bash
php artisan test --filter=Activity
```

## Security Notes

1. **Project Access**: Users can only see activities from projects they have access to
2. **Gate Authorization**: Project activity endpoints verify user access via Gate
3. **Polymorphic Safety**: Subject relationships use safe morphTo bindings
4. **Cascade Deletion**: Activities are deleted when their project is deleted
