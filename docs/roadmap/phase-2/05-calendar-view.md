# 📅 Calendar View

## Tổng quan

Hiển thị tasks theo dạng lịch để users có cái nhìn tổng quan về deadlines và workload.

| Attribute        | Value                |
| ---------------- | -------------------- |
| **Priority**     | 🟡 Medium            |
| **Effort**       | 🟡 Medium (5-7 days) |
| **Plan**         | Pro Only             |
| **Dependencies** | Không                |

---

## 📋 Requirements

### Functional Requirements

1. **Calendar Views**
    - Month view (default)
    - Week view
    - Day view (optional)

2. **Task Display**
    - Hiển thị tasks theo due_date
    - Color-coded theo priority/project
    - Show task title và indicators (overdue, completed)

3. **Interactions**
    - Click task để xem detail
    - Drag & drop để thay đổi due_date
    - Click date để tạo task mới

4. **Filters**
    - Filter theo project
    - Filter theo assignee
    - Show/hide completed tasks

### Plan Limits

| Feature       | Free | Pro |
| ------------- | ---- | --- |
| Calendar view | ❌   | ✅  |

---

## 🏗️ Implementation

### Step 1: Update UserPlan.php

```php
// app/Enums/UserPlan.php

/**
 * Check if this plan has calendar view.
 */
public function hasCalendarView(): bool
{
    return $this === self::Pro;
}

// Update getLimits()
public function getLimits(): array
{
    return [
        // ... existing limits
        'has_calendar_view' => $this->hasCalendarView(),
    ];
}
```

### Step 2: Create API Endpoint

```php
// app/Http/Controllers/Api/CalendarController.php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Check Pro plan
        if (!$user->plan?->hasCalendarView()) {
            return response()->json([
                'message' => 'Calendar view requires a Pro plan.',
            ], 403);
        }

        $validated = $request->validate([
            'start' => ['required', 'date'],
            'end' => ['required', 'date'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'show_completed' => ['nullable', 'boolean'],
        ]);

        $start = Carbon::parse($validated['start'])->startOfDay();
        $end = Carbon::parse($validated['end'])->endOfDay();

        // Get user's accessible projects
        $projectIds = $user->allProjects()->pluck('id');

        // Filter by specific project if provided
        if ($validated['project_id'] ?? null) {
            $projectIds = $projectIds->intersect([$validated['project_id']]);
        }

        $query = Task::whereIn('project_id', $projectIds)
            ->whereNotNull('due_date')
            ->whereBetween('due_date', [$start, $end])
            ->with(['project:id,name,color,icon', 'assignee:id,name,avatar']);

        // Filter completed tasks
        if (!($validated['show_completed'] ?? true)) {
            $query->whereNull('completed_at');
        }

        $tasks = $query->get()->map(fn ($task) => [
            'id' => $task->id,
            'title' => $task->title,
            'date' => $task->due_date->format('Y-m-d'),
            'time' => $task->due_time,
            'priority' => $task->priority?->value,
            'is_completed' => $task->completed_at !== null,
            'is_overdue' => $task->isOverdue(),
            'project' => [
                'id' => $task->project->id,
                'name' => $task->project->name,
                'color' => $task->project->color,
            ],
            'assignee' => $task->assignee ? [
                'id' => $task->assignee->id,
                'name' => $task->assignee->name,
                'avatar' => $task->assignee->avatar,
            ] : null,
        ]);

        return response()->json([
            'tasks' => $tasks,
            'range' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
            ],
        ]);
    }

    /**
     * Update task due date via drag & drop.
     */
    public function updateDate(Request $request, Task $task)
    {
        $this->authorize('update', $task->project);

        $validated = $request->validate([
            'due_date' => ['required', 'date'],
        ]);

        $task->update([
            'due_date' => $validated['due_date'],
        ]);

        return response()->json(['success' => true]);
    }
}
```

### Step 3: Routes

```php
// routes/web.php

Route::middleware(['auth', 'verified'])->group(function () {
    // Calendar page
    Route::get('calendar', [CalendarController::class, 'page'])
        ->name('calendar.index');
});

// routes/api.php
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('calendar', [CalendarController::class, 'index'])
        ->name('api.calendar.index');
    Route::patch('calendar/tasks/{task}', [CalendarController::class, 'updateDate'])
        ->name('api.calendar.update-date');
});
```

