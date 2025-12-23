# Pro Plan Features Implementation Guide

> **Status**: Planning Document  
> **Created**: December 23, 2025  
> **Author**: Development Team

## Overview

Hướng dẫn này mô tả kế hoạch triển khai phân biệt tính năng giữa **Free Plan** và **Pro Plan** để tạo giá trị rõ ràng cho người dùng khi nâng cấp subscription.

---

## Feature Comparison Table

| Tính năng                   | Free Plan | Pro Plan     |
| --------------------------- | --------- | ------------ |
| **Projects**                | 3         | Unlimited    |
| **Task Lists per Project**  | 5         | Unlimited    |
| **Mời thành viên**          | ❌        | ✅           |
| **Chat/Conversations**      | ❌        | ✅           |
| **Activity History**        | 7 ngày    | 30 ngày      |
| **Task Due Date Reminders** | ❌        | ✅           |
| **Project Colors/Icons**    | Basic     | Full palette |

---

## Implementation Plan

### Phase 1: Update UserPlan Enum

**File**: `app/Enums/UserPlan.php`

Thêm các methods mới để check plan limits:

```php
<?php

namespace App\Enums;

enum UserPlan: string
{
    case Free = 'free';
    case Pro = 'pro';

    // Existing methods...

    /**
     * Get maximum number of projects allowed.
     * Returns null for unlimited.
     */
    public function maxProjects(): ?int
    {
        return match ($this) {
            self::Free => 3,
            self::Pro => null, // Unlimited
        };
    }

    /**
     * Get maximum number of task lists per project.
     * Returns null for unlimited.
     */
    public function maxListsPerProject(): ?int
    {
        return match ($this) {
            self::Free => 5,
            self::Pro => null, // Unlimited
        };
    }

    /**
     * Get activity history retention in days.
     */
    public function activityRetentionDays(): int
    {
        return match ($this) {
            self::Free => 7,
            self::Pro => 30,
        };
    }

    /**
     * Check if this plan allows chat/conversations.
     */
    public function canUseChat(): bool
    {
        return $this === self::Pro;
    }

    /**
     * Check if this plan allows due date reminders.
     */
    public function canUseDueDateReminders(): bool
    {
        return $this === self::Pro;
    }

    /**
     * Check if this plan has full color/icon palette.
     */
    public function hasFullPalette(): bool
    {
        return $this === self::Pro;
    }

    /**
     * Get all limits as array (useful for frontend).
     */
    public function getLimits(): array
    {
        return [
            'max_projects' => $this->maxProjects(),
            'max_lists_per_project' => $this->maxListsPerProject(),
            'activity_retention_days' => $this->activityRetentionDays(),
            'can_invite_members' => $this->canInviteMembers(),
            'can_use_chat' => $this->canUseChat(),
            'can_use_due_date_reminders' => $this->canUseDueDateReminders(),
            'has_full_palette' => $this->hasFullPalette(),
        ];
    }
}
```

---

### Phase 2: Backend Validation & Gates

#### 2.1. Project Creation Limit

**File**: `app/Http/Requests/Projects/StoreProjectRequest.php`

```php
public function authorize(): bool
{
    $user = $this->user();
    $maxProjects = $user->plan?->maxProjects();

    // Null means unlimited
    if ($maxProjects === null) {
        return true;
    }

    return $user->projects()->count() < $maxProjects;
}

public function failedAuthorization(): void
{
    throw new \Illuminate\Auth\Access\AuthorizationException(
        'You have reached the maximum number of projects for your plan. Please upgrade to Pro for unlimited projects.'
    );
}
```

#### 2.2. Task List Creation Limit

**File**: `app/Http/Requests/TaskLists/StoreTaskListRequest.php`

```php
public function authorize(): bool
{
    $project = $this->route('project');
    $user = $project->owner; // Check owner's plan, not current user
    $maxLists = $user->plan?->maxListsPerProject();

    // Null means unlimited
    if ($maxLists === null) {
        return true;
    }

    return $project->lists()->count() < $maxLists;
}
```

