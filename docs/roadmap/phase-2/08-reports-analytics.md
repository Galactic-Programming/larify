# 📊 Reports & Analytics

## Tổng quan

Dashboard với biểu đồ hiển thị productivity metrics, task completion rates, và team performance.

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | 🟡 Medium            |
| **Effort**       | 🟡 Medium (5-7 days) |
| **Plan**         | Pro Only             |
| **Dependencies** | Activity Tracking    |

---

## 📋 Requirements

### Functional Requirements

1. **Personal Dashboard**
    - Tasks completed over time (daily/weekly/monthly)
    - Tasks by status breakdown
    - Upcoming deadlines
    - Productivity trends

2. **Project Reports**
    - Task completion rate
    - Tasks by assignee
    - Tasks by label/category
    - Overdue task analysis
    - Burndown chart

3. **Team Reports** (if project has members)
    - Member contribution
    - Workload distribution
    - Collaboration metrics

4. **Export Options**
    - Export to CSV
    - Export to PDF (future)
    - Scheduled reports via email (future)

### Non-Functional Requirements

- Charts should load within 2 seconds
- Data should be cached for performance
- Support date range filtering

---

## 🗃️ Database Schema

Sử dụng bảng `activities` và `tasks` hiện có. Có thể tạo thêm bảng aggregation cho performance:

```php
// database/migrations/xxxx_create_daily_stats_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Aggregated daily statistics for faster queries
        Schema::create('daily_stats', function (Blueprint $table) {
            $table->id();
            $table->date('date');

            // Polymorphic for user or project
            $table->morphs('statsable');

            // Task stats
            $table->unsignedInteger('tasks_created')->default(0);
            $table->unsignedInteger('tasks_completed')->default(0);
            $table->unsignedInteger('tasks_overdue')->default(0);

            // Activity stats
            $table->unsignedInteger('activities_count')->default(0);

            $table->timestamps();

            $table->unique(['date', 'statsable_type', 'statsable_id']);
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_stats');
    }
};
```

---

## 🏗️ Implementation

### Step 1: Update UserPlan.php

```php
// app/Enums/UserPlan.php

/**
 * Check if this plan can view analytics.
 */
public function canViewAnalytics(): bool
{
    return $this === self::Pro;
}

/**
 * Get analytics data retention period in days.
 */
public function analyticsRetentionDays(): int
{
    return match ($this) {
        self::Free => 7,
        self::Pro => 365,
    };
}
```

### Step 2: Analytics Service

