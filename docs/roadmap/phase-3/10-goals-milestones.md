# 🎯 Goals & Milestones

## Tổng quan

Thiết lập mục tiêu dự án và theo dõi tiến độ với milestones.

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | 🟠 Low-Medium        |
| **Effort**       | 🟡 Medium (5-7 days) |
| **Plan**         | Pro Only             |
| **Dependencies** | Reports & Analytics  |

---

## 📋 Requirements

### Functional Requirements

1. **Goals**
    - Create project/personal goals
    - Goal types: Task completion, Time spent, Custom metric
    - Target value and deadline
    - Progress tracking

2. **Milestones**
    - Create project milestones
    - Link tasks to milestones
    - Due dates
    - Completion status

3. **Visualization**
    - Progress bars
    - Timeline view
    - Gantt-style chart (simplified)

4. **Notifications**
    - Goal deadline approaching
    - Milestone completed
    - Progress updates

---

## 🗃️ Database Schema

```php
// database/migrations/xxxx_create_goals_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Goals table
        Schema::create('goals', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();

            // Ownership
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->cascadeOnDelete();

            // Goal type and target
            $table->enum('type', ['tasks_completed', 'time_spent', 'custom']);
            $table->unsignedInteger('target_value'); // Number of tasks, minutes, or custom
            $table->unsignedInteger('current_value')->default(0);
            $table->string('unit')->nullable(); // 'tasks', 'hours', custom unit

            // Timeframe
            $table->date('start_date');
            $table->date('end_date');

            // Status
            $table->enum('status', ['active', 'completed', 'archived'])->default('active');
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['project_id', 'status']);
        });

        // Milestones table
        Schema::create('milestones', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();

            $table->date('due_date')->nullable();
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->string('color')->nullable();

            $table->timestamps();

            $table->index(['project_id', 'status']);
        });

        // Link tasks to milestones
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('milestone_id')->nullable()->after('recurrence_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropConstrainedForeignId('milestone_id');
        });
        Schema::dropIfExists('milestones');
        Schema::dropIfExists('goals');
    }
};
```

---

## 🏗️ Implementation

### Step 1: Update UserPlan.php

```php
// app/Enums/UserPlan.php

/**
 * Check if this plan can create goals and milestones.
 */
public function canCreateGoals(): bool
{
    return $this === self::Pro;
}
```

### Step 2: Create Enums

```php
// app/Enums/GoalType.php
<?php

namespace App\Enums;

enum GoalType: string
{
    case TasksCompleted = 'tasks_completed';
    case TimeSpent = 'time_spent';
    case Custom = 'custom';

    public function label(): string
    {
        return match ($this) {
            self::TasksCompleted => 'Tasks Completed',
            self::TimeSpent => 'Time Spent',
            self::Custom => 'Custom Metric',
        };
    }

    public function defaultUnit(): string
    {
        return match ($this) {
            self::TasksCompleted => 'tasks',
            self::TimeSpent => 'hours',
            self::Custom => '',
        };
    }
}

// app/Enums/GoalStatus.php
<?php

namespace App\Enums;

enum GoalStatus: string
{
    case Active = 'active';
    case Completed = 'completed';
    case Archived = 'archived';
}

// app/Enums/MilestoneStatus.php
<?php

namespace App\Enums;

enum MilestoneStatus: string
{
    case Pending = 'pending';
    case InProgress = 'in_progress';
    case Completed = 'completed';
}
```

### Step 3: Create Models