#### 2.3. Chat Access Gate

**File**: `app/Policies/ConversationPolicy.php`

```php
/**
 * Determine whether the user can create conversations.
 */
public function create(User $user): bool
{
    return $user->plan?->canUseChat() ?? false;
}

/**
 * Determine whether the user can view conversations.
 */
public function viewAny(User $user): bool
{
    return $user->plan?->canUseChat() ?? false;
}
```

#### 2.4. Activity History Filtering

**File**: `app/Http/Controllers/Activities/ActivityController.php`

```php
public function index(Project $project)
{
    $user = auth()->user();
    $retentionDays = $user->plan?->activityRetentionDays() ?? 7;

    $activities = $project->activities()
        ->where('created_at', '>=', now()->subDays($retentionDays))
        ->with(['user', 'subject'])
        ->latest()
        ->paginate(20);

    return Inertia::render('activities/index', [
        'activities' => $activities,
        'retentionDays' => $retentionDays,
    ]);
}
```

---

### Phase 3: User Model Helper Methods

**File**: `app/Models/User.php`

```php
/**
 * Check if user can create more projects.
 */
public function canCreateProject(): bool
{
    $max = $this->plan?->maxProjects();
    return $max === null || $this->projects()->count() < $max;
}

/**
 * Get remaining project slots.
 * Returns null for unlimited.
 */
public function remainingProjectSlots(): ?int
{
    $max = $this->plan?->maxProjects();
    if ($max === null) {
        return null;
    }
    return max(0, $max - $this->projects()->count());
}

/**
 * Check if user can create more lists in a project.
 */
public function canCreateListInProject(Project $project): bool
{
    // Only check owner's plan
    if ($project->user_id !== $this->id) {
        $owner = $project->owner;
        return $owner->canCreateListInProject($project);
    }

    $max = $this->plan?->maxListsPerProject();
    return $max === null || $project->lists()->count() < $max;
}

/**
 * Get plan limits for frontend.
 */
public function getPlanLimits(): array
{
    $limits = $this->plan?->getLimits() ?? UserPlan::Free->getLimits();

    return array_merge($limits, [
        'current_projects' => $this->projects()->count(),
        'can_create_project' => $this->canCreateProject(),
        'remaining_project_slots' => $this->remainingProjectSlots(),
    ]);
}
```

---

### Phase 4: Share Limits to Frontend

**File**: `app/Http/Middleware/HandleInertiaRequests.php`

```php
public function share(Request $request): array
{
    return [
        ...parent::share($request),
        'auth' => [
            'user' => $request->user() ? [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'avatar' => $request->user()->avatar,
                'plan' => $request->user()->plan?->value ?? 'free',
                'plan_limits' => $request->user()->getPlanLimits(),
            ] : null,
        ],
    ];
}
```

---

### Phase 5: Frontend TypeScript Types

**File**: `resources/js/types/index.d.ts`

```typescript
interface PlanLimits {
    max_projects: number | null;
    max_lists_per_project: number | null;
    activity_retention_days: number;
    can_invite_members: boolean;
    can_use_chat: boolean;
    can_use_due_date_reminders: boolean;
    has_full_palette: boolean;
    current_projects: number;
    can_create_project: boolean;
    remaining_project_slots: number | null;
}

interface User {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    plan: 'free' | 'pro';
    plan_limits: PlanLimits;
}
```

---

### Phase 6: Frontend UI Components

#### 6.1. Upgrade Prompt Component

**File**: `resources/js/components/upgrade-prompt.tsx`

```tsx
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { SparklesIcon } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface UpgradePromptProps {
    title: string;
    description: string;
    feature?: string;
}

export function UpgradePrompt({
    title,
    description,
    feature,
}: UpgradePromptProps) {
    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <SparklesIcon className="text-primary size-5" />
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/settings/subscription">Upgrade to Pro</Link>
                </Button>
            </CardContent>
        </Card>
    );
}
```

#### 6.2. Limit Indicator Component

