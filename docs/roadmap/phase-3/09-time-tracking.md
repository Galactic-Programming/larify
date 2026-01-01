# ⏱️ Time Tracking

## Tổng quan

Theo dõi thời gian làm việc trên mỗi task với timer và manual entry.

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | 🟡 Medium            |
| **Effort**       | 🟡 Medium (5-7 days) |
| **Plan**         | Pro Only             |
| **Dependencies** | Reports & Analytics  |

---

## 📋 Requirements

### Functional Requirements

1. **Time Entry Methods**
    - Timer: Start/Stop/Pause real-time tracking
    - Manual: Add time entries retroactively
    - Running indicator visible in UI

2. **Time Entry Details**
    - Duration (hours:minutes)
    - Description/notes
    - Date of work
    - Billable flag (for freelancers)

3. **Time Reports**
    - Daily/Weekly/Monthly summaries
    - Time by project
    - Time by task
    - Billable vs non-billable
    - Export to CSV

4. **Integrations**
    - Sync with task completion
    - Time estimates vs actual
    - Team time tracking

---

## 🗃️ Database Schema

```php
// database/migrations/xxxx_create_time_entries_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('time_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('task_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();

            // Time data
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->unsignedInteger('duration_minutes')->default(0); // Calculated or manual

            // Details
            $table->string('description')->nullable();
            $table->boolean('is_billable')->default(false);
            $table->boolean('is_running')->default(false);

            $table->timestamps();

            $table->index(['user_id', 'started_at']);
            $table->index(['project_id', 'started_at']);
            $table->index(['task_id', 'started_at']);
            $table->index('is_running');
        });

        // Add estimated_hours to tasks table
        Schema::table('tasks', function (Blueprint $table) {
            $table->decimal('estimated_hours', 5, 2)->nullable()->after('due_date');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('estimated_hours');
        });
        Schema::dropIfExists('time_entries');
    }
};
```

---

## 🏗️ Implementation

### Step 1: Update UserPlan.php

```php
// app/Enums/UserPlan.php

/**
 * Check if this plan can track time.
 */
public function canTrackTime(): bool
{
    return $this === self::Pro;
}
```

### Step 2: Create Model

```php
// app/Models/TimeEntry.php
<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class TimeEntry extends Model
{
    protected $fillable = [
        'user_id',
        'task_id',
        'project_id',
        'started_at',
        'ended_at',
        'duration_minutes',
        'description',
        'is_billable',
        'is_running',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'is_billable' => 'boolean',
            'is_running' => 'boolean',
        ];
    }

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    // Scopes
    public function scopeRunning(Builder $query): Builder
    {
        return $query->where('is_running', true);
    }

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForProject(Builder $query, int $projectId): Builder
    {
        return $query->where('project_id', $projectId);
    }

    public function scopeBillable(Builder $query): Builder
    {
        return $query->where('is_billable', true);
    }

    public function scopeInDateRange(Builder $query, Carbon $start, Carbon $end): Builder
    {
        return $query->whereBetween('started_at', [$start, $end]);
    }

    // Accessors
    public function getDurationAttribute(): string
    {
        $minutes = $this->duration_minutes;
        $hours = floor($minutes / 60);
        $mins = $minutes % 60;

        return sprintf('%d:%02d', $hours, $mins);
    }

    public function getIsRunningDurationAttribute(): int
    {
        if (!$this->is_running) {
            return $this->duration_minutes;
        }

        return $this->duration_minutes + now()->diffInMinutes($this->started_at);
    }

    // Methods
    public function stop(): self
    {
        if ($this->is_running) {
            $this->update([
                'ended_at' => now(),
                'duration_minutes' => now()->diffInMinutes($this->started_at),
                'is_running' => false,
            ]);
        }

        return $this;
    }

    public function resume(): self
    {
        // Create a new entry continuing from this one
        $newEntry = self::create([
            'user_id' => $this->user_id,
            'task_id' => $this->task_id,
            'project_id' => $this->project_id,
            'started_at' => now(),
            'description' => $this->description,
            'is_billable' => $this->is_billable,
            'is_running' => true,
        ]);

        return $newEntry;
    }
}
```

