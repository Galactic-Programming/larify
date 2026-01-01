# 🔔 Due Date Reminders

## Tổng quan

Gửi thông báo nhắc nhở cho users trước khi task đến hạn.

| Attribute        | Value                            |
| ---------------- | -------------------------------- |
| **Priority**     | 🟢 High                          |
| **Effort**       | 🟢 Low (1-2 days)                |
| **Plan**         | Pro Only                         |
| **Dependencies** | Notifications system (✅ có sẵn) |

---

## 📋 Requirements

### Functional Requirements

1. **Reminder Timing Options**
    - 15 phút trước
    - 1 giờ trước
    - 1 ngày trước
    - Tuỳ chỉnh (Pro)

2. **Notification Channels**
    - In-app notification (real-time via Reverb)
    - Email notification (optional, user setting)

3. **User Preferences**
    - Enable/disable reminders
    - Chọn default reminder time
    - Override per-task

### Non-Functional Requirements

- Scalable: Handle thousands of reminders
- Reliable: Không miss reminder nào
- Performant: Không ảnh hưởng app performance

---

## 🗃️ Database Schema

### Option 1: Add column to tasks table (Simple)

```php
// Migration: add_reminder_at_to_tasks_table.php
Schema::table('tasks', function (Blueprint $table) {
    $table->timestamp('reminder_at')->nullable()->after('due_time');
    $table->boolean('reminder_sent')->default(false)->after('reminder_at');

    $table->index(['reminder_at', 'reminder_sent']); // For scheduler query
});
```

### Option 2: Separate reminders table (Flexible - Recommended)

```php
// Migration: create_task_reminders_table.php
Schema::create('task_reminders', function (Blueprint $table) {
    $table->id();
    $table->foreignId('task_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->timestamp('remind_at');
    $table->boolean('is_sent')->default(false);
    $table->timestamp('sent_at')->nullable();
    $table->timestamps();

    $table->unique(['task_id', 'user_id', 'remind_at']);
    $table->index(['remind_at', 'is_sent']); // For scheduler
});
```

### User Preferences

```php
// Migration: add_reminder_settings_to_users_table.php
Schema::table('users', function (Blueprint $table) {
    $table->json('notification_preferences')->nullable()->after('plan');
});

// Structure:
// {
//     "due_date_reminders": {
//         "enabled": true,
//         "default_minutes_before": 60,
//         "email_enabled": false
//     }
// }
```

---

## 🏗️ Implementation

### Step 1: Update UserPlan.php

```php
// app/Enums/UserPlan.php
// Method đã có sẵn, chỉ cần verify:
public function canUseDueDateReminders(): bool
{
    return $this === self::Pro;
}
```

### Step 2: Create Model

```php
// app/Models/TaskReminder.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskReminder extends Model
{
    protected $fillable = [
        'task_id',
        'user_id',
        'remind_at',
        'is_sent',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'remind_at' => 'datetime',
            'is_sent' => 'boolean',
            'sent_at' => 'datetime',
        ];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for pending reminders that should be sent.
     */
    public function scopePending($query)
    {
        return $query->where('is_sent', false)
            ->where('remind_at', '<=', now());
    }
}
```

### Step 3: Create Notification

```php
// app/Notifications/TaskDueDateReminderNotification.php
<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskDueDateReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Task $task,
        public string $timeUntilDue
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database', 'broadcast'];

        // Check user preferences for email
        $prefs = $notifiable->notification_preferences ?? [];
        if ($prefs['due_date_reminders']['email_enabled'] ?? false) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'task_due_reminder',
            'task_id' => $this->task->id,
            'task_title' => $this->task->title,
            'project_id' => $this->task->project_id,
            'project_name' => $this->task->project?->name,
            'due_date' => $this->task->due_date?->format('Y-m-d'),
            'due_time' => $this->task->due_time,
            'time_until_due' => $this->timeUntilDue,
            'message' => "Task \"{$this->task->title}\" is due {$this->timeUntilDue}",
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Reminder: {$this->task->title} is due {$this->timeUntilDue}")
            ->greeting("Hi {$notifiable->name}!")
            ->line("This is a reminder that your task is due {$this->timeUntilDue}.")
            ->line("**Task:** {$this->task->title}")
            ->line("**Project:** {$this->task->project?->name}")
            ->line("**Due:** {$this->task->due_date?->format('M d, Y')} {$this->task->due_time}")
            ->action('View Task', url("/projects/{$this->task->project_id}"))
            ->line('Good luck!');
    }
}
```