**File**: `resources/js/components/limit-indicator.tsx`

```tsx
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LimitIndicatorProps {
    current: number;
    max: number | null;
    label: string;
    className?: string;
}

export function LimitIndicator({
    current,
    max,
    label,
    className,
}: LimitIndicatorProps) {
    if (max === null) {
        return (
            <div className={cn('text-muted-foreground text-sm', className)}>
                {current} {label} (unlimited)
            </div>
        );
    }

    const percentage = (current / max) * 100;
    const isNearLimit = percentage >= 80;
    const isAtLimit = current >= max;

    return (
        <div className={cn('space-y-1', className)}>
            <div className="flex justify-between text-sm">
                <span className={cn(isAtLimit && 'text-destructive')}>
                    {current} / {max} {label}
                </span>
                {isNearLimit && !isAtLimit && (
                    <span className="text-warning">Near limit</span>
                )}
                {isAtLimit && (
                    <span className="text-destructive">Limit reached</span>
                )}
            </div>
            <Progress
                value={percentage}
                className={cn(
                    isAtLimit && '[&>div]:bg-destructive',
                    isNearLimit && !isAtLimit && '[&>div]:bg-warning',
                )}
            />
        </div>
    );
}
```

#### 6.3. Usage in Project Creation

**File**: `resources/js/pages/projects/index.tsx` (example usage)

```tsx
import { usePage } from '@inertiajs/react';
import { UpgradePrompt } from '@/components/upgrade-prompt';
import { LimitIndicator } from '@/components/limit-indicator';

export default function ProjectIndex() {
    const { auth } = usePage().props;
    const { plan_limits } = auth.user;

    return (
        <div>
            {/* Show limit indicator */}
            <LimitIndicator
                current={plan_limits.current_projects}
                max={plan_limits.max_projects}
                label="projects"
            />

            {/* Show upgrade prompt when at limit */}
            {!plan_limits.can_create_project && (
                <UpgradePrompt
                    title="Project limit reached"
                    description="Upgrade to Pro for unlimited projects."
                />
            )}

            {/* Disable create button when at limit */}
            <Button disabled={!plan_limits.can_create_project}>
                Create Project
            </Button>
        </div>
    );
}
```

---

### Phase 7: Chat Feature Gating

#### 7.1. Hide Chat Sidebar for Free Users

**File**: `resources/js/layouts/app-layout.tsx` (conceptual)

```tsx
const { auth } = usePage().props;

// Only show chat link if user has Pro plan
{
    auth.user.plan_limits.can_use_chat && (
        <NavLink href="/conversations">
            <MessageCircleIcon />
            Chat
        </NavLink>
    );
}
```

#### 7.2. Chat Index Page Guard

**File**: `app/Http/Controllers/Conversations/ConversationController.php`

```php
public function index()
{
    $user = auth()->user();

    if (!$user->plan?->canUseChat()) {
        return Inertia::render('conversations/upgrade-required', [
            'feature' => 'chat',
        ]);
    }

    // ... existing code
}
```

---

### Phase 8: Color/Icon Palette Restriction

#### 8.1. Define Basic vs Full Palettes

**File**: `config/project.php` (new file)

```php
<?php

return [
    'colors' => [
        'basic' => [
            '#6366F1', // Indigo
            '#10B981', // Green
            '#F59E0B', // Yellow
            '#EF4444', // Red
        ],
        'full' => [
            '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
            '#EC4899', '#F43F5E', '#EF4444', '#F97316',
            '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
            '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
            '#3B82F6', '#6366F1',
        ],
    ],

    'icons' => [
        'basic' => ['folder', 'briefcase', 'home', 'star'],
        'full' => [
            'folder', 'briefcase', 'home', 'star', 'heart',
            'zap', 'target', 'flag', 'bookmark', 'award',
            'coffee', 'music', 'camera', 'globe', 'rocket',
        ],
    ],
];
```

#### 8.2. Filter Palette Based on Plan