```php
// app/Models/Goal.php
<?php

namespace App\Models;

use App\Enums\GoalType;
use App\Enums\GoalStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Goal extends Model
{
    protected $fillable = [
        'title',
        'description',
        'user_id',
        'project_id',
        'type',
        'target_value',
        'current_value',
        'unit',
        'start_date',
        'end_date',
        'status',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => GoalType::class,
            'status' => GoalStatus::class,
            'start_date' => 'date',
            'end_date' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    // Scopes
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', GoalStatus::Active);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    // Accessors
    public function getProgressPercentAttribute(): float
    {
        if ($this->target_value === 0) return 0;
        return min(100, round(($this->current_value / $this->target_value) * 100, 1));
    }

    public function getDaysRemainingAttribute(): int
    {
        return max(0, now()->diffInDays($this->end_date, false));
    }

    public function getIsOverdueAttribute(): bool
    {
        return $this->status === GoalStatus::Active && now()->gt($this->end_date);
    }

    // Methods
    public function updateProgress(int $value): self
    {
        $this->current_value = $value;

        if ($this->current_value >= $this->target_value && $this->status === GoalStatus::Active) {
            $this->status = GoalStatus::Completed;
            $this->completed_at = now();
        }

        $this->save();

        return $this;
    }

    public function incrementProgress(int $amount = 1): self
    {
        return $this->updateProgress($this->current_value + $amount);
    }
}

// app/Models/Milestone.php
<?php

namespace App\Models;

use App\Enums\MilestoneStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Milestone extends Model
{
    protected $fillable = [
        'title',
        'description',
        'project_id',
        'created_by',
        'due_date',
        'status',
        'completed_at',
        'position',
        'color',
    ];

    protected function casts(): array
    {
        return [
            'status' => MilestoneStatus::class,
            'due_date' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    // Relationships
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    // Scopes
    public function scopePending(Builder $query): Builder
    {
        return $query->whereIn('status', [MilestoneStatus::Pending, MilestoneStatus::InProgress]);
    }

    // Accessors
    public function getProgressPercentAttribute(): float
    {
        $totalTasks = $this->tasks()->count();
        if ($totalTasks === 0) return 0;

        $completedTasks = $this->tasks()->whereNotNull('completed_at')->count();
        return round(($completedTasks / $totalTasks) * 100, 1);
    }

    public function getTasksCountAttribute(): array
    {
        return [
            'total' => $this->tasks()->count(),
            'completed' => $this->tasks()->whereNotNull('completed_at')->count(),
        ];
    }

    public function getIsOverdueAttribute(): bool
    {
        return $this->due_date &&
               $this->status !== MilestoneStatus::Completed &&
               now()->gt($this->due_date);
    }

    // Methods
    public function checkCompletion(): self
    {
        $tasksCount = $this->tasks_count;

        if ($tasksCount['total'] > 0 && $tasksCount['total'] === $tasksCount['completed']) {
            $this->update([
                'status' => MilestoneStatus::Completed,
                'completed_at' => now(),
            ]);
        } elseif ($tasksCount['completed'] > 0 && $this->status === MilestoneStatus::Pending) {
            $this->update(['status' => MilestoneStatus::InProgress]);
        }

        return $this;
    }
}
```

### Step 4: Update Task Model

```php
// Add to app/Models/Task.php

public function milestone(): BelongsTo
{
    return $this->belongsTo(Milestone::class);
}

// In boot method or observer, check milestone completion when task is completed
protected static function booted(): void
{
    static::updated(function (Task $task) {
        if ($task->wasChanged('completed_at') && $task->completed_at && $task->milestone_id) {
            $task->milestone->checkCompletion();
        }
    });
}
```

### Step 5: Goal Service

