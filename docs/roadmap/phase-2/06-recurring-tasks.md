# 🔄 Recurring Tasks

## Tổng quan

Tự động tạo tasks lặp lại theo lịch trình định sẵn (daily, weekly, monthly).

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | 🟡 Medium            |
| **Effort**       | 🟡 Medium (5-7 days) |
| **Plan**         | Pro Only             |
| **Dependencies** | Task Scheduler       |

---

## 📋 Requirements

### Functional Requirements

1. **Recurrence Patterns**
    - Daily: Every N days
    - Weekly: Specific days of week
    - Monthly: Specific day of month
    - Custom: Cron-like expressions (advanced)

2. **Recurrence Options**
    - End after N occurrences
    - End by specific date
    - Never end (until manually stopped)

3. **Task Generation**
    - Tạo task instance tiếp theo khi task hiện tại được complete
    - Hoặc tạo trước N ngày
    - Copy properties từ parent task

4. **Management**
    - Edit recurrence pattern
    - Skip/Delete single occurrence
    - Stop recurrence
    - View all occurrences

---

## 🗃️ Database Schema

```php
// database/migrations/xxxx_create_task_recurrences_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_recurrences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();

            // Recurrence pattern
            $table->enum('frequency', ['daily', 'weekly', 'monthly', 'custom']);
            $table->unsignedInteger('interval')->default(1); // Every N days/weeks/months
            $table->json('days_of_week')->nullable(); // [0,1,2...] for weekly
            $table->unsignedInteger('day_of_month')->nullable(); // 1-31 for monthly
            $table->string('cron_expression')->nullable(); // For custom

            // End conditions
            $table->enum('end_type', ['never', 'after_occurrences', 'by_date'])->default('never');
            $table->unsignedInteger('max_occurrences')->nullable();
            $table->date('end_date')->nullable();

            // Tracking
            $table->unsignedInteger('occurrences_created')->default(0);
            $table->date('last_created_date')->nullable();
            $table->date('next_occurrence_date')->nullable();
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index('next_occurrence_date');
            $table->index(['is_active', 'next_occurrence_date']);
        });

        // Link recurring instances to their pattern
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('recurrence_id')->nullable()->after('completed_at')->constrained('task_recurrences')->nullOnDelete();
            $table->unsignedInteger('recurrence_index')->nullable()->after('recurrence_id');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('recurrence_id');
            $table->dropColumn('recurrence_index');
        });
        Schema::dropIfExists('task_recurrences');
    }
};
```

---

## 🏗️ Implementation

### Step 1: Update UserPlan.php

```php
// app/Enums/UserPlan.php

/**
 * Check if this plan can create recurring tasks.
 */
public function canCreateRecurringTasks(): bool
{
    return $this === self::Pro;
}
```

### Step 2: Create Models

