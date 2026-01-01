# 🏷️ Labels/Tags for Tasks

## Tổng quan

Cho phép users gắn labels (tags) có màu sắc cho tasks để phân loại và filter dễ dàng hơn.

| Attribute        | Value                                  |
| ---------------- | -------------------------------------- |
| **Priority**     | 🟢 High                                |
| **Effort**       | 🟢 Low (2-3 days)                      |
| **Plan**         | Free: 3 labels/project, Pro: Unlimited |
| **Dependencies** | Không                                  |

---

## 📋 Requirements

### Functional Requirements

1. **Label Management (Project-level)**
    - Tạo labels với name + color
    - Edit/Delete labels
    - Labels thuộc về project (không global)

2. **Label Assignment**
    - Gắn nhiều labels cho 1 task
    - Gỡ label khỏi task
    - Hiển thị labels trên task card

3. **Filtering**
    - Filter tasks theo label
    - Kết hợp với filters khác (priority, assignee)

### Plan Limits

| Feature            | Free    | Pro        |
| ------------------ | ------- | ---------- |
| Labels per project | 3       | Unlimited  |
| Colors available   | 6 basic | 12+ colors |

---

## 🗃️ Database Schema

### Existing Tables (Đã có sẵn!)

```sql
-- Kiểm tra migrations có sẵn
-- Có thể cần update nếu chưa đủ fields

-- labels table
CREATE TABLE labels (
    id BIGINT PRIMARY KEY,
    project_id BIGINT,           -- Labels thuộc về project
    name VARCHAR(255),
    color VARCHAR(50),           -- Hex color hoặc preset name
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- label_task pivot table
CREATE TABLE label_task (
    id BIGINT PRIMARY KEY,
    label_id BIGINT,
    task_id BIGINT,
    created_at TIMESTAMP,
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    UNIQUE (label_id, task_id)
);
```

### Migration Updates (if needed)

```php
// database/migrations/xxxx_update_labels_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Thêm các fields nếu chưa có
        if (!Schema::hasColumn('labels', 'project_id')) {
            Schema::table('labels', function (Blueprint $table) {
                $table->foreignId('project_id')
                    ->after('id')
                    ->constrained()
                    ->cascadeOnDelete();
            });
        }

        if (!Schema::hasColumn('labels', 'color')) {
            Schema::table('labels', function (Blueprint $table) {
                $table->string('color', 50)->default('#6b7280')->after('name');
            });
        }

        // Add index for faster queries
        Schema::table('labels', function (Blueprint $table) {
            $table->index(['project_id', 'name']);
        });
    }
};
```

---

## 🏗️ Implementation

### Step 1: Update UserPlan.php

```php
// app/Enums/UserPlan.php

/**
 * Get maximum number of labels per project.
 */
public function maxLabelsPerProject(): ?int
{
    return match ($this) {
        self::Free => 3,
        self::Pro => null, // Unlimited
    };
}

// Update getLimits() method
public function getLimits(): array
{
    return [
        // ... existing limits
        'max_labels_per_project' => $this->maxLabelsPerProject(),
    ];
}
```

### Step 2: Create/Update Model

```php
// app/Models/Label.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Label extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'color',
    ];

    /**
     * Available colors for labels.
     */
    public const COLORS = [
        // Basic (Free plan)
        'gray' => '#6b7280',
        'red' => '#ef4444',
        'yellow' => '#f59e0b',
        'green' => '#22c55e',
        'blue' => '#3b82f6',
        'purple' => '#8b5cf6',

        // Extended (Pro plan)
        'pink' => '#ec4899',
        'indigo' => '#6366f1',
        'cyan' => '#06b6d4',
        'teal' => '#14b8a6',
        'orange' => '#f97316',
        'lime' => '#84cc16',
    ];

    public const FREE_COLORS = ['gray', 'red', 'yellow', 'green', 'blue', 'purple'];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'label_task')
            ->withTimestamps();
    }
}
```

### Step 3: Update Task Model

```php
// app/Models/Task.php

// Add relationship
public function labels(): BelongsToMany
{
    return $this->belongsToMany(Label::class, 'label_task')
        ->withTimestamps();
}
```