```php
// app/Services/GoalService.php
<?php

namespace App\Services;

use App\Enums\GoalStatus;
use App\Enums\GoalType;
use App\Models\Goal;
use App\Models\User;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;
use Carbon\Carbon;

class GoalService
{
    /**
     * Update progress for all active goals.
     */
    public function updateAllGoalsProgress(): int
    {
        $updated = 0;

        $goals = Goal::active()->get();

        foreach ($goals as $goal) {
            if ($this->updateGoalProgress($goal)) {
                $updated++;
            }
        }

        return $updated;
    }

    /**
     * Update progress for a specific goal.
     */
    public function updateGoalProgress(Goal $goal): bool
    {
        $newValue = $this->calculateGoalProgress($goal);

        if ($newValue !== $goal->current_value) {
            $goal->updateProgress($newValue);
            return true;
        }

        return false;
    }

    /**
     * Calculate current progress for a goal.
     */
    public function calculateGoalProgress(Goal $goal): int
    {
        return match ($goal->type) {
            GoalType::TasksCompleted => $this->calculateTasksCompleted($goal),
            GoalType::TimeSpent => $this->calculateTimeSpent($goal),
            GoalType::Custom => $goal->current_value, // Manual update
        };
    }

    private function calculateTasksCompleted(Goal $goal): int
    {
        $query = Task::whereNotNull('completed_at')
            ->whereBetween('completed_at', [$goal->start_date, $goal->end_date]);

        if ($goal->project_id) {
            $query->where('project_id', $goal->project_id);
        } else {
            $query->whereHas('project', fn ($q) => $q->where('user_id', $goal->user_id));
        }

        return $query->count();
    }

    private function calculateTimeSpent(Goal $goal): int
    {
        $query = TimeEntry::whereBetween('started_at', [$goal->start_date, $goal->end_date]);

        if ($goal->project_id) {
            $query->where('project_id', $goal->project_id);
        } else {
            $query->where('user_id', $goal->user_id);
        }

        // Return hours (target is in hours)
        return (int) floor($query->sum('duration_minutes') / 60);
    }

    /**
     * Get goal suggestions based on user history.
     */
    public function getSuggestions(User $user): array
    {
        // Analyze past performance to suggest realistic goals
        $avgTasksPerWeek = Task::whereHas('project', fn ($q) => $q->where('user_id', $user->id))
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', now()->subMonth())
            ->count() / 4;

        return [
            [
                'type' => GoalType::TasksCompleted,
                'title' => 'Complete tasks this week',
                'target_value' => max(5, round($avgTasksPerWeek)),
                'unit' => 'tasks',
                'period' => 'weekly',
            ],
            [
                'type' => GoalType::TasksCompleted,
                'title' => 'Monthly productivity goal',
                'target_value' => max(20, round($avgTasksPerWeek * 4)),
                'unit' => 'tasks',
                'period' => 'monthly',
            ],
        ];
    }
}
```

### Step 6: Controllers

