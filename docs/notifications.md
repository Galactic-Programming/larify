# Notification System

This document describes the notification system implemented in Larify for keeping users informed about important events.

## Overview

Larify uses Laravel's built-in notification system to send alerts to users through multiple channels. Notifications are triggered by significant events and help users stay updated on project activities.

| Channel       | Description                                                    |
| ------------- | -------------------------------------------------------------- |
| **Database**  | Stored in the database for display in the Notifications page   |
| **Mail**      | Email notifications sent to the user's registered email        |
| **Broadcast** | Real-time notifications via WebSocket for instant notification |

## Notification Types

### Task Notifications

| Type             | Description                  | Triggered When                                      |
| ---------------- | ---------------------------- | --------------------------------------------------- |
| `task.assigned`  | Task assignment notification | A user is assigned to a task by another user        |
| `task.completed` | Task completion notification | A task the user created or is assigned to is done   |
| `task.due_soon`  | Upcoming deadline reminder   | A task is due within the configured reminder period |
| `task.overdue`   | Overdue task warning         | A task has passed its due date                      |

### Project Notifications

| Type                 | Description                     | Triggered When                            |
| -------------------- | ------------------------------- | ----------------------------------------- |
| `project.invitation` | Project invitation notification | A user is invited to join a project       |
| `project.removed`    | Removal from project notice     | A user is removed from a project by owner |

### Member Notifications

| Type                  | Description              | Triggered When                        |
| --------------------- | ------------------------ | ------------------------------------- |
| `member.role_changed` | Role change notification | A user's role in a project is changed |

## Implementation Details

### Backend

#### Notification Classes

Located at `app/Notifications/`:

| Class                | Type                  | Purpose                             |
| -------------------- | --------------------- | ----------------------------------- |
| `TaskAssigned`       | `task.assigned`       | Notify user of task assignment      |
| `TaskCompleted`      | `task.completed`      | Notify when task is completed       |
| `TaskDueSoon`        | `task.due_soon`       | Remind user of upcoming deadline    |
| `TaskOverdue`        | `task.overdue`        | Alert user of overdue task          |
| `ProjectInvitation`  | `project.invitation`  | Invite user to project              |
| `RemovedFromProject` | `project.removed`     | Notify user of removal from project |
| `MemberRoleChanged`  | `member.role_changed` | Notify user of role change          |

#### Notification Structure

All notifications implement `ShouldQueue` for asynchronous processing:

```php
class TaskAssigned extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Task $task,
        public User $assignedBy
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail', 'broadcast'];
    }

    public function databaseType(object $notifiable): string
    {
        return 'task.assigned';
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("You've been assigned a task: {$this->task->title}")
            ->greeting("Hello {$notifiable->name}!")
            ->line("{$this->assignedBy->name} assigned you a task...")
            ->action('View Task', url("/projects/{$this->task->project_id}"));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'project_id' => $this->task->project_id,
            'project_name' => $this->task->project->name,
            'assigned_by_name' => $this->assignedBy->name,
            'message' => "{$this->assignedBy->name} assigned you to \"{$this->task->title}\"",
        ];
    }
}
```

#### Controller

Located at `app/Http/Controllers/Notifications/NotificationController.php`:

```php
class NotificationController extends Controller
{
    // Display notifications page
    public function index(Request $request): Response;

    // Get notifications for API/AJAX
    public function list(Request $request): JsonResponse;

    // Mark notification as read
    public function markAsRead(Request $request, DatabaseNotification $notification): JsonResponse;

    // Mark all notifications as read
    public function markAllAsRead(Request $request): JsonResponse;

    // Delete a notification
    public function destroy(Request $request, DatabaseNotification $notification): JsonResponse;
}
```

### Frontend

#### TypeScript Interfaces

Located at `resources/js/types/notifications.d.ts`:

```typescript
export interface NotificationData {
    task_id?: number;
    task_title?: string;
    project_id?: number;
    project_name?: string;
    assigned_by_name?: string;
    assigned_by_avatar?: string;
    message?: string;
    // ... other fields
}

export interface Notification {
    id: string;
    type: string;
    data: NotificationData;
    read_at: string | null;
    is_read: boolean;
    created_at: string;
    created_at_human: string;
}

export type NotificationFilter = 'all' | 'unread' | 'read';
```

#### Component Usage

```tsx
// Notification icon mapping
function getNotificationIcon(type: string) {
    switch (type) {
        case 'task.assigned':
            return <UserPlus className="size-4 text-blue-500" />;
        case 'task.completed':
            return <CheckCircle className="size-4 text-green-500" />;
        case 'task.due_soon':
            return <Clock className="size-4 text-yellow-500" />;
        case 'task.overdue':
            return <AlertTriangle className="size-4 text-red-500" />;
        case 'project.invitation':
            return <FolderPlus className="size-4 text-purple-500" />;
        case 'project.removed':
            return <UserMinus className="size-4 text-orange-500" />;
        case 'member.role_changed':
            return <Shield className="size-4 text-indigo-500" />;
        default:
            return <Bell className="text-muted-foreground size-4" />;
    }
}
```

## Notification Data Payload

### Task Assigned

```json
{
    "task_id": 123,
    "task_title": "Design homepage",
    "project_id": 1,
    "project_name": "Website Redesign",
    "assigned_by_id": 5,
    "assigned_by_name": "John Doe",
    "assigned_by_avatar": "https://...",
    "message": "John Doe assigned you to \"Design homepage\""
}
```

### Task Due Soon

```json
{
    "task_id": 123,
    "task_title": "Design homepage",
    "project_id": 1,
    "project_name": "Website Redesign",
    "due_date": "2025-12-25",
    "time_until_due": "24 hours",
    "reminder_hours": 24,
    "message": "\"Design homepage\" is due in 24 hours"
}
```

### Project Invitation

```json
{
    "project_id": 1,
    "project_name": "Website Redesign",
    "project_color": "#3B82F6",
    "project_icon": "folder",
    "invited_by_name": "Jane Smith",
    "role": "editor",
    "role_label": "Editor",
    "message": "Jane Smith added you to \"Website Redesign\""
}
```

### Member Role Changed

```json
{
    "project_id": 1,
    "project_name": "Website Redesign",
    "changed_by_name": "Jane Smith",
    "old_role": "viewer",
    "old_role_label": "Viewer",
    "new_role": "editor",
    "new_role_label": "Editor",
    "message": "Your role in \"Website Redesign\" changed to Editor"
}
```

## UI Features

### Notification Page

- **Tabs**: Switch between Notifications and Activities
- **Filters**: All / Unread / Read
- **Actions**: Mark as read, Delete individual notifications
- **Bulk Actions**: Mark all as read
- **Click Navigation**: Click notification to navigate to related resource

### Real-time Updates

- Badge count updates instantly via WebSocket broadcast
- New notifications appear without page refresh
- Uses Laravel Reverb for WebSocket connections

## Sending Notifications

### Example: Sending Task Assignment Notification

```php
use App\Notifications\TaskAssigned;

// When assigning a task
$task->assignee->notify(new TaskAssigned($task, auth()->user()));
```

### Example: Sending Project Invitation

```php
use App\Notifications\ProjectInvitation;

// When inviting a user to project
$invitedUser->notify(new ProjectInvitation($project, auth()->user(), $role));
```

## Testing

Notification tests can be run with:

```bash
php artisan test --filter=Notification
```

## Security Notes

1. **Authorization**: Users can only view/modify their own notifications
2. **Validation**: Notification ownership is verified before any action
3. **Queue Processing**: Notifications are processed asynchronously to prevent blocking
4. **Rate Limiting**: Consider implementing rate limiting for notification-heavy operations