```php
public function getAvailableColors(): array
{
    $user = auth()->user();
    $key = $user->plan?->hasFullPalette() ? 'full' : 'basic';

    return config("project.colors.{$key}");
}
```

---

### Phase 9: Update Plan Seeder

**File**: `database/seeders/PlanSeeder.php`

Update features list to reflect actual restrictions:

```php
// Free plan
'features' => [
    'Up to 3 projects',
    'Up to 5 lists per project',
    'Unlimited tasks',
    'Task priorities & due dates',
    '7-day activity history',
    'Basic color palette',
    'Email notifications',
],

// Pro plan
'features' => [
    'Unlimited projects',
    'Unlimited lists per project',
    'Unlimited tasks',
    'Team collaboration',
    'Invite unlimited members',
    'In-app chat',
    '30-day activity history',
    'Full color & icon palette',
    'Due date reminders',
    'Real-time updates',
    'Priority support',
],
```

---

## Testing Checklist

### Unit Tests

- [ ] `UserPlan::maxProjects()` returns correct values
- [ ] `UserPlan::maxListsPerProject()` returns correct values
- [ ] `UserPlan::activityRetentionDays()` returns correct values
- [ ] `UserPlan::canUseChat()` returns correct values
- [ ] `User::canCreateProject()` respects plan limits
- [ ] `User::canCreateListInProject()` respects plan limits

### Feature Tests

- [ ] Free user cannot create more than 3 projects
- [ ] Free user cannot create more than 5 lists per project
- [ ] Free user cannot access chat routes
- [ ] Free user sees only 7 days of activity
- [ ] Pro user has no project limit
- [ ] Pro user has no list limit
- [ ] Pro user can access chat
- [ ] Pro user sees 30 days of activity
- [ ] Upgrade from Free to Pro removes all limits
- [ ] Downgrade from Pro to Free enforces limits on new creations

### Browser Tests

- [ ] Free user sees upgrade prompt when at project limit
- [ ] Free user sees upgrade prompt when at list limit
- [ ] Free user doesn't see chat in navigation
- [ ] Limit indicator shows correct values
- [ ] Create buttons are disabled when at limit

---

## Migration Notes

### Existing Users

Khi triển khai, cần xử lý các user hiện tại:

1. **Free users đã có > 3 projects**:
    - KHÔNG xóa projects cũ
    - Chỉ chặn tạo projects mới
    - Hiển thị thông báo "You have X projects. Free plan allows 3. Upgrade to create more."

2. **Projects đã có > 5 lists**:
    - KHÔNG xóa lists cũ
    - Chỉ chặn tạo lists mới trong project đó

### Scheduled Jobs

Thêm job để cleanup old activities dựa trên plan:

```php
// app/Console/Commands/CleanupOldActivities.php
$users = User::all();

foreach ($users as $user) {
    $retentionDays = $user->plan?->activityRetentionDays() ?? 7;

    Activity::where('user_id', $user->id)
        ->where('created_at', '<', now()->subDays($retentionDays))
        ->delete();
}
```

---

## Rollout Strategy

1. **Phase 1**: Deploy backend changes (gates, validations) - không ảnh hưởng UX
2. **Phase 2**: Deploy frontend indicators (limit warnings, upgrade prompts)
3. **Phase 3**: Enable enforcement (actually block actions)
4. **Phase 4**: Monitor & adjust limits nếu cần

---

## Future Considerations

- **Storage limits**: Khi implement file attachments
- **API rate limits**: Nếu có public API
- **Export features**: PDF/CSV export cho Pro
- **Advanced reporting**: Analytics cho Pro
- **Custom domains**: Cho Pro users
- **White-labeling**: Enterprise tier?

---

## Related Files

- `app/Enums/UserPlan.php` - Plan enum with limit methods
- `app/Models/User.php` - User model with helper methods
- `app/Policies/*` - Authorization policies
- `database/seeders/PlanSeeder.php` - Plan features list
- `resources/js/types/index.d.ts` - TypeScript types
- `config/project.php` - Color/icon palettes (new)