```php
// app/Http/Controllers/Goals/GoalController.php
<?php

namespace App\Http\Controllers\Goals;

use App\Http\Controllers\Controller;
use App\Enums\GoalStatus;
use App\Models\Goal;
use App\Services\GoalService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GoalController extends Controller
{
    public function __construct(
        private GoalService $goalService
    ) {}

    public function index(Request $request)
    {
        if (!$request->user()->plan?->canCreateGoals()) {
            return Inertia::render('Goals/Upgrade');
        }

        $goals = Goal::forUser($request->user()->id)
            ->with('project:id,name')
            ->orderBy('end_date')
            ->get()
            ->groupBy('status');

        return Inertia::render('Goals/Index', [
            'goals' => [
                'active' => $goals[GoalStatus::Active->value] ?? [],
                'completed' => $goals[GoalStatus::Completed->value] ?? [],
                'archived' => $goals[GoalStatus::Archived->value] ?? [],
            ],
            'suggestions' => $this->goalService->getSuggestions($request->user()),
        ]);
    }

    public function store(Request $request)
    {
        if (!$request->user()->plan?->canCreateGoals()) {
            return back()->with('error', 'Goals require a Pro plan.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'type' => ['required', 'in:tasks_completed,time_spent,custom'],
            'target_value' => ['required', 'integer', 'min:1'],
            'unit' => ['nullable', 'string', 'max:50'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
        ]);

        Goal::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        return back()->with('success', 'Goal created.');
    }

    public function update(Request $request, Goal $goal)
    {
        $this->authorize('update', $goal);

        $validated = $request->validate([
            'title' => ['string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'target_value' => ['integer', 'min:1'],
            'current_value' => ['integer', 'min:0'], // For custom goals
            'status' => ['in:active,completed,archived'],
        ]);

        $goal->update($validated);

        return back()->with('success', 'Goal updated.');
    }

    public function destroy(Goal $goal)
    {
        $this->authorize('delete', $goal);

        $goal->delete();

        return back()->with('success', 'Goal deleted.');
    }
}

// app/Http/Controllers/Goals/MilestoneController.php
<?php

namespace App\Http\Controllers\Goals;

use App\Http\Controllers\Controller;
use App\Models\Milestone;
use App\Models\Project;
use Illuminate\Http\Request;

class MilestoneController extends Controller
{
    public function index(Request $request, Project $project)
    {
        $this->authorize('view', $project);

        $milestones = $project->milestones()
            ->withCount(['tasks', 'tasks as completed_tasks_count' => fn ($q) => $q->whereNotNull('completed_at')])
            ->orderBy('position')
            ->get();

        return response()->json(['milestones' => $milestones]);
    }

    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        if (!$request->user()->plan?->canCreateGoals()) {
            return response()->json(['message' => 'Pro plan required.'], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'due_date' => ['nullable', 'date'],
            'color' => ['nullable', 'string', 'max:7'],
        ]);

        $milestone = $project->milestones()->create([
            ...$validated,
            'created_by' => $request->user()->id,
            'position' => $project->milestones()->max('position') + 1,
        ]);

        return response()->json(['milestone' => $milestone], 201);
    }

    public function update(Request $request, Milestone $milestone)
    {
        $this->authorize('update', $milestone->project);

        $validated = $request->validate([
            'title' => ['string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'due_date' => ['nullable', 'date'],
            'color' => ['nullable', 'string', 'max:7'],
            'status' => ['in:pending,in_progress,completed'],
        ]);

        $milestone->update($validated);

        return response()->json(['milestone' => $milestone->fresh()]);
    }

    public function destroy(Milestone $milestone)
    {
        $this->authorize('update', $milestone->project);

        // Unlink tasks before deleting
        $milestone->tasks()->update(['milestone_id' => null]);
        $milestone->delete();

        return response()->json(['message' => 'Milestone deleted.']);
    }

    public function reorder(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'milestones' => ['required', 'array'],
            'milestones.*.id' => ['required', 'exists:milestones,id'],
            'milestones.*.position' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($validated['milestones'] as $item) {
            Milestone::where('id', $item['id'])->update(['position' => $item['position']]);
        }

        return response()->json(['message' => 'Milestones reordered.']);
    }
}
```

---

## 🛣️ Routes

```php
// routes/web.php

use App\Http\Controllers\Goals\GoalController;
use App\Http\Controllers\Goals\MilestoneController;

Route::middleware(['auth', 'verified'])->group(function () {
    // Goals
    Route::resource('goals', GoalController::class)->except(['show', 'edit', 'create']);

    // Milestones
    Route::prefix('projects/{project}/milestones')->group(function () {
        Route::get('/', [MilestoneController::class, 'index']);
        Route::post('/', [MilestoneController::class, 'store']);
        Route::post('/reorder', [MilestoneController::class, 'reorder']);
    });

    Route::put('/milestones/{milestone}', [MilestoneController::class, 'update']);
    Route::delete('/milestones/{milestone}', [MilestoneController::class, 'destroy']);
});
```

---

## 🎨 Frontend Implementation

### Goals Page

