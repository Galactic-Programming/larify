# 📋 Task Templates

## Tổng quan

Tạo và sử dụng templates cho các tasks thường xuyên lặp lại.

| Attribute        | Value                    |
| ---------------- | ------------------------ |
| **Priority**     | 🟡 Medium                |
| **Effort**       | 🟢 Low-Medium (3-5 days) |
| **Plan**         | Pro Only                 |
| **Dependencies** | Labels, Comments         |

---

## 📋 Requirements

### Functional Requirements

1. **Template Creation**
    - Save existing task as template
    - Create template from scratch
    - Include: title, description, checklist, labels, assignees

2. **Template Organization**
    - Personal templates (user-only)
    - Project templates (shared within project)
    - Team templates (across all projects - future)
    - Categories/folders for templates

3. **Template Usage**
    - Quick-create task from template
    - Customize before creating
    - Bulk create from template

4. **Template Management**
    - Edit templates
    - Duplicate templates
    - Delete templates
    - Import/export templates (JSON)

---

## 🗃️ Database Schema

```php
// database/migrations/xxxx_create_task_templates_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();

            // Ownership - either personal or project-scoped
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->cascadeOnDelete();

            // Template data
            $table->string('default_title');
            $table->text('default_description')->nullable();
            $table->json('checklist_items')->nullable(); // Array of checklist strings
            $table->json('default_labels')->nullable(); // Array of label IDs
            $table->unsignedInteger('default_priority')->nullable();
            $table->unsignedInteger('due_days_offset')->nullable(); // Days from creation

            // Organization
            $table->string('category')->nullable();
            $table->unsignedInteger('usage_count')->default(0);
            $table->timestamp('last_used_at')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'project_id']);
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_templates');
    }
};
```

---

## 🏗️ Implementation

### Step 1: Update UserPlan.php

```php
// app/Enums/UserPlan.php

/**
 * Check if this plan can create task templates.
 */
public function canCreateTaskTemplates(): bool
{
    return $this === self::Pro;
}

/**
 * Get maximum number of templates allowed.
 */
public function maxTaskTemplates(): int
{
    return match ($this) {
        self::Free => 3,
        self::Pro => -1, // Unlimited
    };
}
```

### Step 2: Create Model

```php
// app/Models/TaskTemplate.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class TaskTemplate extends Model
{
    protected $fillable = [
        'name',
        'description',
        'user_id',
        'project_id',
        'default_title',
        'default_description',
        'checklist_items',
        'default_labels',
        'default_priority',
        'due_days_offset',
        'category',
        'usage_count',
        'last_used_at',
    ];

    protected function casts(): array
    {
        return [
            'checklist_items' => 'array',
            'default_labels' => 'array',
            'last_used_at' => 'datetime',
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
    public function scopePersonal(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId)->whereNull('project_id');
    }

    public function scopeForProject(Builder $query, int $projectId): Builder
    {
        return $query->where('project_id', $projectId);
    }

    public function scopeAccessibleBy(Builder $query, User $user, ?int $projectId = null): Builder
    {
        return $query->where(function ($q) use ($user, $projectId) {
            // Personal templates
            $q->where('user_id', $user->id)->whereNull('project_id');

            // Project templates if project specified
            if ($projectId) {
                $q->orWhere('project_id', $projectId);
            }
        });
    }

    /**
     * Create a task from this template.
     */
    public function createTask(TaskList $list, array $overrides = []): Task
    {
        $task = Task::create([
            'title' => $overrides['title'] ?? $this->default_title,
            'description' => $overrides['description'] ?? $this->default_description,
            'task_list_id' => $list->id,
            'project_id' => $list->project_id,
            'user_id' => auth()->id(),
            'priority' => $overrides['priority'] ?? $this->default_priority,
            'due_date' => $this->due_days_offset
                ? now()->addDays($this->due_days_offset)
                : ($overrides['due_date'] ?? null),
            'position' => $list->tasks()->max('position') + 1,
        ]);

        // Attach labels
        if (!empty($this->default_labels)) {
            $task->labels()->sync($this->default_labels);
        }

        // Create checklist items (if you have a checklist feature)
        // foreach ($this->checklist_items ?? [] as $item) {
        //     $task->checklistItems()->create(['content' => $item]);
        // }

        // Update usage stats
        $this->increment('usage_count');
        $this->update(['last_used_at' => now()]);

        return $task;
    }

    /**
     * Create template from existing task.
     */
    public static function createFromTask(Task $task, array $data = []): self
    {
        return self::create([
            'name' => $data['name'] ?? $task->title,
            'description' => $data['description'] ?? null,
            'user_id' => auth()->id(),
            'project_id' => $data['project_id'] ?? null,
            'default_title' => $task->title,
            'default_description' => $task->description,
            'default_labels' => $task->labels->pluck('id')->toArray(),
            'default_priority' => $task->priority,
            'category' => $data['category'] ?? null,
        ]);
    }
}
```