### Step 4: Create Controller

```php
// app/Http/Controllers/Projects/LabelController.php
<?php

namespace App\Http\Controllers\Projects;

use App\Http\Controllers\Controller;
use App\Models\Label;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class LabelController extends Controller
{
    public function index(Project $project)
    {
        $this->authorize('view', $project);

        return response()->json([
            'labels' => $project->labels()->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50'],
            'color' => ['required', 'string', 'max:50'],
        ]);

        // Check plan limit
        $user = $request->user();
        $maxLabels = $user->plan?->maxLabelsPerProject();

        if ($maxLabels !== null && $project->labels()->count() >= $maxLabels) {
            throw ValidationException::withMessages([
                'name' => "You've reached the limit of {$maxLabels} labels. Upgrade to Pro for unlimited labels.",
            ]);
        }

        // Check color availability for Free plan
        if ($user->plan === \App\Enums\UserPlan::Free) {
            if (!in_array($validated['color'], Label::FREE_COLORS) &&
                !in_array($validated['color'], array_values(array_intersect_key(Label::COLORS, array_flip(Label::FREE_COLORS))))) {
                throw ValidationException::withMessages([
                    'color' => 'This color is only available for Pro users.',
                ]);
            }
        }

        $label = $project->labels()->create($validated);

        return response()->json(['label' => $label], 201);
    }

    public function update(Request $request, Project $project, Label $label)
    {
        $this->authorize('update', $project);

        abort_if($label->project_id !== $project->id, 404);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:50'],
            'color' => ['sometimes', 'string', 'max:50'],
        ]);

        $label->update($validated);

        return response()->json(['label' => $label]);
    }

    public function destroy(Project $project, Label $label)
    {
        $this->authorize('update', $project);

        abort_if($label->project_id !== $project->id, 404);

        $label->delete();

        return response()->json(['message' => 'Label deleted']);
    }
}
```

### Step 5: Task Label Assignment

```php
// app/Http/Controllers/Tasks/TaskLabelController.php
<?php

namespace App\Http\Controllers\Tasks;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskLabelController extends Controller
{
    public function sync(Request $request, Project $project, Task $task)
    {
        $this->authorize('update', $project);

        abort_if($task->project_id !== $project->id, 404);

        $validated = $request->validate([
            'label_ids' => ['required', 'array'],
            'label_ids.*' => ['exists:labels,id'],
        ]);

        // Verify all labels belong to this project
        $validLabelIds = $project->labels()
            ->whereIn('id', $validated['label_ids'])
            ->pluck('id');

        $task->labels()->sync($validLabelIds);

        return response()->json([
            'labels' => $task->labels()->get(),
        ]);
    }

    public function attach(Request $request, Project $project, Task $task)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'label_id' => ['required', 'exists:labels,id'],
        ]);

        $label = $project->labels()->findOrFail($validated['label_id']);

        $task->labels()->syncWithoutDetaching([$label->id]);

        return response()->json(['success' => true]);
    }

    public function detach(Request $request, Project $project, Task $task)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'label_id' => ['required', 'exists:labels,id'],
        ]);

        $task->labels()->detach($validated['label_id']);

        return response()->json(['success' => true]);
    }
}
```

### Step 6: Routes

```php
// routes/web.php

Route::middleware(['auth', 'verified'])->group(function () {
    // Project labels
    Route::get('projects/{project}/labels', [LabelController::class, 'index'])
        ->name('projects.labels.index');
    Route::post('projects/{project}/labels', [LabelController::class, 'store'])
        ->name('projects.labels.store');
    Route::patch('projects/{project}/labels/{label}', [LabelController::class, 'update'])
        ->name('projects.labels.update');
    Route::delete('projects/{project}/labels/{label}', [LabelController::class, 'destroy'])
        ->name('projects.labels.destroy');

    // Task labels
    Route::post('projects/{project}/tasks/{task}/labels', [TaskLabelController::class, 'sync'])
        ->name('projects.tasks.labels.sync');
    Route::post('projects/{project}/tasks/{task}/labels/attach', [TaskLabelController::class, 'attach'])
        ->name('projects.tasks.labels.attach');
    Route::post('projects/{project}/tasks/{task}/labels/detach', [TaskLabelController::class, 'detach'])
        ->name('projects.tasks.labels.detach');
});
```