```tsx
// resources/js/pages/Goals/Index.tsx
import { Head, router } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusIcon, TargetIcon, TrophyIcon, ArchiveIcon } from 'lucide-react';
import { useState } from 'react';
import { CreateGoalDialog } from '@/components/goals/create-goal-dialog';

interface Goal {
    id: number;
    title: string;
    description: string | null;
    type: string;
    target_value: number;
    current_value: number;
    unit: string;
    start_date: string;
    end_date: string;
    status: string;
    progress_percent: number;
    days_remaining: number;
    is_overdue: boolean;
    project: { id: number; name: string } | null;
}

interface Props {
    goals: {
        active: Goal[];
        completed: Goal[];
        archived: Goal[];
    };
    suggestions: Array<{
        type: string;
        title: string;
        target_value: number;
        unit: string;
        period: string;
    }>;
}

export default function GoalsIndex({ goals, suggestions }: Props) {
    const [showCreate, setShowCreate] = useState(false);

    return (
        <AppLayout>
            <Head title="Goals" />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Goals</h1>
                        <p className="text-muted-foreground">
                            Set targets and track your progress
                        </p>
                    </div>
                    <Button onClick={() => setShowCreate(true)}>
                        <PlusIcon className="mr-2 size-4" />
                        New Goal
                    </Button>
                </div>

                {/* Quick suggestions */}
                {goals.active.length === 0 && suggestions.length > 0 && (
                    <Card className="bg-primary/5 mb-8">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Suggested Goals
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4">
                                {suggestions.map((suggestion, i) => (
                                    <Button
                                        key={i}
                                        variant="outline"
                                        className="h-auto flex-col items-start p-4"
                                        onClick={() => {
                                            /* Quick create */
                                        }}
                                    >
                                        <span className="font-medium">
                                            {suggestion.title}
                                        </span>
                                        <span className="text-muted-foreground text-sm">
                                            {suggestion.target_value}{' '}
                                            {suggestion.unit}
                                        </span>
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Tabs defaultValue="active">
                    <TabsList>
                        <TabsTrigger value="active" className="gap-2">
                            <TargetIcon className="size-4" />
                            Active ({goals.active.length})
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="gap-2">
                            <TrophyIcon className="size-4" />
                            Completed ({goals.completed.length})
                        </TabsTrigger>
                        <TabsTrigger value="archived" className="gap-2">
                            <ArchiveIcon className="size-4" />
                            Archived ({goals.archived.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="mt-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {goals.active.map((goal) => (
                                <GoalCard key={goal.id} goal={goal} />
                            ))}
                        </div>
                        {goals.active.length === 0 && (
                            <EmptyState
                                title="No active goals"
                                description="Create a goal to start tracking your progress"
                                action={
                                    <Button onClick={() => setShowCreate(true)}>
                                        Create Goal
                                    </Button>
                                }
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="completed" className="mt-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {goals.completed.map((goal) => (
                                <GoalCard key={goal.id} goal={goal} />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="archived" className="mt-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {goals.archived.map((goal) => (
                                <GoalCard key={goal.id} goal={goal} />
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <CreateGoalDialog open={showCreate} onOpenChange={setShowCreate} />
        </AppLayout>
    );
}

function GoalCard({ goal }: { goal: Goal }) {
    return (
        <Card className={goal.is_overdue ? 'border-red-500' : ''}>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{goal.title}</CardTitle>
                    {goal.is_overdue && (
                        <Badge variant="destructive">Overdue</Badge>
                    )}
                </div>
                {goal.project && (
                    <p className="text-muted-foreground text-sm">
                        {goal.project.name}
                    </p>
                )}
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span>
                            {goal.current_value} / {goal.target_value}{' '}
                            {goal.unit}
                        </span>
                        <span className="font-medium">
                            {goal.progress_percent}%
                        </span>
                    </div>
                    <Progress value={goal.progress_percent} />
                    <div className="text-muted-foreground flex justify-between text-xs">
                        <span>
                            {new Date(goal.start_date).toLocaleDateString()} -{' '}
                            {new Date(goal.end_date).toLocaleDateString()}
                        </span>
                        {goal.status === 'active' && (
                            <span>{goal.days_remaining} days left</span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function EmptyState({
    title,
    description,
    action,
}: {
    title: string;
    description: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="py-12 text-center">
            <p className="font-medium">{title}</p>
            <p className="text-muted-foreground mb-4 text-sm">{description}</p>
            {action}
        </div>
    );
}
```