### Step 3: Controller

```php
// app/Http/Controllers/Tasks/TaskTemplateController.php
<?php

namespace App\Http\Controllers\Tasks;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskList;
use App\Models\TaskTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaskTemplateController extends Controller
{
    public function index(Request $request)
    {
        $templates = TaskTemplate::accessibleBy($request->user())
            ->orderBy('usage_count', 'desc')
            ->get()
            ->groupBy('category');

        return Inertia::render('Templates/Index', [
            'templates' => $templates,
        ]);
    }

    public function store(Request $request)
    {
        // Check Pro plan
        if (!$request->user()->plan?->canCreateTaskTemplates()) {
            return back()->with('error', 'Task templates require a Pro plan.');
        }

        // Check template limit
        $currentCount = TaskTemplate::where('user_id', $request->user()->id)->count();
        $maxTemplates = $request->user()->plan->maxTaskTemplates();

        if ($maxTemplates !== -1 && $currentCount >= $maxTemplates) {
            return back()->with('error', 'Template limit reached.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'default_title' => ['required', 'string', 'max:255'],
            'default_description' => ['nullable', 'string'],
            'checklist_items' => ['nullable', 'array'],
            'checklist_items.*' => ['string', 'max:255'],
            'default_labels' => ['nullable', 'array'],
            'default_labels.*' => ['exists:labels,id'],
            'default_priority' => ['nullable', 'integer', 'min:0', 'max:4'],
            'due_days_offset' => ['nullable', 'integer', 'min:0', 'max:365'],
            'category' => ['nullable', 'string', 'max:50'],
        ]);

        // Verify project access
        if (isset($validated['project_id'])) {
            $project = Project::findOrFail($validated['project_id']);
            $this->authorize('update', $project);
        }

        $template = TaskTemplate::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        return back()->with('success', 'Template created successfully.');
    }

    public function storeFromTask(Request $request, Task $task)
    {
        $this->authorize('view', $task->project);

        if (!$request->user()->plan?->canCreateTaskTemplates()) {
            return back()->with('error', 'Task templates require a Pro plan.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'category' => ['nullable', 'string', 'max:50'],
        ]);

        $template = TaskTemplate::createFromTask($task, $validated);

        return back()->with('success', 'Template created from task.');
    }

    public function update(Request $request, TaskTemplate $template)
    {
        $this->authorize('update', $template);

        $validated = $request->validate([
            'name' => ['string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'default_title' => ['string', 'max:255'],
            'default_description' => ['nullable', 'string'],
            'checklist_items' => ['nullable', 'array'],
            'default_labels' => ['nullable', 'array'],
            'default_priority' => ['nullable', 'integer', 'min:0', 'max:4'],
            'due_days_offset' => ['nullable', 'integer', 'min:0', 'max:365'],
            'category' => ['nullable', 'string', 'max:50'],
        ]);

        $template->update($validated);

        return back()->with('success', 'Template updated.');
    }

    public function destroy(TaskTemplate $template)
    {
        $this->authorize('delete', $template);

        $template->delete();

        return back()->with('success', 'Template deleted.');
    }

    /**
     * Create task from template.
     */
    public function createTask(Request $request, TaskTemplate $template)
    {
        $validated = $request->validate([
            'task_list_id' => ['required', 'exists:task_lists,id'],
            'title' => ['nullable', 'string', 'max:255'],
            'due_date' => ['nullable', 'date'],
        ]);

        $list = TaskList::findOrFail($validated['task_list_id']);
        $this->authorize('update', $list->project);

        $task = $template->createTask($list, $validated);

        return back()->with('success', 'Task created from template.');
    }
}
```

### Step 4: Policy

```php
// app/Policies/TaskTemplatePolicy.php
<?php

namespace App\Policies;

use App\Models\TaskTemplate;
use App\Models\User;

class TaskTemplatePolicy
{
    public function view(User $user, TaskTemplate $template): bool
    {
        // Personal templates
        if ($template->user_id === $user->id && !$template->project_id) {
            return true;
        }

        // Project templates - must be project member
        if ($template->project_id) {
            return $template->project->members->contains($user->id)
                || $template->project->user_id === $user->id;
        }

        return false;
    }

    public function update(User $user, TaskTemplate $template): bool
    {
        return $template->user_id === $user->id;
    }

    public function delete(User $user, TaskTemplate $template): bool
    {
        return $template->user_id === $user->id;
    }
}
```