```php
// app/Models/TaskRecurrence.php
<?php

namespace App\Models;

use App\Enums\RecurrenceFrequency;
use App\Enums\RecurrenceEndType;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TaskRecurrence extends Model
{
    protected $fillable = [
        'task_id',
        'project_id',
        'created_by',
        'frequency',
        'interval',
        'days_of_week',
        'day_of_month',
        'cron_expression',
        'end_type',
        'max_occurrences',
        'end_date',
        'occurrences_created',
        'last_created_date',
        'next_occurrence_date',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'frequency' => RecurrenceFrequency::class,
            'end_type' => RecurrenceEndType::class,
            'days_of_week' => 'array',
            'end_date' => 'date',
            'last_created_date' => 'date',
            'next_occurrence_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function templateTask(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'task_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function instances(): HasMany
    {
        return $this->hasMany(Task::class, 'recurrence_id');
    }

    /**
     * Calculate the next occurrence date.
     */
    public function calculateNextDate(?Carbon $from = null): ?Carbon
    {
        $from = $from ?? ($this->last_created_date ? Carbon::parse($this->last_created_date) : now());

        // Check if recurrence should end
        if (!$this->is_active) return null;

        if ($this->end_type === RecurrenceEndType::AfterOccurrences &&
            $this->occurrences_created >= $this->max_occurrences) {
            return null;
        }

        if ($this->end_type === RecurrenceEndType::ByDate &&
            $this->end_date && $from->greaterThanOrEqualTo($this->end_date)) {
            return null;
        }

        $next = match ($this->frequency) {
            RecurrenceFrequency::Daily => $from->addDays($this->interval),
            RecurrenceFrequency::Weekly => $this->calculateNextWeekly($from),
            RecurrenceFrequency::Monthly => $from->addMonths($this->interval)->day($this->day_of_month ?? 1),
            RecurrenceFrequency::Custom => $this->calculateFromCron($from),
        };

        // Ensure next date doesn't exceed end_date
        if ($this->end_date && $next->greaterThan($this->end_date)) {
            return null;
        }

        return $next;
    }

    private function calculateNextWeekly(Carbon $from): Carbon
    {
        if (empty($this->days_of_week)) {
            return $from->addWeeks($this->interval);
        }

        $daysOfWeek = collect($this->days_of_week)->sort()->values();
        $currentDay = $from->dayOfWeek;

        // Find next day in current week
        $nextDay = $daysOfWeek->first(fn ($day) => $day > $currentDay);

        if ($nextDay !== null) {
            return $from->next($nextDay);
        }

        // Move to first day of next interval week
        return $from->addWeeks($this->interval)->startOfWeek()->addDays($daysOfWeek->first());
    }

    private function calculateFromCron(Carbon $from): Carbon
    {
        // Use cron-expression library for complex patterns
        // For now, fallback to daily
        return $from->addDays($this->interval);
    }

    /**
     * Get human-readable description of recurrence.
     */
    public function getDescriptionAttribute(): string
    {
        $desc = match ($this->frequency) {
            RecurrenceFrequency::Daily => $this->interval === 1
                ? 'Daily'
                : "Every {$this->interval} days",
            RecurrenceFrequency::Weekly => $this->describeWeekly(),
            RecurrenceFrequency::Monthly => $this->interval === 1
                ? "Monthly on day {$this->day_of_month}"
                : "Every {$this->interval} months on day {$this->day_of_month}",
            RecurrenceFrequency::Custom => 'Custom schedule',
        };

        $endDesc = match ($this->end_type) {
            RecurrenceEndType::Never => '',
            RecurrenceEndType::AfterOccurrences => ", {$this->max_occurrences} times",
            RecurrenceEndType::ByDate => ", until {$this->end_date->format('M d, Y')}",
        };

        return $desc . $endDesc;
    }

    private function describeWeekly(): string
    {
        if (empty($this->days_of_week)) {
            return $this->interval === 1 ? 'Weekly' : "Every {$this->interval} weeks";
        }

        $days = collect($this->days_of_week)
            ->map(fn ($d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][$d])
            ->join(', ');

        return "Every {$this->interval} week(s) on {$days}";
    }
}
```

### Step 3: Enums

```php
// app/Enums/RecurrenceFrequency.php
<?php

namespace App\Enums;

enum RecurrenceFrequency: string
{
    case Daily = 'daily';
    case Weekly = 'weekly';
    case Monthly = 'monthly';
    case Custom = 'custom';
}

// app/Enums/RecurrenceEndType.php
<?php

namespace App\Enums;

enum RecurrenceEndType: string
{
    case Never = 'never';
    case AfterOccurrences = 'after_occurrences';
    case ByDate = 'by_date';
}
```

### Step 4: Service Class