```php
// app/Services/AnalyticsService.php
<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Activity;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    private const CACHE_TTL = 300; // 5 minutes

    /**
     * Get personal analytics for a user.
     */
    public function getPersonalAnalytics(User $user, ?Carbon $startDate = null, ?Carbon $endDate = null): array
    {
        $startDate ??= now()->subDays(30);
        $endDate ??= now();

        $cacheKey = "analytics.user.{$user->id}.{$startDate->format('Y-m-d')}.{$endDate->format('Y-m-d')}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user, $startDate, $endDate) {
            return [
                'tasks_completed_over_time' => $this->getTasksCompletedOverTime($user, $startDate, $endDate),
                'tasks_by_status' => $this->getTasksByStatus($user),
                'tasks_by_priority' => $this->getTasksByPriority($user),
                'upcoming_deadlines' => $this->getUpcomingDeadlines($user),
                'productivity_score' => $this->calculateProductivityScore($user, $startDate, $endDate),
                'summary' => $this->getPersonalSummary($user, $startDate, $endDate),
            ];
        });
    }

    /**
     * Get project analytics.
     */
    public function getProjectAnalytics(Project $project, ?Carbon $startDate = null, ?Carbon $endDate = null): array
    {
        $startDate ??= now()->subDays(30);
        $endDate ??= now();

        $cacheKey = "analytics.project.{$project->id}.{$startDate->format('Y-m-d')}.{$endDate->format('Y-m-d')}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($project, $startDate, $endDate) {
            return [
                'completion_rate' => $this->getProjectCompletionRate($project),
                'tasks_by_status' => $this->getProjectTasksByStatus($project),
                'tasks_by_assignee' => $this->getTasksByAssignee($project),
                'tasks_by_label' => $this->getTasksByLabel($project),
                'burndown_chart' => $this->getBurndownChart($project, $startDate, $endDate),
                'overdue_analysis' => $this->getOverdueAnalysis($project),
                'activity_over_time' => $this->getActivityOverTime($project, $startDate, $endDate),
            ];
        });
    }

    private function getTasksCompletedOverTime(User $user, Carbon $startDate, Carbon $endDate): array
    {
        $tasks = Task::whereHas('project', fn ($q) => $q->where('user_id', $user->id))
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$startDate, $endDate])
            ->select(DB::raw('DATE(completed_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $period = CarbonPeriod::create($startDate, $endDate);
        $result = [];

        foreach ($period as $date) {
            $dateStr = $date->format('Y-m-d');
            $result[] = [
                'date' => $dateStr,
                'count' => $tasks[$dateStr]->count ?? 0,
            ];
        }

        return $result;
    }

    private function getTasksByStatus(User $user): array
    {
        return Task::whereHas('project', fn ($q) => $q->where('user_id', $user->id))
            ->select(
                DB::raw('CASE WHEN completed_at IS NOT NULL THEN "completed" ELSE "active" END as status'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();
    }

    private function getTasksByPriority(User $user): array
    {
        return Task::whereHas('project', fn ($q) => $q->where('user_id', $user->id))
            ->whereNull('completed_at')
            ->select('priority', DB::raw('COUNT(*) as count'))
            ->groupBy('priority')
            ->get()
            ->mapWithKeys(fn ($item) => [
                $this->priorityLabel($item->priority) => $item->count
            ])
            ->toArray();
    }

    private function priorityLabel(?int $priority): string
    {
        return match ($priority) {
            1 => 'Low',
            2 => 'Medium',
            3 => 'High',
            4 => 'Urgent',
            default => 'None',
        };
    }

    private function getUpcomingDeadlines(User $user): Collection
    {
        return Task::whereHas('project', fn ($q) => $q->where('user_id', $user->id))
            ->whereNull('completed_at')
            ->whereNotNull('due_date')
            ->where('due_date', '>=', now())
            ->where('due_date', '<=', now()->addDays(7))
            ->orderBy('due_date')
            ->limit(10)
            ->get(['id', 'title', 'due_date', 'project_id']);
    }

    private function calculateProductivityScore(User $user, Carbon $startDate, Carbon $endDate): int
    {
        $query = Task::whereHas('project', fn ($q) => $q->where('user_id', $user->id));

        $totalTasks = (clone $query)->whereBetween('created_at', [$startDate, $endDate])->count();
        $completedTasks = (clone $query)->whereNotNull('completed_at')
            ->whereBetween('completed_at', [$startDate, $endDate])->count();
        $onTimeTasks = (clone $query)->whereNotNull('completed_at')
            ->whereNotNull('due_date')
            ->whereColumn('completed_at', '<=', 'due_date')
            ->whereBetween('completed_at', [$startDate, $endDate])->count();

        if ($totalTasks === 0) return 0;

        $completionRate = $completedTasks / max($totalTasks, 1);
        $onTimeRate = $onTimeTasks / max($completedTasks, 1);

        return (int) round(($completionRate * 60) + ($onTimeRate * 40));
    }

    private function getPersonalSummary(User $user, Carbon $startDate, Carbon $endDate): array
    {
        $query = Task::whereHas('project', fn ($q) => $q->where('user_id', $user->id));

        return [
            'total_tasks' => (clone $query)->count(),
            'completed_tasks' => (clone $query)->whereNotNull('completed_at')->count(),
            'tasks_this_period' => (clone $query)->whereBetween('created_at', [$startDate, $endDate])->count(),
            'completed_this_period' => (clone $query)->whereNotNull('completed_at')
                ->whereBetween('completed_at', [$startDate, $endDate])->count(),
            'overdue_tasks' => (clone $query)->whereNull('completed_at')
                ->whereNotNull('due_date')
                ->where('due_date', '<', now())->count(),
        ];
    }

    private function getProjectCompletionRate(Project $project): float
    {
        $total = $project->tasks()->count();
        if ($total === 0) return 0;

        $completed = $project->tasks()->whereNotNull('completed_at')->count();

        return round(($completed / $total) * 100, 1);
    }

    private function getProjectTasksByStatus(Project $project): array
    {
        return $project->tasks()
            ->select(
                DB::raw('CASE WHEN completed_at IS NOT NULL THEN "completed" ELSE "active" END as status'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();
    }

    private function getTasksByAssignee(Project $project): array
    {
        return $project->tasks()
            ->with('assignee:id,name')
            ->select('assigned_to', DB::raw('COUNT(*) as count'))
            ->whereNotNull('assigned_to')
            ->groupBy('assigned_to')
            ->get()
            ->map(fn ($item) => [
                'name' => $item->assignee?->name ?? 'Unassigned',
                'count' => $item->count,
            ])
            ->toArray();
    }

    private function getTasksByLabel(Project $project): array
    {
        return DB::table('label_task')
            ->join('labels', 'labels.id', '=', 'label_task.label_id')
            ->join('tasks', 'tasks.id', '=', 'label_task.task_id')
            ->where('tasks.project_id', $project->id)
            ->select('labels.name', 'labels.color', DB::raw('COUNT(*) as count'))
            ->groupBy('labels.id', 'labels.name', 'labels.color')
            ->get()
            ->map(fn ($item) => [
                'name' => $item->name,
                'color' => $item->color,
                'count' => $item->count,
            ])
            ->toArray();
    }

    private function getBurndownChart(Project $project, Carbon $startDate, Carbon $endDate): array
    {
        $tasks = $project->tasks()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->orWhere(function ($q) use ($startDate, $endDate) {
                $q->whereNotNull('completed_at')
                    ->whereBetween('completed_at', [$startDate, $endDate]);
            })
            ->get();

        $period = CarbonPeriod::create($startDate, $endDate);
        $totalTasks = $tasks->where('created_at', '<=', $startDate)->count();
        $result = [];

        foreach ($period as $date) {
            $dateStr = $date->format('Y-m-d');

            // Tasks created on this day
            $created = $tasks->filter(fn ($t) => $t->created_at->format('Y-m-d') === $dateStr)->count();
            // Tasks completed on this day
            $completed = $tasks->filter(fn ($t) =>
                $t->completed_at && $t->completed_at->format('Y-m-d') === $dateStr
            )->count();

            $totalTasks = $totalTasks + $created - $completed;

            $result[] = [
                'date' => $dateStr,
                'remaining' => max(0, $totalTasks),
            ];
        }

        return $result;
    }

    private function getOverdueAnalysis(Project $project): array
    {
        $overdueTasks = $project->tasks()
            ->whereNull('completed_at')
            ->whereNotNull('due_date')
            ->where('due_date', '<', now())
            ->get();

        $byDaysOverdue = $overdueTasks->groupBy(function ($task) {
            $days = now()->diffInDays($task->due_date);
            if ($days <= 1) return '1 day';
            if ($days <= 3) return '2-3 days';
            if ($days <= 7) return '4-7 days';
            return '7+ days';
        })->map->count();

        return [
            'total' => $overdueTasks->count(),
            'by_duration' => $byDaysOverdue->toArray(),
        ];
    }

    private function getActivityOverTime(Project $project, Carbon $startDate, Carbon $endDate): array
    {
        $activities = Activity::where('project_id', $project->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $period = CarbonPeriod::create($startDate, $endDate);
        $result = [];

        foreach ($period as $date) {
            $dateStr = $date->format('Y-m-d');
            $result[] = [
                'date' => $dateStr,
                'count' => $activities[$dateStr]->count ?? 0,
            ];
        }

        return $result;
    }

    /**
     * Export data to CSV.
     */
    public function exportToCsv(array $data, string $filename): string
    {
        $path = storage_path("app/exports/{$filename}");

        $handle = fopen($path, 'w');

        // Headers
        fputcsv($handle, array_keys($data[0] ?? []));

        // Data rows
        foreach ($data as $row) {
            fputcsv($handle, $row);
        }

        fclose($handle);

        return $path;
    }
}
```