### Step 3: Service Class

```php
// app/Services/TimeTrackingService.php
<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TimeTrackingService
{
    /**
     * Start a new timer.
     */
    public function startTimer(User $user, Project $project, ?Task $task = null, ?string $description = null): TimeEntry
    {
        // Stop any running timers first
        $this->stopRunningTimers($user);

        return TimeEntry::create([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'task_id' => $task?->id,
            'started_at' => now(),
            'description' => $description,
            'is_running' => true,
        ]);
    }

    /**
     * Stop all running timers for user.
     */
    public function stopRunningTimers(User $user): int
    {
        $runningEntries = TimeEntry::forUser($user->id)->running()->get();

        foreach ($runningEntries as $entry) {
            $entry->stop();
        }

        return $runningEntries->count();
    }

    /**
     * Add manual time entry.
     */
    public function addManualEntry(User $user, array $data): TimeEntry
    {
        return TimeEntry::create([
            'user_id' => $user->id,
            'project_id' => $data['project_id'],
            'task_id' => $data['task_id'] ?? null,
            'started_at' => Carbon::parse($data['date'])->setTimeFromTimeString($data['start_time'] ?? '09:00'),
            'ended_at' => Carbon::parse($data['date'])->setTimeFromTimeString($data['start_time'] ?? '09:00')
                ->addMinutes($data['duration_minutes']),
            'duration_minutes' => $data['duration_minutes'],
            'description' => $data['description'] ?? null,
            'is_billable' => $data['is_billable'] ?? false,
            'is_running' => false,
        ]);
    }

    /**
     * Get time report for user.
     */
    public function getUserReport(User $user, Carbon $startDate, Carbon $endDate): array
    {
        $entries = TimeEntry::forUser($user->id)
            ->inDateRange($startDate, $endDate)
            ->with(['project:id,name', 'task:id,title'])
            ->orderBy('started_at', 'desc')
            ->get();

        $totalMinutes = $entries->sum('duration_minutes');
        $billableMinutes = $entries->where('is_billable', true)->sum('duration_minutes');

        return [
            'entries' => $entries,
            'total_time' => $this->formatDuration($totalMinutes),
            'total_minutes' => $totalMinutes,
            'billable_time' => $this->formatDuration($billableMinutes),
            'billable_minutes' => $billableMinutes,
            'by_project' => $this->groupByProject($entries),
            'by_day' => $this->groupByDay($entries),
        ];
    }

    /**
     * Get project time report.
     */
    public function getProjectReport(Project $project, Carbon $startDate, Carbon $endDate): array
    {
        $entries = TimeEntry::forProject($project->id)
            ->inDateRange($startDate, $endDate)
            ->with(['user:id,name', 'task:id,title'])
            ->orderBy('started_at', 'desc')
            ->get();

        $totalMinutes = $entries->sum('duration_minutes');

        return [
            'entries' => $entries,
            'total_time' => $this->formatDuration($totalMinutes),
            'total_minutes' => $totalMinutes,
            'by_user' => $this->groupByUser($entries),
            'by_task' => $this->groupByTask($entries),
        ];
    }

    /**
     * Get time tracked vs estimated for a task.
     */
    public function getTaskTimeComparison(Task $task): array
    {
        $trackedMinutes = TimeEntry::where('task_id', $task->id)->sum('duration_minutes');
        $estimatedMinutes = ($task->estimated_hours ?? 0) * 60;

        return [
            'tracked' => $this->formatDuration($trackedMinutes),
            'tracked_minutes' => $trackedMinutes,
            'estimated' => $this->formatDuration($estimatedMinutes),
            'estimated_minutes' => $estimatedMinutes,
            'difference' => $trackedMinutes - $estimatedMinutes,
            'is_over' => $trackedMinutes > $estimatedMinutes,
        ];
    }

    private function groupByProject(Collection $entries): array
    {
        return $entries->groupBy('project_id')
            ->map(fn ($group) => [
                'project' => $group->first()->project,
                'total_minutes' => $group->sum('duration_minutes'),
                'total_time' => $this->formatDuration($group->sum('duration_minutes')),
            ])
            ->values()
            ->toArray();
    }

    private function groupByUser(Collection $entries): array
    {
        return $entries->groupBy('user_id')
            ->map(fn ($group) => [
                'user' => $group->first()->user,
                'total_minutes' => $group->sum('duration_minutes'),
                'total_time' => $this->formatDuration($group->sum('duration_minutes')),
            ])
            ->values()
            ->toArray();
    }

    private function groupByTask(Collection $entries): array
    {
        return $entries->groupBy('task_id')
            ->map(fn ($group) => [
                'task' => $group->first()->task,
                'total_minutes' => $group->sum('duration_minutes'),
                'total_time' => $this->formatDuration($group->sum('duration_minutes')),
            ])
            ->values()
            ->toArray();
    }

    private function groupByDay(Collection $entries): array
    {
        return $entries->groupBy(fn ($e) => $e->started_at->format('Y-m-d'))
            ->map(fn ($group, $date) => [
                'date' => $date,
                'total_minutes' => $group->sum('duration_minutes'),
                'total_time' => $this->formatDuration($group->sum('duration_minutes')),
            ])
            ->values()
            ->toArray();
    }

    private function formatDuration(int $minutes): string
    {
        $hours = floor($minutes / 60);
        $mins = $minutes % 60;

        return sprintf('%d:%02d', $hours, $mins);
    }
}
```