### Milestone Timeline Component

```tsx
// resources/js/components/goals/milestone-timeline.tsx
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CheckCircleIcon, CircleIcon, ClockIcon } from 'lucide-react';

interface Milestone {
    id: number;
    title: string;
    description: string | null;
    due_date: string | null;
    status: 'pending' | 'in_progress' | 'completed';
    tasks_count: number;
    completed_tasks_count: number;
    color: string | null;
}

interface Props {
    milestones: Milestone[];
}

export function MilestoneTimeline({ milestones }: Props) {
    return (
        <div className="relative">
            {/* Timeline line */}
            <div className="bg-border absolute bottom-0 left-4 top-0 w-0.5" />

            <div className="space-y-6">
                {milestones.map((milestone, index) => {
                    const progress =
                        milestone.tasks_count > 0
                            ? (milestone.completed_tasks_count /
                                  milestone.tasks_count) *
                              100
                            : 0;

                    return (
                        <div key={milestone.id} className="relative pl-10">
                            {/* Timeline dot */}
                            <div
                                className={cn(
                                    'absolute left-2 flex size-5 -translate-x-1/2 items-center justify-center rounded-full',
                                    milestone.status === 'completed'
                                        ? 'bg-green-500 text-white'
                                        : milestone.status === 'in_progress'
                                          ? 'bg-blue-500 text-white'
                                          : 'bg-muted border-border border-2',
                                )}
                            >
                                {milestone.status === 'completed' ? (
                                    <CheckCircleIcon className="size-3" />
                                ) : (
                                    <CircleIcon className="size-3" />
                                )}
                            </div>

                            {/* Milestone content */}
                            <div className="bg-card rounded-lg border p-4">
                                <div className="mb-2 flex items-start justify-between">
                                    <div>
                                        <h3 className="font-medium">
                                            {milestone.title}
                                        </h3>
                                        {milestone.due_date && (
                                            <p className="text-muted-foreground flex items-center gap-1 text-sm">
                                                <ClockIcon className="size-3" />
                                                Due:{' '}
                                                {new Date(
                                                    milestone.due_date,
                                                ).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    <Badge
                                        variant={
                                            milestone.status === 'completed'
                                                ? 'default'
                                                : milestone.status ===
                                                    'in_progress'
                                                  ? 'secondary'
                                                  : 'outline'
                                        }
                                    >
                                        {milestone.status.replace('_', ' ')}
                                    </Badge>
                                </div>

                                {milestone.description && (
                                    <p className="text-muted-foreground mb-3 text-sm">
                                        {milestone.description}
                                    </p>
                                )}

                                {milestone.tasks_count > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>
                                                {
                                                    milestone.completed_tasks_count
                                                }{' '}
                                                / {milestone.tasks_count} tasks
                                            </span>
                                            <span>{Math.round(progress)}%</span>
                                        </div>
                                        <Progress
                                            value={progress}
                                            className="h-2"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
```

---

## 🧪 Testing