### Step 3: Controller

```php
// app/Http/Controllers/Analytics/AnalyticsController.php
<?php

namespace App\Http\Controllers\Analytics;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\AnalyticsService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function __construct(
        private AnalyticsService $analyticsService
    ) {}

    public function personal(Request $request)
    {
        if (!$request->user()->plan?->canViewAnalytics()) {
            return Inertia::render('Analytics/Upgrade', [
                'message' => 'Analytics require a Pro plan.',
            ]);
        }

        $startDate = $request->input('start_date')
            ? Carbon::parse($request->input('start_date'))
            : now()->subDays(30);
        $endDate = $request->input('end_date')
            ? Carbon::parse($request->input('end_date'))
            : now();

        // Respect retention limit
        $retentionDays = $request->user()->plan->analyticsRetentionDays();
        $minDate = now()->subDays($retentionDays);
        if ($startDate->lt($minDate)) {
            $startDate = $minDate;
        }

        $analytics = $this->analyticsService->getPersonalAnalytics(
            $request->user(),
            $startDate,
            $endDate
        );

        return Inertia::render('Analytics/Personal', [
            'analytics' => $analytics,
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'retention_days' => $retentionDays,
        ]);
    }

    public function project(Request $request, Project $project)
    {
        $this->authorize('view', $project);

        if (!$request->user()->plan?->canViewAnalytics()) {
            return response()->json(['message' => 'Pro plan required.'], 403);
        }

        $startDate = $request->input('start_date')
            ? Carbon::parse($request->input('start_date'))
            : now()->subDays(30);
        $endDate = $request->input('end_date')
            ? Carbon::parse($request->input('end_date'))
            : now();

        $analytics = $this->analyticsService->getProjectAnalytics(
            $project,
            $startDate,
            $endDate
        );

        return Inertia::render('Analytics/Project', [
            'project' => $project->only('id', 'name'),
            'analytics' => $analytics,
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
        ]);
    }

    public function export(Request $request)
    {
        if (!$request->user()->plan?->canViewAnalytics()) {
            abort(403);
        }

        $validated = $request->validate([
            'type' => ['required', 'in:personal,project'],
            'project_id' => ['required_if:type,project', 'exists:projects,id'],
            'format' => ['in:csv'],
        ]);

        // Generate and return export file
        // Implementation depends on your requirements
    }
}
```