### Step 4: Controller

```php
// app/Http/Controllers/TimeTracking/TimeEntryController.php
<?php

namespace App\Http\Controllers\TimeTracking;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;
use App\Services\TimeTrackingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TimeEntryController extends Controller
{
    public function __construct(
        private TimeTrackingService $service
    ) {}

    public function index(Request $request)
    {
        if (!$request->user()->plan?->canTrackTime()) {
            return Inertia::render('TimeTracking/Upgrade');
        }

        $startDate = $request->input('start_date')
            ? Carbon::parse($request->input('start_date'))
            : now()->startOfWeek();
        $endDate = $request->input('end_date')
            ? Carbon::parse($request->input('end_date'))
            : now()->endOfWeek();

        $report = $this->service->getUserReport($request->user(), $startDate, $endDate);

        $runningEntry = TimeEntry::forUser($request->user()->id)
            ->running()
            ->with(['project:id,name', 'task:id,title'])
            ->first();

        return Inertia::render('TimeTracking/Index', [
            'report' => $report,
            'running_entry' => $runningEntry,
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'projects' => $request->user()->projects()->select('id', 'name')->get(),
        ]);
    }

    /**
     * Start a timer.
     */
    public function start(Request $request)
    {
        if (!$request->user()->plan?->canTrackTime()) {
            return back()->with('error', 'Time tracking requires a Pro plan.');
        }

        $validated = $request->validate([
            'project_id' => ['required', 'exists:projects,id'],
            'task_id' => ['nullable', 'exists:tasks,id'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $project = Project::findOrFail($validated['project_id']);
        $this->authorize('view', $project);

        $task = isset($validated['task_id']) ? Task::find($validated['task_id']) : null;

        $entry = $this->service->startTimer(
            $request->user(),
            $project,
            $task,
            $validated['description'] ?? null
        );

        return back()->with('success', 'Timer started.');
    }

    /**
     * Stop the running timer.
     */
    public function stop(Request $request)
    {
        $count = $this->service->stopRunningTimers($request->user());

        if ($count === 0) {
            return back()->with('info', 'No running timer to stop.');
        }

        return back()->with('success', 'Timer stopped.');
    }

    /**
     * Add manual time entry.
     */
    public function store(Request $request)
    {
        if (!$request->user()->plan?->canTrackTime()) {
            return back()->with('error', 'Time tracking requires a Pro plan.');
        }

        $validated = $request->validate([
            'project_id' => ['required', 'exists:projects,id'],
            'task_id' => ['nullable', 'exists:tasks,id'],
            'date' => ['required', 'date'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'description' => ['nullable', 'string', 'max:255'],
            'is_billable' => ['boolean'],
        ]);

        $project = Project::findOrFail($validated['project_id']);
        $this->authorize('view', $project);

        $this->service->addManualEntry($request->user(), $validated);

        return back()->with('success', 'Time entry added.');
    }

    /**
     * Update a time entry.
     */
    public function update(Request $request, TimeEntry $timeEntry)
    {
        $this->authorize('update', $timeEntry);

        $validated = $request->validate([
            'duration_minutes' => ['integer', 'min:1', 'max:1440'],
            'description' => ['nullable', 'string', 'max:255'],
            'is_billable' => ['boolean'],
        ]);

        $timeEntry->update($validated);

        return back()->with('success', 'Time entry updated.');
    }

    /**
     * Delete a time entry.
     */
    public function destroy(TimeEntry $timeEntry)
    {
        $this->authorize('delete', $timeEntry);

        $timeEntry->delete();

        return back()->with('success', 'Time entry deleted.');
    }

    /**
     * Export time entries.
     */
    public function export(Request $request)
    {
        if (!$request->user()->plan?->canTrackTime()) {
            abort(403);
        }

        $validated = $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'project_id' => ['nullable', 'exists:projects,id'],
        ]);

        $query = TimeEntry::forUser($request->user()->id)
            ->inDateRange(
                Carbon::parse($validated['start_date']),
                Carbon::parse($validated['end_date'])
            )
            ->with(['project:id,name', 'task:id,title']);

        if (isset($validated['project_id'])) {
            $query->forProject($validated['project_id']);
        }

        $entries = $query->orderBy('started_at')->get();

        // Generate CSV
        $filename = 'time-entries-' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($entries) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Date', 'Project', 'Task', 'Description', 'Duration', 'Billable']);

            foreach ($entries as $entry) {
                fputcsv($handle, [
                    $entry->started_at->format('Y-m-d'),
                    $entry->project->name,
                    $entry->task?->title ?? '',
                    $entry->description ?? '',
                    $entry->duration,
                    $entry->is_billable ? 'Yes' : 'No',
                ]);
            }

            fclose($handle);
        }, $filename);
    }
}
```