---

## 🛣️ Routes

```php
// routes/web.php

use App\Http\Controllers\Tasks\TaskTemplateController;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('templates')->group(function () {
        Route::get('/', [TaskTemplateController::class, 'index'])->name('templates.index');
        Route::post('/', [TaskTemplateController::class, 'store'])->name('templates.store');
        Route::post('/from-task/{task}', [TaskTemplateController::class, 'storeFromTask'])->name('templates.from-task');
        Route::put('/{template}', [TaskTemplateController::class, 'update'])->name('templates.update');
        Route::delete('/{template}', [TaskTemplateController::class, 'destroy'])->name('templates.destroy');
        Route::post('/{template}/create-task', [TaskTemplateController::class, 'createTask'])->name('templates.create-task');
    });
});
```

---

## 🎨 Frontend Implementation

### Templates Page

```tsx
// resources/js/pages/Templates/Index.tsx
import { Head, router } from '@inertiajs/react';
import { AppLayout } from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, CopyIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Template {
    id: number;
    name: string;
    description: string | null;
    default_title: string;
    category: string | null;
    usage_count: number;
    last_used_at: string | null;
    project_id: number | null;
}

interface Props {
    templates: Record<string, Template[]>;
}

export default function TemplatesIndex({ templates }: Props) {
    const categories = Object.keys(templates);
    const uncategorized =
        templates[''] || templates[null as unknown as string] || [];
    const categorizedTemplates = categories.filter((c) => c && c !== 'null');

    return (
        <AppLayout>
            <Head title="Task Templates" />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Task Templates</h1>
                        <p className="text-muted-foreground">
                            Save time by creating reusable task templates
                        </p>
                    </div>
                    <Button>
                        <PlusIcon className="mr-2 size-4" />
                        New Template
                    </Button>
                </div>

                {/* Uncategorized templates */}
                {uncategorized.length > 0 && (
                    <TemplateSection
                        title="All Templates"
                        templates={uncategorized}
                    />
                )}

                {/* Categorized templates */}
                {categorizedTemplates.map((category) => (
                    <TemplateSection
                        key={category}
                        title={category}
                        templates={templates[category]}
                    />
                ))}

                {Object.keys(templates).length === 0 && (
                    <div className="py-12 text-center">
                        <p className="text-muted-foreground mb-4">
                            No templates yet. Create one to get started!
                        </p>
                        <Button>Create Template</Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function TemplateSection({
    title,
    templates,
}: {
    title: string;
    templates: Template[];
}) {
    return (
        <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold">{title}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                ))}
            </div>
        </div>
    );
}

function TemplateCard({ template }: { template: Template }) {
    return (
        <Card className="group transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button size="icon" variant="ghost" className="size-8">
                            <CopyIcon className="size-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="size-8">
                            <PencilIcon className="size-3.5" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive size-8"
                        >
                            <TrashIcon className="size-3.5" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">
                    {template.description || template.default_title}
                </p>
                <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <span>Used {template.usage_count} times</span>
                    {template.last_used_at && (
                        <span>
                            Last used{' '}
                            {formatDistanceToNow(
                                new Date(template.last_used_at),
                            )}{' '}
                            ago
                        </span>
                    )}
                </div>
                {template.project_id && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                        Project Template
                    </Badge>
                )}
            </CardContent>
        </Card>
    );
}
```

### Save as Template Button