```php
// app/Services/RecurrenceService.php
<?php

namespace App\Services;

use App\Models\Task;
use App\Models\TaskRecurrence;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class RecurrenceService
{
    /**
     * Create a new recurrence pattern for a task.
     */
    public function createRecurrence(Task $task, array $data): TaskRecurrence
    {
        return DB::transaction(function () use ($task, $data) {
            $recurrence = TaskRecurrence::create([
                'task_id' => $task->id,
                'project_id' => $task->project_id,
                'created_by' => auth()->id(),
                'frequency' => $data['frequency'],
                'interval' => $data['interval'] ?? 1,
                'days_of_week' => $data['days_of_week'] ?? null,
                'day_of_month' => $data['day_of_month'] ?? null,
                'end_type' => $data['end_type'] ?? 'never',
                'max_occurrences' => $data['max_occurrences'] ?? null,
                'end_date' => $data['end_date'] ?? null,
                'is_active' => true,
                'occurrences_created' => 1, // The template task counts as first
                'last_created_date' => $task->due_date ?? now(),
                'next_occurrence_date' => null,
            ]);

            // Link template task
            $task->update([
                'recurrence_id' => $recurrence->id,
                'recurrence_index' => 1,
            ]);

            // Calculate and set next occurrence
            $nextDate = $recurrence->calculateNextDate();
            $recurrence->update(['next_occurrence_date' => $nextDate]);

            return $recurrence;
        });
    }

    /**
     * Generate next task instance.
     */
    public function generateNextInstance(TaskRecurrence $recurrence): ?Task
    {
        if (!$recurrence->is_active || !$recurrence->next_occurrence_date) {
            return null;
        }

        $templateTask = $recurrence->templateTask;
        if (!$templateTask) {
            $recurrence->update(['is_active' => false]);
            return null;
        }

        return DB::transaction(function () use ($recurrence, $templateTask) {
            // Create new task instance
            $newTask = $templateTask->replicate(['completed_at', 'deleted_at']);
            $newTask->due_date = $recurrence->next_occurrence_date;
            $newTask->recurrence_id = $recurrence->id;
            $newTask->recurrence_index = $recurrence->occurrences_created + 1;
            $newTask->save();

            // Copy labels if any
            if ($templateTask->labels) {
                $newTask->labels()->sync($templateTask->labels->pluck('id'));
            }

            // Update recurrence tracking
            $recurrence->occurrences_created++;
            $recurrence->last_created_date = $recurrence->next_occurrence_date;
            $recurrence->next_occurrence_date = $recurrence->calculateNextDate();

            // Deactivate if no more occurrences
            if (!$recurrence->next_occurrence_date) {
                $recurrence->is_active = false;
            }

            $recurrence->save();

            return $newTask;
        });
    }

    /**
     * Process all due recurrences.
     */
    public function processDueRecurrences(): int
    {
        $count = 0;

        $dueRecurrences = TaskRecurrence::where('is_active', true)
            ->whereNotNull('next_occurrence_date')
            ->where('next_occurrence_date', '<=', now())
            ->with('templateTask')
            ->get();

        foreach ($dueRecurrences as $recurrence) {
            if ($this->generateNextInstance($recurrence)) {
                $count++;
            }
        }

        return $count;
    }
}
```

### Step 5: Scheduled Command

```php
// app/Console/Commands/ProcessRecurringTasks.php
<?php

namespace App\Console\Commands;

use App\Services\RecurrenceService;
use Illuminate\Console\Command;

class ProcessRecurringTasks extends Command
{
    protected $signature = 'tasks:process-recurring';
    protected $description = 'Generate task instances for due recurrences';

    public function handle(RecurrenceService $service): int
    {
        $count = $service->processDueRecurrences();

        $this->info("Generated {$count} recurring task(s).");

        return Command::SUCCESS;
    }
}

// Register in scheduler
// routes/console.php or bootstrap/app.php
Schedule::command('tasks:process-recurring')->hourly();
```

### Step 6: Controller