---

## 🛣️ Routes

```php
// routes/web.php

use App\Http\Controllers\Analytics\AnalyticsController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('analytics')->group(function () {
        Route::get('/', [AnalyticsController::class, 'personal'])->name('analytics.personal');
        Route::get('/projects/{project}', [AnalyticsController::class, 'project'])->name('analytics.project');
        Route::post('/export', [AnalyticsController::class, 'export'])->name('analytics.export');
    });
});
```

---

## 🎨 Frontend Implementation

### Personal Analytics Dashboard

```tsx
// resources/js/pages/Analytics/Personal.tsx
import { Head } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from 'recharts';
import {
    TrendingUpIcon,
    CheckCircle2Icon,
    ClockIcon,
    AlertTriangleIcon,
} from 'lucide-react';

interface Analytics {
    tasks_completed_over_time: Array<{ date: string; count: number }>;
    tasks_by_status: Record<string, number>;
    tasks_by_priority: Record<string, number>;
    upcoming_deadlines: Array<{ id: number; title: string; due_date: string }>;
    productivity_score: number;
    summary: {
        total_tasks: number;
        completed_tasks: number;
        tasks_this_period: number;
        completed_this_period: number;
        overdue_tasks: number;
    };
}

interface Props {
    analytics: Analytics;
    filters: { start_date: string; end_date: string };
    retention_days: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function PersonalAnalytics({
    analytics,
    filters,
    retention_days,
}: Props) {
    const { summary, productivity_score, tasks_completed_over_time } =
        analytics;

    return (
        <AppLayout>
            <Head title="Analytics" />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Analytics</h1>
                        <p className="text-muted-foreground">
                            Track your productivity and task completion
                        </p>
                    </div>
                    <DateRangePicker
                        startDate={filters.start_date}
                        endDate={filters.end_date}
                        maxDays={retention_days}
                    />
                </div>

                {/* Summary Cards */}
                <div className="mb-8 grid gap-4 md:grid-cols-4">
                    <SummaryCard
                        title="Productivity Score"
                        value={`${productivity_score}%`}
                        icon={TrendingUpIcon}
                        color="text-green-500"
                    />
                    <SummaryCard
                        title="Tasks Completed"
                        value={summary.completed_this_period}
                        subtitle={`of ${summary.tasks_this_period} created`}
                        icon={CheckCircle2Icon}
                        color="text-blue-500"
                    />
                    <SummaryCard
                        title="Total Active"
                        value={summary.total_tasks - summary.completed_tasks}
                        icon={ClockIcon}
                        color="text-yellow-500"
                    />
                    <SummaryCard
                        title="Overdue"
                        value={summary.overdue_tasks}
                        icon={AlertTriangleIcon}
                        color="text-red-500"
                    />
                </div>

                {/* Charts */}
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Tasks Completed Over Time */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tasks Completed Over Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={tasks_completed_over_time}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(d) =>
                                                new Date(d).toLocaleDateString(
                                                    'en-US',
                                                    {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    },
                                                )
                                            }
                                        />
                                        <YAxis />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tasks by Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tasks by Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={Object.entries(
                                                analytics.tasks_by_status,
                                            ).map(([name, value]) => ({
                                                name:
                                                    name
                                                        .charAt(0)
                                                        .toUpperCase() +
                                                    name.slice(1),
                                                value,
                                            }))}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, value }) =>
                                                `${name}: ${value}`
                                            }
                                        >
                                            {Object.keys(
                                                analytics.tasks_by_status,
                                            ).map((_, index) => (
                                                <Cell
                                                    key={index}
                                                    fill={
                                                        COLORS[
                                                            index %
                                                                COLORS.length
                                                        ]
                                                    }
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tasks by Priority */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tasks by Priority</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={Object.entries(
                                            analytics.tasks_by_priority,
                                        ).map(([name, value]) => ({
                                            name,
                                            count: value,
                                        }))}
                                        layout="vertical"
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={80}
                                        />
                                        <Tooltip />
                                        <Bar
                                            dataKey="count"
                                            fill="#3b82f6"
                                            radius={[0, 4, 4, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Upcoming Deadlines */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming Deadlines</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analytics.upcoming_deadlines.length === 0 ? (
                                    <p className="text-muted-foreground py-8 text-center">
                                        No upcoming deadlines this week 🎉
                                    </p>
                                ) : (
                                    analytics.upcoming_deadlines.map((task) => (
                                        <div
                                            key={task.id}
                                            className="bg-muted/50 flex items-center justify-between rounded-lg p-3"
                                        >
                                            <span className="truncate font-medium">
                                                {task.title}
                                            </span>
                                            <span className="text-muted-foreground text-sm">
                                                {new Date(
                                                    task.due_date,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function SummaryCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-muted-foreground text-sm">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        {subtitle && (
                            <p className="text-muted-foreground text-xs">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <Icon className={`size-8 ${color}`} />
                </div>
            </CardContent>
        </Card>
    );
}
```