### Step 5: Policy

```php
// app/Policies/TimeEntryPolicy.php
<?php

namespace App\Policies;

use App\Models\TimeEntry;
use App\Models\User;

class TimeEntryPolicy
{
    public function update(User $user, TimeEntry $timeEntry): bool
    {
        return $user->id === $timeEntry->user_id;
    }

    public function delete(User $user, TimeEntry $timeEntry): bool
    {
        return $user->id === $timeEntry->user_id;
    }
}
```

---

## 🛣️ Routes

```php
// routes/web.php

use App\Http\Controllers\TimeTracking\TimeEntryController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('time-tracking')->group(function () {
        Route::get('/', [TimeEntryController::class, 'index'])->name('time-tracking.index');
        Route::post('/start', [TimeEntryController::class, 'start'])->name('time-tracking.start');
        Route::post('/stop', [TimeEntryController::class, 'stop'])->name('time-tracking.stop');
        Route::post('/entries', [TimeEntryController::class, 'store'])->name('time-tracking.store');
        Route::put('/entries/{timeEntry}', [TimeEntryController::class, 'update'])->name('time-tracking.update');
        Route::delete('/entries/{timeEntry}', [TimeEntryController::class, 'destroy'])->name('time-tracking.destroy');
        Route::get('/export', [TimeEntryController::class, 'export'])->name('time-tracking.export');
    });
});
```

---

## 🎨 Frontend Implementation

### Timer Component