---

## 🎨 Frontend Implementation

### Label Badge Component

```tsx
// resources/js/components/labels/label-badge.tsx
import { cn } from '@/lib/utils';

interface LabelBadgeProps {
    name: string;
    color: string;
    size?: 'sm' | 'md';
    onRemove?: () => void;
}

export function LabelBadge({
    name,
    color,
    size = 'sm',
    onRemove,
}: LabelBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full font-medium',
                size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
            )}
            style={{
                backgroundColor: `${color}20`, // 20% opacity
                color: color,
                border: `1px solid ${color}40`,
            }}
        >
            {name}
            {onRemove && (
                <button
                    onClick={onRemove}
                    className="rounded-full p-0.5 hover:bg-black/10"
                >
                    <XIcon className="size-3" />
                </button>
            )}
        </span>
    );
}
```

### Label Selector Component

```tsx
// resources/js/components/labels/label-selector.tsx
import { useState } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePlanFeatures } from '@/hooks/use-plan-limits';
import { TagIcon, PlusIcon, CheckIcon } from 'lucide-react';

interface Label {
    id: number;
    name: string;
    color: string;
}

interface LabelSelectorProps {
    projectId: number;
    availableLabels: Label[];
    selectedLabelIds: number[];
    onToggle: (labelId: number) => void;
    onCreate: (name: string, color: string) => void;
}

const COLORS = [
    { name: 'gray', hex: '#6b7280', proOnly: false },
    { name: 'red', hex: '#ef4444', proOnly: false },
    { name: 'yellow', hex: '#f59e0b', proOnly: false },
    { name: 'green', hex: '#22c55e', proOnly: false },
    { name: 'blue', hex: '#3b82f6', proOnly: false },
    { name: 'purple', hex: '#8b5cf6', proOnly: false },
    { name: 'pink', hex: '#ec4899', proOnly: true },
    { name: 'indigo', hex: '#6366f1', proOnly: true },
    { name: 'cyan', hex: '#06b6d4', proOnly: true },
    { name: 'teal', hex: '#14b8a6', proOnly: true },
    { name: 'orange', hex: '#f97316', proOnly: true },
    { name: 'lime', hex: '#84cc16', proOnly: true },
];

export function LabelSelector({
    availableLabels,
    selectedLabelIds,
    onToggle,
    onCreate,
}: LabelSelectorProps) {
    const { isPro, maxLabelsPerProject } = usePlanFeatures();
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#6b7280');

    const canCreateMore =
        isPro || availableLabels.length < (maxLabelsPerProject ?? 3);
    const availableColors = isPro ? COLORS : COLORS.filter((c) => !c.proOnly);

    const handleCreate = () => {
        if (newName.trim()) {
            onCreate(newName.trim(), newColor);
            setNewName('');
            setIsCreating(false);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm">
                    <TagIcon className="mr-1 size-4" />
                    Labels
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2" align="start">
                {/* Existing labels */}
                <div className="mb-2 space-y-1">
                    {availableLabels.map((label) => (
                        <button
                            key={label.id}
                            onClick={() => onToggle(label.id)}
                            className="hover:bg-muted flex w-full items-center gap-2 rounded px-2 py-1.5"
                        >
                            <span
                                className="size-3 rounded-full"
                                style={{ backgroundColor: label.color }}
                            />
                            <span className="flex-1 text-left text-sm">
                                {label.name}
                            </span>
                            {selectedLabelIds.includes(label.id) && (
                                <CheckIcon className="text-primary size-4" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Create new label */}
                {isCreating ? (
                    <div className="space-y-2 border-t pt-2">
                        <Input
                            placeholder="Label name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex flex-wrap gap-1">
                            {availableColors.map((color) => (
                                <button
                                    key={color.name}
                                    onClick={() => setNewColor(color.hex)}
                                    className={cn(
                                        'size-6 rounded-full border-2',
                                        newColor === color.hex
                                            ? 'border-foreground'
                                            : 'border-transparent',
                                    )}
                                    style={{ backgroundColor: color.hex }}
                                />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleCreate}>
                                Create
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsCreating(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    canCreateMore && (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="hover:bg-muted text-muted-foreground flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm"
                        >
                            <PlusIcon className="size-4" />
                            Create new label
                        </button>
                    )
                )}

                {!canCreateMore && !isPro && (
                    <p className="text-muted-foreground border-t pt-2 text-xs">
                        Upgrade to Pro for unlimited labels
                    </p>
                )}
            </PopoverContent>
        </Popover>
    );
}
```