### Project Analytics Page

```tsx
// resources/js/pages/Analytics/Project.tsx
import { Head } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
} from 'recharts';

interface ProjectAnalytics {
    completion_rate: number;
    tasks_by_status: Record<string, number>;
    tasks_by_assignee: Array<{ name: string; count: number }>;
    tasks_by_label: Array<{ name: string; color: string; count: number }>;
    burndown_chart: Array<{ date: string; remaining: number }>;
    overdue_analysis: { total: number; by_duration: Record<string, number> };
    activity_over_time: Array<{ date: string; count: number }>;
}

interface Props {
    project: { id: number; name: string };
    analytics: ProjectAnalytics;
    filters: { start_date: string; end_date: string };
}

export default function ProjectAnalytics({
    project,
    analytics,
    filters,
}: Props) {
    return (
        <AppLayout>
            <Head title={`${project.name} Analytics`} />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold">
                        {project.name} Analytics
                    </h1>
                    <p className="text-muted-foreground">
                        Project performance and task insights
                    </p>
                </div>

                {/* Completion Rate */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Project Completion</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <Progress
                                value={analytics.completion_rate}
                                className="flex-1"
                            />
                            <span className="text-2xl font-bold">
                                {analytics.completion_rate}%
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Burndown Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Burndown Chart</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analytics.burndown_chart}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(d) =>
                                                new Date(d).toLocaleDateString(
                                                    'en-US',
                                                    {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    },
                                                )
                                            }
                                        />
                                        <YAxis />
                                        <Tooltip />
                                        <Line
                                            type="stepAfter"
                                            dataKey="remaining"
                                            stroke="#ef4444"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tasks by Assignee */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tasks by Team Member</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={analytics.tasks_by_assignee}
                                        layout="vertical"
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={100}
                                        />
                                        <Tooltip />
                                        <Bar
                                            dataKey="count"
                                            fill="#3b82f6"
                                            radius={[0, 4, 4, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activity Over Time */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Over Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={analytics.activity_over_time}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(d) =>
                                                new Date(d).toLocaleDateString(
                                                    'en-US',
                                                    {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    },
                                                )
                                            }
                                        />
                                        <YAxis />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tasks by Label */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Tasks by Label</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analytics.tasks_by_label.map((label) => (
                                    <div
                                        key={label.name}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="size-3 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        label.color,
                                                }}
                                            />
                                            <span>{label.name}</span>
                                        </div>
                                        <span className="font-medium">
                                            {label.count}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Overdue Analysis */}
                {analytics.overdue_analysis.total > 0 && (
                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle className="text-red-500">
                                Overdue Tasks (
                                {analytics.overdue_analysis.total})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4">
                                {Object.entries(
                                    analytics.overdue_analysis.by_duration,
                                ).map(([duration, count]) => (
                                    <div
                                        key={duration}
                                        className="rounded-lg bg-red-50 p-4 text-center dark:bg-red-950"
                                    >
                                        <p className="text-2xl font-bold text-red-500">
                                            {count}
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            {duration}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
```