```tsx
// resources/js/components/time-tracking/timer.tsx
import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PlayIcon, StopIcon, ClockIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RunningEntry {
    id: number;
    started_at: string;
    duration_minutes: number;
    project: { id: number; name: string };
    task: { id: number; title: string } | null;
    description: string | null;
}

interface Project {
    id: number;
    name: string;
}

interface Props {
    runningEntry: RunningEntry | null;
    projects: Project[];
}

export function Timer({ runningEntry, projects }: Props) {
    const [elapsed, setElapsed] = useState(0);
    const [projectId, setProjectId] = useState<string>('');
    const [description, setDescription] = useState('');

    // Update elapsed time every second when timer is running
    useEffect(() => {
        if (!runningEntry) {
            setElapsed(0);
            return;
        }

        const startTime = new Date(runningEntry.started_at).getTime();
        const updateElapsed = () => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        };

        updateElapsed();
        const interval = setInterval(updateElapsed, 1000);

        return () => clearInterval(interval);
    }, [runningEntry]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStart = () => {
        if (!projectId) return;

        router.post('/time-tracking/start', {
            project_id: projectId,
            description: description || null,
        });
    };

    const handleStop = () => {
        router.post('/time-tracking/stop');
    };

    return (
        <div className="bg-card flex items-center gap-4 rounded-lg border p-4">
            {runningEntry ? (
                // Running state
                <>
                    <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                            <span className="relative flex size-2">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                            </span>
                            <span className="text-muted-foreground text-sm">
                                {runningEntry.project.name}
                                {runningEntry.task &&
                                    ` / ${runningEntry.task.title}`}
                            </span>
                        </div>
                        {runningEntry.description && (
                            <p className="text-sm">
                                {runningEntry.description}
                            </p>
                        )}
                    </div>
                    <div className="font-mono text-2xl font-bold tabular-nums">
                        {formatTime(elapsed)}
                    </div>
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={handleStop}
                    >
                        <StopIcon className="size-5" />
                    </Button>
                </>
            ) : (
                // Idle state
                <>
                    <Select value={projectId} onValueChange={setProjectId}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.map((project) => (
                                <SelectItem
                                    key={project.id}
                                    value={project.id.toString()}
                                >
                                    {project.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        placeholder="What are you working on?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="flex-1"
                    />
                    <div className="text-muted-foreground font-mono text-2xl font-bold tabular-nums">
                        00:00:00
                    </div>
                    <Button
                        variant="default"
                        size="icon"
                        onClick={handleStart}
                        disabled={!projectId}
                    >
                        <PlayIcon className="size-5" />
                    </Button>
                </>
            )}
        </div>
    );
}
```

### Time Tracking Page