```php
// tests/Feature/GoalTest.php
<?php

use App\Enums\GoalStatus;
use App\Enums\GoalType;
use App\Enums\UserPlan;
use App\Models\Goal;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Services\GoalService;

beforeEach(function () {
    $this->user = User::factory()->create(['plan' => UserPlan::Pro]);
    $this->project = Project::factory()->create(['user_id' => $this->user->id]);
});

it('allows Pro users to create goals', function () {
    $this->actingAs($this->user)
        ->post('/goals', [
            'title' => 'Complete 10 tasks',
            'type' => 'tasks_completed',
            'target_value' => 10,
            'unit' => 'tasks',
            'start_date' => now()->format('Y-m-d'),
            'end_date' => now()->addWeek()->format('Y-m-d'),
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('goals', [
        'title' => 'Complete 10 tasks',
        'user_id' => $this->user->id,
    ]);
});

it('updates goal progress automatically', function () {
    $goal = Goal::factory()->create([
        'user_id' => $this->user->id,
        'type' => GoalType::TasksCompleted,
        'target_value' => 5,
        'current_value' => 0,
        'start_date' => now()->subDay(),
        'end_date' => now()->addWeek(),
    ]);

    // Complete some tasks
    Task::factory()->count(3)->create([
        'project_id' => $this->project->id,
        'completed_at' => now(),
    ]);

    $service = app(GoalService::class);
    $service->updateGoalProgress($goal);

    expect($goal->fresh()->current_value)->toBe(3);
});

it('marks goal completed when target reached', function () {
    $goal = Goal::factory()->create([
        'user_id' => $this->user->id,
        'type' => GoalType::TasksCompleted,
        'target_value' => 3,
        'current_value' => 2,
        'status' => GoalStatus::Active,
    ]);

    $goal->incrementProgress();

    expect($goal->status)->toBe(GoalStatus::Completed);
    expect($goal->completed_at)->not->toBeNull();
});

// tests/Feature/MilestoneTest.php
<?php

use App\Enums\MilestoneStatus;
use App\Enums\UserPlan;
use App\Models\Milestone;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['plan' => UserPlan::Pro]);
    $this->project = Project::factory()->create(['user_id' => $this->user->id]);
});

it('creates milestone for project', function () {
    $this->actingAs($this->user)
        ->postJson("/projects/{$this->project->id}/milestones", [
            'title' => 'Beta Release',
            'due_date' => now()->addMonth()->format('Y-m-d'),
        ])
        ->assertCreated();

    $this->assertDatabaseHas('milestones', [
        'title' => 'Beta Release',
        'project_id' => $this->project->id,
    ]);
});

it('auto-completes milestone when all tasks done', function () {
    $milestone = Milestone::factory()->create([
        'project_id' => $this->project->id,
        'status' => MilestoneStatus::InProgress,
    ]);

    $tasks = Task::factory()->count(3)->create([
        'project_id' => $this->project->id,
        'milestone_id' => $milestone->id,
    ]);

    // Complete all tasks
    foreach ($tasks as $task) {
        $task->update(['completed_at' => now()]);
    }

    expect($milestone->fresh()->status)->toBe(MilestoneStatus::Completed);
});
```

---

## ✅ Checklist

- [ ] Create `goals` table migration
- [ ] Create `milestones` table migration
- [ ] Add `milestone_id` to tasks table
- [ ] Create `GoalType` enum
- [ ] Create `GoalStatus` enum
- [ ] Create `MilestoneStatus` enum
- [ ] Create `Goal` model
- [ ] Create `Milestone` model
- [ ] Update `Task` model with milestone relationship
- [ ] Add `canCreateGoals()` to `UserPlan`
- [ ] Create `GoalService`
- [ ] Create `GoalController`
- [ ] Create `MilestoneController`
- [ ] Create `GoalPolicy`
- [ ] Add routes
- [ ] Create Goals Index page
- [ ] Create `CreateGoalDialog` component
- [ ] Create `GoalCard` component
- [ ] Create `MilestoneTimeline` component
- [ ] Add milestone selector to task detail
- [ ] Create scheduled command to update goals progress
- [ ] Write tests

---

## 📚 References

- [Asana Goals](https://asana.com/guide/help/premium/goals)
- [Monday.com Milestones](https://monday.com/features/milestones)
- [Notion OKRs](https://www.notion.so/blog/okrs-notion)
- [Jira Roadmaps](https://www.atlassian.com/software/jira/features/roadmaps)