---

## 🧪 Testing

```php
// tests/Feature/AnalyticsTest.php
<?php

use App\Enums\UserPlan;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Services\AnalyticsService;

beforeEach(function () {
    $this->user = User::factory()->create(['plan' => UserPlan::Pro]);
    $this->project = Project::factory()->create(['user_id' => $this->user->id]);
});

it('allows Pro users to view analytics', function () {
    $this->actingAs($this->user)
        ->get('/analytics')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Analytics/Personal'));
});

it('restricts Free users from analytics', function () {
    $user = User::factory()->create(['plan' => UserPlan::Free]);

    $this->actingAs($user)
        ->get('/analytics')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Analytics/Upgrade'));
});

it('calculates personal analytics correctly', function () {
    // Create completed tasks
    Task::factory()->count(5)->create([
        'project_id' => $this->project->id,
        'completed_at' => now()->subDays(2),
    ]);

    // Create active tasks
    Task::factory()->count(3)->create([
        'project_id' => $this->project->id,
        'completed_at' => null,
    ]);

    $service = app(AnalyticsService::class);
    $analytics = $service->getPersonalAnalytics($this->user);

    expect($analytics['summary']['completed_tasks'])->toBe(5);
    expect($analytics['summary']['total_tasks'])->toBe(8);
});

it('calculates project completion rate', function () {
    Task::factory()->count(3)->create([
        'project_id' => $this->project->id,
        'completed_at' => now(),
    ]);

    Task::factory()->count(7)->create([
        'project_id' => $this->project->id,
        'completed_at' => null,
    ]);

    $service = app(AnalyticsService::class);
    $analytics = $service->getProjectAnalytics($this->project);

    expect($analytics['completion_rate'])->toBe(30.0);
});

it('respects date range filters', function () {
    // Task completed within range
    Task::factory()->create([
        'project_id' => $this->project->id,
        'completed_at' => now()->subDays(5),
    ]);

    // Task completed outside range
    Task::factory()->create([
        'project_id' => $this->project->id,
        'completed_at' => now()->subDays(40),
    ]);

    $this->actingAs($this->user)
        ->get('/analytics?start_date=' . now()->subDays(30)->format('Y-m-d'))
        ->assertOk();
});
```

---

## ✅ Checklist

- [ ] Create `daily_stats` table migration (optional for caching)
- [ ] Add `canViewAnalytics()` to `UserPlan`
- [ ] Add `analyticsRetentionDays()` to `UserPlan`
- [ ] Create `AnalyticsService`
- [ ] Create `AnalyticsController`
- [ ] Add routes
- [ ] Install Recharts: `npm install recharts`
- [ ] Create Personal Analytics page
- [ ] Create Project Analytics page
- [ ] Create Upgrade page for Free users
- [ ] Create `DateRangePicker` component
- [ ] Add analytics link to sidebar navigation
- [ ] Write tests

---

## 📚 References

- [Recharts Documentation](https://recharts.org/en-US)
- [Asana Reports](https://asana.com/guide/help/premium/reporting)
- [Monday.com Dashboards](https://monday.com/features/dashboards)
- [Notion Analytics](https://www.notion.so/blog/database-analytics)