```php
// app/Http/Controllers/Tasks/RecurrenceController.php
<?php

namespace App\Http\Controllers\Tasks;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskRecurrence;
use App\Services\RecurrenceService;
use Illuminate\Http\Request;

class RecurrenceController extends Controller
{
    public function __construct(
        private RecurrenceService $recurrenceService
    ) {}

    public function store(Request $request, Project $project, Task $task)
    {
        $this->authorize('update', $project);
        abort_if($task->project_id !== $project->id, 404);

        // Check Pro plan
        if (!$request->user()->plan?->canCreateRecurringTasks()) {
            return response()->json([
                'message' => 'Recurring tasks require a Pro plan.',
            ], 403);
        }

        // Can't add recurrence to a task that's already recurring
        if ($task->recurrence_id) {
            return response()->json([
                'message' => 'Task already has a recurrence pattern.',
            ], 422);
        }

        $validated = $request->validate([
            'frequency' => ['required', 'in:daily,weekly,monthly,custom'],
            'interval' => ['integer', 'min:1', 'max:365'],
            'days_of_week' => ['array'],
            'days_of_week.*' => ['integer', 'min:0', 'max:6'],
            'day_of_month' => ['integer', 'min:1', 'max:31'],
            'end_type' => ['in:never,after_occurrences,by_date'],
            'max_occurrences' => ['required_if:end_type,after_occurrences', 'integer', 'min:1', 'max:365'],
            'end_date' => ['required_if:end_type,by_date', 'date', 'after:today'],
        ]);

        $recurrence = $this->recurrenceService->createRecurrence($task, $validated);

        return response()->json([
            'recurrence' => $recurrence,
            'message' => 'Recurrence created successfully.',
        ], 201);
    }

    public function update(Request $request, TaskRecurrence $recurrence)
    {
        $this->authorize('update', $recurrence->project);

        $validated = $request->validate([
            'frequency' => ['in:daily,weekly,monthly,custom'],
            'interval' => ['integer', 'min:1', 'max:365'],
            'days_of_week' => ['array'],
            'day_of_month' => ['integer', 'min:1', 'max:31'],
            'end_type' => ['in:never,after_occurrences,by_date'],
            'max_occurrences' => ['integer', 'min:1', 'max:365'],
            'end_date' => ['date', 'after:today'],
        ]);

        $recurrence->update($validated);

        // Recalculate next occurrence
        $recurrence->update([
            'next_occurrence_date' => $recurrence->calculateNextDate(),
        ]);

        return response()->json(['recurrence' => $recurrence->fresh()]);
    }

    public function destroy(TaskRecurrence $recurrence)
    {
        $this->authorize('update', $recurrence->project);

        // Deactivate instead of delete to preserve history
        $recurrence->update(['is_active' => false]);

        return response()->json(['message' => 'Recurrence stopped.']);
    }
}
```

---

## 🎨 Frontend Implementation

### Recurrence Dialog