```tsx
// resources/js/components/tasks/save-as-template-button.tsx
import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BookmarkIcon } from 'lucide-react';

interface Props {
    taskId: number;
    taskTitle: string;
}

export function SaveAsTemplateButton({ taskId, taskTitle }: Props) {
    const [open, setOpen] = useState(false);

    const { data, setData, post, processing } = useForm({
        name: taskTitle,
        description: '',
        category: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/templates/from-task/${taskId}`, {
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
                <BookmarkIcon className="mr-2 size-4" />
                Save as Template
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save as Template</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Template Name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="Template name"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Description (optional)
                            </Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                placeholder="What is this template for?"
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">
                                Category (optional)
                            </Label>
                            <Input
                                id="category"
                                value={data.category}
                                onChange={(e) =>
                                    setData('category', e.target.value)
                                }
                                placeholder="e.g., Marketing, Development"
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Save Template
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
```

### Template Picker

```tsx
// resources/js/components/tasks/template-picker.tsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { FileTextIcon, ChevronDownIcon } from 'lucide-react';

interface Template {
    id: number;
    name: string;
    default_title: string;
    category: string | null;
}

interface Props {
    templates: Template[];
    taskListId: number;
}

export function TemplatePicker({ templates, taskListId }: Props) {
    const [open, setOpen] = useState(false);

    const handleSelect = (template: Template) => {
        router.post(`/templates/${template.id}/create-task`, {
            task_list_id: taskListId,
        });
        setOpen(false);
    };

    const grouped = templates.reduce(
        (acc, template) => {
            const category = template.category || 'Uncategorized';
            if (!acc[category]) acc[category] = [];
            acc[category].push(template);
            return acc;
        },
        {} as Record<string, Template[]>,
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                    <FileTextIcon className="mr-2 size-4" />
                    From Template
                    <ChevronDownIcon className="ml-2 size-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search templates..." />
                    <CommandList>
                        <CommandEmpty>No templates found.</CommandEmpty>
                        {Object.entries(grouped).map(([category, items]) => (
                            <CommandGroup key={category} heading={category}>
                                {items.map((template) => (
                                    <CommandItem
                                        key={template.id}
                                        onSelect={() => handleSelect(template)}
                                    >
                                        <FileTextIcon className="text-muted-foreground mr-2 size-4" />
                                        {template.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
```

---

## 🧪 Testing

```php
// tests/Feature/TaskTemplateTest.php
<?php

use App\Enums\UserPlan;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskList;
use App\Models\TaskTemplate;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['plan' => UserPlan::Pro]);
    $this->project = Project::factory()->create(['user_id' => $this->user->id]);
});

it('allows Pro users to create templates', function () {
    $this->actingAs($this->user)
        ->post('/templates', [
            'name' => 'Bug Report',
            'default_title' => 'Bug: [Description]',
            'default_description' => 'Steps to reproduce:\n1.\n2.\n3.',
            'category' => 'Development',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('task_templates', [
        'name' => 'Bug Report',
        'user_id' => $this->user->id,
    ]);
});

it('can create template from existing task', function () {
    $task = Task::factory()->create([
        'project_id' => $this->project->id,
        'title' => 'Weekly Review',
        'description' => 'Review weekly progress',
    ]);

    $this->actingAs($this->user)
        ->post("/templates/from-task/{$task->id}", [
            'name' => 'Weekly Review Template',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('task_templates', [
        'name' => 'Weekly Review Template',
        'default_title' => 'Weekly Review',
    ]);
});

it('creates task from template', function () {
    $list = TaskList::factory()->create(['project_id' => $this->project->id]);

    $template = TaskTemplate::factory()->create([
        'user_id' => $this->user->id,
        'default_title' => 'Sprint Planning',
        'default_priority' => 2,
    ]);

    $this->actingAs($this->user)
        ->post("/templates/{$template->id}/create-task", [
            'task_list_id' => $list->id,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('tasks', [
        'title' => 'Sprint Planning',
        'task_list_id' => $list->id,
        'priority' => 2,
    ]);

    expect($template->fresh()->usage_count)->toBe(1);
});

it('prevents Free users from creating templates beyond limit', function () {
    $user = User::factory()->create(['plan' => UserPlan::Free]);

    // Create max allowed templates
    TaskTemplate::factory()->count(3)->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->post('/templates', [
            'name' => 'Another Template',
            'default_title' => 'Test',
        ])
        ->assertRedirect()
        ->assertSessionHas('error');
});
```

---

## ✅ Checklist

- [ ] Create `task_templates` table migration
- [ ] Create `TaskTemplate` model
- [ ] Create `TaskTemplateFactory`
- [ ] Add `canCreateTaskTemplates()` to `UserPlan`
- [ ] Add `maxTaskTemplates()` to `UserPlan`
- [ ] Create `TaskTemplateController`
- [ ] Create `TaskTemplatePolicy`
- [ ] Register policy
- [ ] Add routes
- [ ] Create Templates/Index page
- [ ] Create `SaveAsTemplateButton` component
- [ ] Create `TemplatePicker` component
- [ ] Integrate template picker into task creation UI
- [ ] Write tests

---

## 📚 References

- [Asana Task Templates](https://asana.com/guide/help/premium/task-templates)
- [Notion Templates](https://www.notion.so/templates)
- [Monday.com Templates](https://monday.com/templates)