```tsx
// resources/js/pages/TimeTracking/Index.tsx
import { Head } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { Timer } from '@/components/time-tracking/timer';
import { TimeEntryList } from '@/components/time-tracking/time-entry-list';
import { TimeReport } from '@/components/time-tracking/time-report';
import { ManualEntryDialog } from '@/components/time-tracking/manual-entry-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusIcon, DownloadIcon } from 'lucide-react';
import { useState } from 'react';

interface Props {
    report: {
        entries: Array<{
            id: number;
            started_at: string;
            duration_minutes: number;
            description: string | null;
            is_billable: boolean;
            project: { id: number; name: string };
            task: { id: number; title: string } | null;
        }>;
        total_time: string;
        total_minutes: number;
        billable_time: string;
        by_project: Array<{ project: { name: string }; total_time: string }>;
        by_day: Array<{ date: string; total_time: string }>;
    };
    running_entry: any;
    filters: { start_date: string; end_date: string };
    projects: Array<{ id: number; name: string }>;
}

export default function TimeTrackingIndex({
    report,
    running_entry,
    filters,
    projects,
}: Props) {
    const [showManualEntry, setShowManualEntry] = useState(false);

    return (
        <AppLayout>
            <Head title="Time Tracking" />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Time Tracking</h1>
                        <p className="text-muted-foreground">
                            Track time spent on tasks and projects
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowManualEntry(true)}
                        >
                            <PlusIcon className="mr-2 size-4" />
                            Manual Entry
                        </Button>
                        <Button variant="outline" asChild>
                            <a
                                href={`/time-tracking/export?start_date=${filters.start_date}&end_date=${filters.end_date}`}
                            >
                                <DownloadIcon className="mr-2 size-4" />
                                Export CSV
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Timer */}
                <Timer runningEntry={running_entry} projects={projects} />

                {/* Summary Cards */}
                <div className="my-8 grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                Total Time
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">
                                {report.total_time}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                Billable Time
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">
                                {report.billable_time}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-muted-foreground text-sm font-medium">
                                Entries
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">
                                {report.entries.length}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="entries">
                    <TabsList>
                        <TabsTrigger value="entries">Entries</TabsTrigger>
                        <TabsTrigger value="report">Report</TabsTrigger>
                    </TabsList>

                    <TabsContent value="entries" className="mt-4">
                        <TimeEntryList entries={report.entries} />
                    </TabsContent>

                    <TabsContent value="report" className="mt-4">
                        <TimeReport
                            byProject={report.by_project}
                            byDay={report.by_day}
                        />
                    </TabsContent>
                </Tabs>
            </div>

            <ManualEntryDialog
                open={showManualEntry}
                onOpenChange={setShowManualEntry}
                projects={projects}
            />
        </AppLayout>
    );
}
```

### Time Entry List