---

## 🎨 Frontend Implementation

### Calendar Page

```tsx
// resources/js/pages/calendar/index.tsx
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { CalendarView } from './components/calendar-view';
import { CalendarFilters } from './components/calendar-filters';
import { usePlanFeatures } from '@/hooks/use-plan-limits';
import { UpgradePromptDialog } from '@/components/plan/upgrade-prompt-dialog';

export default function CalendarPage() {
    const { hasCalendarView } = usePlanFeatures();

    if (!hasCalendarView) {
        return (
            <AppLayout>
                <Head title="Calendar" />
                <div className="flex h-full items-center justify-center">
                    <UpgradePromptDialog
                        feature="has_calendar_view"
                        open={true}
                        onOpenChange={() => {}}
                    />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Calendar" />
            <div className="flex h-full flex-col gap-4 p-4">
                <CalendarFilters />
                <CalendarView />
            </div>
        </AppLayout>
    );
}
```

### Calendar View Component

```tsx
// resources/js/pages/calendar/components/calendar-view.tsx
import { useState, useEffect } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isToday,
    isSameDay,
    addMonths,
    subMonths,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface CalendarTask {
    id: number;
    title: string;
    date: string;
    time: string | null;
    priority: 'low' | 'medium' | 'high' | null;
    is_completed: boolean;
    is_overdue: boolean;
    project: {
        id: number;
        name: string;
        color: string;
    };
}

export function CalendarView() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState<CalendarTask[]>([]);
    const [loading, setLoading] = useState(true);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    useEffect(() => {
        fetchTasks();
    }, [currentDate]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/calendar', {
                params: {
                    start: format(monthStart, 'yyyy-MM-dd'),
                    end: format(monthEnd, 'yyyy-MM-dd'),
                },
            });
            setTasks(response.data.tasks);
        } catch (error) {
            console.error('Failed to fetch calendar tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Pad start with empty cells for alignment
    const startPadding = monthStart.getDay();
    const paddedDays = [...Array(startPadding).fill(null), ...days];

    const getTasksForDate = (date: Date) => {
        return tasks.filter((task) => isSameDay(new Date(task.date), date));
    };

    return (
        <div className="flex flex-1 flex-col">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                    {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                            setCurrentDate(subMonths(currentDate, 1))
                        }
                    >
                        <ChevronLeftIcon className="size-4" />
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setCurrentDate(new Date())}
                    >
                        Today
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                            setCurrentDate(addMonths(currentDate, 1))
                        }
                    >
                        <ChevronRightIcon className="size-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid flex-1 grid-cols-7">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                    (day) => (
                        <div
                            key={day}
                            className="text-muted-foreground border-b p-2 text-center text-sm font-medium"
                        >
                            {day}
                        </div>
                    ),
                )}

                {/* Calendar days */}
                {paddedDays.map((day, index) => {
                    if (!day) {
                        return (
                            <div
                                key={`empty-${index}`}
                                className="border-b border-r p-1"
                            />
                        );
                    }

                    const dayTasks = getTasksForDate(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);

                    return (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                'min-h-[100px] border-b border-r p-1',
                                !isCurrentMonth && 'bg-muted/50',
                            )}
                        >
                            <div
                                className={cn(
                                    'mb-1 text-right text-sm font-medium',
                                    isToday(day) &&
                                        'bg-primary text-primary-foreground ml-auto flex h-6 w-6 items-center justify-center rounded-full',
                                )}
                            >
                                {format(day, 'd')}
                            </div>
                            <div className="space-y-1">
                                {dayTasks.slice(0, 3).map((task) => (
                                    <CalendarTaskItem
                                        key={task.id}
                                        task={task}
                                    />
                                ))}
                                {dayTasks.length > 3 && (
                                    <button className="text-muted-foreground text-xs hover:underline">
                                        +{dayTasks.length - 3} more
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function CalendarTaskItem({ task }: { task: CalendarTask }) {
    const priorityColors = {
        high: 'bg-red-500',
        medium: 'bg-yellow-500',
        low: 'bg-blue-500',
    };

    return (
        <button
            className={cn(
                'w-full truncate rounded p-1 text-left text-xs',
                task.is_completed && 'line-through opacity-60',
                task.is_overdue && !task.is_completed && 'text-red-600',
            )}
            style={{ backgroundColor: `${task.project.color}20` }}
        >
            <span
                className={cn(
                    'mr-1 inline-block h-1.5 w-1.5 rounded-full',
                    task.priority
                        ? priorityColors[task.priority]
                        : 'bg-gray-400',
                )}
            />
            {task.title}
        </button>
    );
}
```