### Display Labels on Task Card

```tsx
// Update resources/js/pages/projects/lists/tasks/components/task-card.tsx

import { LabelBadge } from '@/components/labels/label-badge';

function TaskCard({ task, ...props }) {
    return (
        <div className="...">
            {/* Labels row */}
            {task.labels && task.labels.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                    {task.labels.map((label) => (
                        <LabelBadge
                            key={label.id}
                            name={label.name}
                            color={label.color}
                        />
                    ))}
                </div>
            )}

            {/* Rest of task card content */}
        </div>
    );
}
```

---

## 🧪 Testing

```php
// tests/Feature/LabelTest.php
<?php

use App\Enums\UserPlan;
use App\Models\Label;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['plan' => UserPlan::Pro]);
    $this->project = Project::factory()->create(['user_id' => $this->user->id]);
});

it('can create a label for a project', function () {
    $this->actingAs($this->user)
        ->postJson("/projects/{$this->project->id}/labels", [
            'name' => 'Bug',
            'color' => '#ef4444',
        ])
        ->assertCreated()
        ->assertJsonPath('label.name', 'Bug');

    expect($this->project->labels()->count())->toBe(1);
});

it('limits labels for Free users', function () {
    $user = User::factory()->create(['plan' => UserPlan::Free]);
    $project = Project::factory()->create(['user_id' => $user->id]);

    // Create 3 labels (limit)
    Label::factory()->count(3)->create(['project_id' => $project->id]);

    $this->actingAs($user)
        ->postJson("/projects/{$project->id}/labels", [
            'name' => 'Fourth Label',
            'color' => '#ef4444',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('can attach labels to a task', function () {
    $label = Label::factory()->create(['project_id' => $this->project->id]);
    $task = Task::factory()->create(['project_id' => $this->project->id]);

    $this->actingAs($this->user)
        ->postJson("/projects/{$this->project->id}/tasks/{$task->id}/labels", [
            'label_ids' => [$label->id],
        ])
        ->assertOk();

    expect($task->fresh()->labels)->toHaveCount(1);
});

it('can filter tasks by label', function () {
    $label = Label::factory()->create(['project_id' => $this->project->id]);
    $taskWithLabel = Task::factory()->create(['project_id' => $this->project->id]);
    $taskWithoutLabel = Task::factory()->create(['project_id' => $this->project->id]);

    $taskWithLabel->labels()->attach($label->id);

    // Assuming there's a filter endpoint
    $this->actingAs($this->user)
        ->getJson("/projects/{$this->project->id}?label_id={$label->id}")
        ->assertOk();
});
```

---

## ✅ Checklist

- [ ] Verify/update `labels` table migration
- [ ] Verify/update `label_task` pivot table migration
- [ ] Create `Label` model
- [ ] Update `Task` model with labels relationship
- [ ] Update `Project` model with labels relationship
- [ ] Add `maxLabelsPerProject()` to `UserPlan` enum
- [ ] Create `LabelController`
- [ ] Create `TaskLabelController`
- [ ] Add routes
- [ ] Create `LabelBadge` component
- [ ] Create `LabelSelector` component
- [ ] Update task card to show labels
- [ ] Update task detail sheet to manage labels
- [ ] Add label filter to project board
- [ ] Write tests
- [ ] Create `LabelFactory` for testing

---

## 📚 References

- Trello Labels: [Trello Labels](https://support.atlassian.com/trello/docs/adding-labels-to-cards/)
- GitHub Labels: [GitHub Labels](https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels)