```tsx
// resources/js/components/time-tracking/time-entry-list.tsx
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PencilIcon, TrashIcon, DollarSignIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TimeEntry {
    id: number;
    started_at: string;
    duration_minutes: number;
    description: string | null;
    is_billable: boolean;
    project: { id: number; name: string };
    task: { id: number; title: string } | null;
}

interface Props {
    entries: TimeEntry[];
}

export function TimeEntryList({ entries }: Props) {
    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}:${m.toString().padStart(2, '0')}`;
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this time entry?')) {
            router.delete(`/time-tracking/entries/${id}`);
        }
    };

    if (entries.length === 0) {
        return (
            <div className="text-muted-foreground py-12 text-center">
                No time entries for this period. Start tracking!
            </div>
        );
    }

    // Group by date
    const grouped = entries.reduce(
        (acc, entry) => {
            const date = new Date(entry.started_at).toLocaleDateString();
            if (!acc[date]) acc[date] = [];
            acc[date].push(entry);
            return acc;
        },
        {} as Record<string, TimeEntry[]>,
    );

    return (
        <div className="space-y-6">
            {Object.entries(grouped).map(([date, dayEntries]) => (
                <div key={date}>
                    <h3 className="mb-3 font-medium">{date}</h3>
                    <div className="space-y-2">
                        {dayEntries.map((entry) => (
                            <div
                                key={entry.id}
                                className="bg-card group flex items-center gap-4 rounded-lg border p-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            {entry.project.name}
                                        </span>
                                        {entry.task && (
                                            <span className="text-muted-foreground">
                                                / {entry.task.title}
                                            </span>
                                        )}
                                        {entry.is_billable && (
                                            <Badge
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                <DollarSignIcon className="mr-1 size-3" />
                                                Billable
                                            </Badge>
                                        )}
                                    </div>
                                    {entry.description && (
                                        <p className="text-muted-foreground truncate text-sm">
                                            {entry.description}
                                        </p>
                                    )}
                                </div>
                                <div className="font-mono text-lg tabular-nums">
                                    {formatDuration(entry.duration_minutes)}
                                </div>
                                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="size-8"
                                    >
                                        <PencilIcon className="size-3.5" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive size-8"
                                        onClick={() => handleDelete(entry.id)}
                                    >
                                        <TrashIcon className="size-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
```

---

## 🧪 Testing

```php
// tests/Feature/TimeTrackingTest.php
<?php

use App\Enums\UserPlan;
use App\Models\Project;
use App\Models\Task;
use App\Models\TimeEntry;
use App\Models\User;
use App\Services\TimeTrackingService;

beforeEach(function () {
    $this->user = User::factory()->create(['plan' => UserPlan::Pro]);
    $this->project = Project::factory()->create(['user_id' => $this->user->id]);
});

it('allows Pro users to start timer', function () {
    $this->actingAs($this->user)
        ->post('/time-tracking/start', [
            'project_id' => $this->project->id,
            'description' => 'Working on feature',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('time_entries', [
        'user_id' => $this->user->id,
        'project_id' => $this->project->id,
        'is_running' => true,
    ]);
});

it('stops running timer before starting new one', function () {
    // Start first timer
    TimeEntry::factory()->create([
        'user_id' => $this->user->id,
        'project_id' => $this->project->id,
        'is_running' => true,
        'started_at' => now()->subMinutes(30),
    ]);

    // Start new timer
    $this->actingAs($this->user)
        ->post('/time-tracking/start', [
            'project_id' => $this->project->id,
        ]);

    // Should only have one running timer
    expect(TimeEntry::forUser($this->user->id)->running()->count())->toBe(1);
});

it('calculates duration when stopping timer', function () {
    $entry = TimeEntry::factory()->create([
        'user_id' => $this->user->id,
        'project_id' => $this->project->id,
        'is_running' => true,
        'started_at' => now()->subMinutes(45),
    ]);

    $this->actingAs($this->user)
        ->post('/time-tracking/stop');

    $entry->refresh();

    expect($entry->is_running)->toBeFalse();
    expect($entry->duration_minutes)->toBeGreaterThanOrEqual(44);
    expect($entry->duration_minutes)->toBeLessThanOrEqual(46);
});

it('allows manual time entry', function () {
    $this->actingAs($this->user)
        ->post('/time-tracking/entries', [
            'project_id' => $this->project->id,
            'date' => now()->format('Y-m-d'),
            'duration_minutes' => 120,
            'description' => 'Code review',
            'is_billable' => true,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('time_entries', [
        'user_id' => $this->user->id,
        'duration_minutes' => 120,
        'is_billable' => true,
    ]);
});

it('generates correct report', function () {
    TimeEntry::factory()->count(5)->create([
        'user_id' => $this->user->id,
        'project_id' => $this->project->id,
        'duration_minutes' => 60,
        'started_at' => now()->subDays(2),
    ]);

    $service = app(TimeTrackingService::class);
    $report = $service->getUserReport($this->user, now()->subWeek(), now());

    expect($report['total_minutes'])->toBe(300);
    expect($report['total_time'])->toBe('5:00');
});

it('prevents Free users from tracking time', function () {
    $user = User::factory()->create(['plan' => UserPlan::Free]);

    $this->actingAs($user)
        ->post('/time-tracking/start', [
            'project_id' => $this->project->id,
        ])
        ->assertRedirect()
        ->assertSessionHas('error');
});
```

---

## ✅ Checklist

- [ ] Create `time_entries` table migration
- [ ] Add `estimated_hours` to tasks table
- [ ] Create `TimeEntry` model
- [ ] Create `TimeEntryFactory`
- [ ] Add `canTrackTime()` to `UserPlan`
- [ ] Create `TimeTrackingService`
- [ ] Create `TimeEntryController`
- [ ] Create `TimeEntryPolicy`
- [ ] Register policy
- [ ] Add routes
- [ ] Create `Timer` component
- [ ] Create Time Tracking Index page
- [ ] Create `TimeEntryList` component
- [ ] Create `ManualEntryDialog` component
- [ ] Create `TimeReport` component
- [ ] Implement CSV export
- [ ] Add time tracking button to task detail
- [ ] Write tests

---

## 📚 References

- [Toggl Track](https://toggl.com/track/)
- [Clockify](https://clockify.me/)
- [Harvest Time Tracking](https://www.getharvest.com/)
- [Everhour](https://everhour.com/)