### Calendar Filters

```tsx
// resources/js/pages/calendar/components/calendar-filters.tsx
import { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Project {
    id: number;
    name: string;
}

interface CalendarFiltersProps {
    projects: Project[];
    selectedProjectId: number | null;
    showCompleted: boolean;
    onProjectChange: (id: number | null) => void;
    onShowCompletedChange: (show: boolean) => void;
}

export function CalendarFilters({
    projects,
    selectedProjectId,
    showCompleted,
    onProjectChange,
    onShowCompletedChange,
}: CalendarFiltersProps) {
    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Label>Project:</Label>
                <Select
                    value={selectedProjectId?.toString() ?? 'all'}
                    onValueChange={(v) =>
                        onProjectChange(v === 'all' ? null : parseInt(v))
                    }
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="All projects" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All projects</SelectItem>
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
            </div>

            <div className="flex items-center gap-2">
                <Switch
                    id="show-completed"
                    checked={showCompleted}
                    onCheckedChange={onShowCompletedChange}
                />
                <Label htmlFor="show-completed">Show completed</Label>
            </div>
        </div>
    );
}
```

---

## 🧪 Testing

```php
// tests/Feature/CalendarTest.php
<?php

use App\Enums\UserPlan;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;

it('allows Pro users to access calendar', function () {
    $user = User::factory()->create(['plan' => UserPlan::Pro]);
    $project = Project::factory()->create(['user_id' => $user->id]);

    Task::factory()->create([
        'project_id' => $project->id,
        'due_date' => now()->addDays(5),
    ]);

    $this->actingAs($user)
        ->getJson('/api/calendar?start=' . now()->startOfMonth()->toDateString() . '&end=' . now()->endOfMonth()->toDateString())
        ->assertOk()
        ->assertJsonStructure(['tasks' => [['id', 'title', 'date']]]);
});

it('prevents Free users from accessing calendar', function () {
    $user = User::factory()->create(['plan' => UserPlan::Free]);

    $this->actingAs($user)
        ->getJson('/api/calendar?start=' . now()->startOfMonth()->toDateString() . '&end=' . now()->endOfMonth()->toDateString())
        ->assertForbidden();
});

it('filters tasks by project', function () {
    $user = User::factory()->create(['plan' => UserPlan::Pro]);
    $project1 = Project::factory()->create(['user_id' => $user->id]);
    $project2 = Project::factory()->create(['user_id' => $user->id]);

    Task::factory()->create(['project_id' => $project1->id, 'due_date' => now()]);
    Task::factory()->create(['project_id' => $project2->id, 'due_date' => now()]);

    $response = $this->actingAs($user)
        ->getJson('/api/calendar?start=' . now()->startOfMonth()->toDateString() . '&end=' . now()->endOfMonth()->toDateString() . '&project_id=' . $project1->id)
        ->assertOk();

    expect($response->json('tasks'))->toHaveCount(1);
});
```

---

## ✅ Checklist

- [ ] Add `hasCalendarView()` to `UserPlan` enum
- [ ] Create `CalendarController`
- [ ] Add routes (web + API)
- [ ] Create Calendar page
- [ ] Create `CalendarView` component
- [ ] Create `CalendarFilters` component
- [ ] Add drag-and-drop for rescheduling (optional)
- [ ] Add week view (optional)
- [ ] Add sidebar navigation link
- [ ] Write tests

---

## 📚 References

- [date-fns](https://date-fns.org/) - Date manipulation library
- [FullCalendar](https://fullcalendar.io/) - Full-featured calendar library (alternative)
- [react-big-calendar](https://jquense.github.io/react-big-calendar/) - React calendar component
- Bordio Calendar: [Bordio Calendar View](https://bordio.com/)