### Step 4: Create Scheduled Command

```php
// app/Console/Commands/SendDueDateReminders.php
<?php

namespace App\Console\Commands;

use App\Models\TaskReminder;
use App\Notifications\TaskDueDateReminderNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendDueDateReminders extends Command
{
    protected $signature = 'reminders:send';
    protected $description = 'Send due date reminders for tasks';

    public function handle(): int
    {
        $reminders = TaskReminder::pending()
            ->with(['task.project', 'user'])
            ->limit(100) // Process in batches
            ->get();

        $sent = 0;

        foreach ($reminders as $reminder) {
            // Skip if user no longer has Pro plan
            if (!$reminder->user->plan?->canUseDueDateReminders()) {
                $reminder->update(['is_sent' => true]); // Mark as processed
                continue;
            }

            // Skip if task is completed or deleted
            if ($reminder->task->completed_at || $reminder->task->deleted_at) {
                $reminder->update(['is_sent' => true]);
                continue;
            }

            // Calculate time until due
            $timeUntilDue = $this->formatTimeUntilDue($reminder->task);

            // Send notification
            $reminder->user->notify(
                new TaskDueDateReminderNotification($reminder->task, $timeUntilDue)
            );

            // Mark as sent
            $reminder->update([
                'is_sent' => true,
                'sent_at' => now(),
            ]);

            $sent++;
        }

        $this->info("Sent {$sent} reminders.");

        return Command::SUCCESS;
    }

    private function formatTimeUntilDue(Task $task): string
    {
        $dueAt = $task->due_date;
        if ($task->due_time) {
            $dueAt = $dueAt->setTimeFromTimeString($task->due_time);
        }

        $diff = now()->diff($dueAt);

        if ($diff->days > 0) {
            return "in {$diff->days} day(s)";
        }
        if ($diff->h > 0) {
            return "in {$diff->h} hour(s)";
        }
        return "in {$diff->i} minute(s)";
    }
}
```

### Step 5: Register Scheduler

```php
// bootstrap/app.php hoặc routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('reminders:send')->everyMinute();
```

### Step 6: Auto-create Reminders

```php
// app/Observers/TaskObserver.php
<?php

namespace App\Observers;

use App\Models\Task;
use App\Models\TaskReminder;

class TaskObserver
{
    public function created(Task $task): void
    {
        $this->createReminder($task);
    }

    public function updated(Task $task): void
    {
        // If due_date changed, update reminder
        if ($task->isDirty('due_date') || $task->isDirty('due_time')) {
            // Delete old reminders
            $task->reminders()->where('is_sent', false)->delete();

            // Create new one
            $this->createReminder($task);
        }
    }

    private function createReminder(Task $task): void
    {
        // Only for tasks with due dates and assigned users
        if (!$task->due_date || !$task->assigned_to) {
            return;
        }

        $assignee = $task->assignee;

        // Check if user has Pro plan
        if (!$assignee?->plan?->canUseDueDateReminders()) {
            return;
        }

        // Get user's default reminder time (or 1 hour)
        $prefs = $assignee->notification_preferences ?? [];
        $minutesBefore = $prefs['due_date_reminders']['default_minutes_before'] ?? 60;

        $dueAt = $task->due_date;
        if ($task->due_time) {
            $dueAt = $dueAt->setTimeFromTimeString($task->due_time);
        }

        $remindAt = $dueAt->subMinutes($minutesBefore);

        // Don't create reminder if it's in the past
        if ($remindAt->isPast()) {
            return;
        }

        TaskReminder::create([
            'task_id' => $task->id,
            'user_id' => $assignee->id,
            'remind_at' => $remindAt,
        ]);
    }
}
```

---

## 🎨 Frontend Implementation

### Update Task Form