```tsx
// resources/js/components/tasks/recurrence-dialog.tsx
import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, RepeatIcon } from 'lucide-react';

interface RecurrenceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: number;
    taskId: number;
    onSuccess: () => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function RecurrenceDialog({
    open,
    onOpenChange,
    projectId,
    taskId,
    onSuccess,
}: RecurrenceDialogProps) {
    const { data, setData, post, processing, errors } = useForm({
        frequency: 'weekly',
        interval: 1,
        days_of_week: [] as number[],
        day_of_month: 1,
        end_type: 'never',
        max_occurrences: 10,
        end_date: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/projects/${projectId}/tasks/${taskId}/recurrence`, {
            onSuccess: () => {
                onOpenChange(false);
                onSuccess();
            },
        });
    };

    const toggleDayOfWeek = (day: number) => {
        setData(
            'days_of_week',
            data.days_of_week.includes(day)
                ? data.days_of_week.filter((d) => d !== day)
                : [...data.days_of_week, day],
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RepeatIcon className="size-5" />
                        Set Up Recurring Task
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Frequency */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Repeat every</Label>
                            <Input
                                type="number"
                                min={1}
                                max={365}
                                value={data.interval}
                                onChange={(e) =>
                                    setData(
                                        'interval',
                                        parseInt(e.target.value),
                                    )
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Frequency</Label>
                            <Select
                                value={data.frequency}
                                onValueChange={(v) => setData('frequency', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">
                                        Day(s)
                                    </SelectItem>
                                    <SelectItem value="weekly">
                                        Week(s)
                                    </SelectItem>
                                    <SelectItem value="monthly">
                                        Month(s)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Weekly options */}
                    {data.frequency === 'weekly' && (
                        <div className="space-y-2">
                            <Label>On these days</Label>
                            <div className="flex gap-1">
                                {DAYS_OF_WEEK.map((day, index) => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDayOfWeek(index)}
                                        className={cn(
                                            'size-9 rounded-full text-xs font-medium transition-colors',
                                            data.days_of_week.includes(index)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted hover:bg-muted/80',
                                        )}
                                    >
                                        {day[0]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Monthly options */}
                    {data.frequency === 'monthly' && (
                        <div className="space-y-2">
                            <Label>On day</Label>
                            <Input
                                type="number"
                                min={1}
                                max={31}
                                value={data.day_of_month}
                                onChange={(e) =>
                                    setData(
                                        'day_of_month',
                                        parseInt(e.target.value),
                                    )
                                }
                            />
                        </div>
                    )}

                    {/* End options */}
                    <div className="space-y-2">
                        <Label>Ends</Label>
                        <Select
                            value={data.end_type}
                            onValueChange={(v) => setData('end_type', v)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="never">Never</SelectItem>
                                <SelectItem value="after_occurrences">
                                    After # occurrences
                                </SelectItem>
                                <SelectItem value="by_date">
                                    On a specific date
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {data.end_type === 'after_occurrences' && (
                            <Input
                                type="number"
                                min={1}
                                max={365}
                                value={data.max_occurrences}
                                onChange={(e) =>
                                    setData(
                                        'max_occurrences',
                                        parseInt(e.target.value),
                                    )
                                }
                                placeholder="Number of times"
                            />
                        )}

                        {data.end_type === 'by_date' && (
                            <Input
                                type="date"
                                value={data.end_date}
                                onChange={(e) =>
                                    setData('end_date', e.target.value)
                                }
                            />
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Create Recurrence
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
```

---

## 🧪 Testing

```php
// tests/Feature/RecurringTaskTest.php
<?php

use App\Enums\UserPlan;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Services\RecurrenceService;

beforeEach(function () {
    $this->user = User::factory()->create(['plan' => UserPlan::Pro]);
    $this->project = Project::factory()->create(['user_id' => $this->user->id]);
});

it('allows Pro users to create recurring tasks', function () {
    $task = Task::factory()->create([
        'project_id' => $this->project->id,
        'due_date' => now(),
    ]);

    $this->actingAs($this->user)
        ->postJson("/projects/{$this->project->id}/tasks/{$task->id}/recurrence", [
            'frequency' => 'weekly',
            'interval' => 1,
            'days_of_week' => [1, 3, 5], // Mon, Wed, Fri
            'end_type' => 'after_occurrences',
            'max_occurrences' => 10,
        ])
        ->assertCreated();

    expect($task->fresh()->recurrence_id)->not->toBeNull();
});

it('prevents Free users from creating recurring tasks', function () {
    $user = User::factory()->create(['plan' => UserPlan::Free]);
    $project = Project::factory()->create(['user_id' => $user->id]);
    $task = Task::factory()->create(['project_id' => $project->id]);

    $this->actingAs($user)
        ->postJson("/projects/{$project->id}/tasks/{$task->id}/recurrence", [
            'frequency' => 'daily',
        ])
        ->assertForbidden();
});

it('generates next task instance correctly', function () {
    $task = Task::factory()->create([
        'project_id' => $this->project->id,
        'title' => 'Weekly Report',
        'due_date' => now()->subWeek(),
    ]);

    $service = app(RecurrenceService::class);
    $recurrence = $service->createRecurrence($task, [
        'frequency' => 'weekly',
        'interval' => 1,
    ]);

    // Set next_occurrence_date to past to trigger generation
    $recurrence->update(['next_occurrence_date' => now()->subDay()]);

    $newTask = $service->generateNextInstance($recurrence);

    expect($newTask)->not->toBeNull();
    expect($newTask->title)->toBe('Weekly Report');
    expect($newTask->recurrence_index)->toBe(2);
});
```

---

## ✅ Checklist

- [ ] Create `task_recurrences` table migration
- [ ] Add recurrence columns to `tasks` table
- [ ] Create `RecurrenceFrequency` enum
- [ ] Create `RecurrenceEndType` enum
- [ ] Create `TaskRecurrence` model
- [ ] Update `Task` model with recurrence relationship
- [ ] Add `canCreateRecurringTasks()` to `UserPlan`
- [ ] Create `RecurrenceService`
- [ ] Create `ProcessRecurringTasks` command
- [ ] Register scheduler
- [ ] Create `RecurrenceController`
- [ ] Add routes
- [ ] Create `RecurrenceDialog` component
- [ ] Display recurrence indicator on task card
- [ ] Write tests

---

## 📚 References

- [Todoist Recurring Tasks](https://todoist.com/help/articles/set-a-recurring-due-date-YUYVJJAV)
- [Google Calendar Recurring Events](https://support.google.com/calendar/answer/37115)
- [RRULE Specification](https://icalendar.org/iCalendar-RFC-5545/3-8-5-3-recurrence-rule.html)