```tsx
// resources/js/pages/projects/lists/tasks/components/edit-task-dialog.tsx

// Add reminder field (only show for Pro users)
import { usePlanFeatures } from '@/hooks/use-plan-limits';

function EditTaskDialog({ task, ...props }) {
    const { canUseDueDateReminders } = usePlanFeatures();

    return (
        <Dialog>
            {/* ... existing fields ... */}

            {canUseDueDateReminders && task.due_date && (
                <div className="space-y-2">
                    <Label>Reminder</Label>
                    <Select
                        value={data.reminder_minutes}
                        onValueChange={(v) => setData('reminder_minutes', v)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Set reminder" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="15">
                                15 minutes before
                            </SelectItem>
                            <SelectItem value="60">1 hour before</SelectItem>
                            <SelectItem value="1440">1 day before</SelectItem>
                            <SelectItem value="0">No reminder</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {!canUseDueDateReminders && (
                <FeatureGate feature="can_use_due_date_reminders">
                    <p className="text-muted-foreground text-sm">
                        Upgrade to Pro to get due date reminders
                    </p>
                </FeatureGate>
            )}
        </Dialog>
    );
}
```

### Notification Display

```tsx
// Update resources/js/pages/notifications/components/notification-item.tsx
// Thêm icon và styling cho reminder notification

{
    notification.data.type === 'task_due_reminder' && (
        <div className="flex items-center gap-2">
            <ClockIcon className="text-warning size-4" />
            <span>{notification.data.message}</span>
        </div>
    );
}
```

---

## 🧪 Testing

```php
// tests/Feature/DueDateReminderTest.php
<?php

use App\Enums\UserPlan;
use App\Models\Task;
use App\Models\TaskReminder;
use App\Models\User;
use App\Notifications\TaskDueDateReminderNotification;
use Illuminate\Support\Facades\Notification;

it('creates reminder when task is assigned to Pro user', function () {
    $user = User::factory()->create(['plan' => UserPlan::Pro]);
    $task = Task::factory()->create([
        'assigned_to' => $user->id,
        'due_date' => now()->addDay(),
    ]);

    expect(TaskReminder::where('task_id', $task->id)->exists())->toBeTrue();
});

it('does not create reminder for Free users', function () {
    $user = User::factory()->create(['plan' => UserPlan::Free]);
    $task = Task::factory()->create([
        'assigned_to' => $user->id,
        'due_date' => now()->addDay(),
    ]);

    expect(TaskReminder::where('task_id', $task->id)->exists())->toBeFalse();
});

it('sends notification when reminder is due', function () {
    Notification::fake();

    $user = User::factory()->create(['plan' => UserPlan::Pro]);
    $task = Task::factory()->create([
        'assigned_to' => $user->id,
        'due_date' => now()->addHour(),
    ]);

    TaskReminder::create([
        'task_id' => $task->id,
        'user_id' => $user->id,
        'remind_at' => now()->subMinute(), // Already due
    ]);

    $this->artisan('reminders:send');

    Notification::assertSentTo($user, TaskDueDateReminderNotification::class);
});

it('does not send reminder for completed tasks', function () {
    Notification::fake();

    $user = User::factory()->create(['plan' => UserPlan::Pro]);
    $task = Task::factory()->create([
        'assigned_to' => $user->id,
        'due_date' => now()->addHour(),
        'completed_at' => now(),
    ]);

    TaskReminder::create([
        'task_id' => $task->id,
        'user_id' => $user->id,
        'remind_at' => now()->subMinute(),
    ]);

    $this->artisan('reminders:send');

    Notification::assertNotSentTo($user, TaskDueDateReminderNotification::class);
});
```

---

## ✅ Checklist

- [ ] Create migration for `task_reminders` table
- [ ] Add `notification_preferences` to users table
- [ ] Create `TaskReminder` model
- [ ] Create `TaskDueDateReminderNotification`
- [ ] Create `SendDueDateReminders` command
- [ ] Register scheduler
- [ ] Create `TaskObserver` for auto-creating reminders
- [ ] Register observer in `AppServiceProvider`
- [ ] Update task edit form (frontend)
- [ ] Update notification display (frontend)
- [ ] Write tests
- [ ] Update documentation

---

## 📚 References

- [Laravel Notifications](https://laravel.com/docs/notifications)
- [Laravel Scheduling](https://laravel.com/docs/scheduling)
- [Laravel Broadcasting](https://laravel.com/docs/broadcasting)
