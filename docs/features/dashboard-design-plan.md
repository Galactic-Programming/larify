# Dashboard Design Plan

Tài liệu này ghi chú kế hoạch thiết kế Dashboard cho Larify, bao gồm danh sách components có sẵn có thể tái sử dụng và thiết kế chi tiết.

## 📦 Components Có Sẵn Để Tái Sử Dụng

### 🎨 UI Components (`components/ui/`)

| Component      | File              | Mô tả                                                         | Sử dụng cho Dashboard                    |
| -------------- | ----------------- | ------------------------------------------------------------- | ---------------------------------------- |
| **Card**       | `card.tsx`        | Card container với header, content, footer, action            | ✅ Stats cards, Task list, Activity feed |
| **Badge**      | `badge.tsx`       | Badge với variants (default, secondary, destructive, outline) | ✅ Overdue badge, Priority badge         |
| **Progress**   | `progress.tsx`    | Progress bar đơn giản                                         | ✅ Project completion progress           |
| **Avatar**     | `avatar.tsx`      | Avatar với fallback                                           | ✅ User avatars trong activities         |
| **Button**     | `button.tsx`      | Button với nhiều variants và sizes                            | ✅ Quick actions                         |
| **Skeleton**   | `skeleton.tsx`    | Loading skeleton animation                                    | ✅ Loading states                        |
| **ScrollArea** | `scroll-area.tsx` | Scrollable area với custom scrollbar                          | ✅ Task list, Activity feed              |
| **Tooltip**    | `tooltip.tsx`     | Tooltip với arrow                                             | ✅ Tooltips cho icons, truncated text    |
| **Tabs**       | `tabs.tsx`        | Tabs component                                                | ✅ Switch between views                  |
| **Separator**  | `separator.tsx`   | Horizontal/vertical separator                                 | ✅ Dividers                              |
| **Empty**      | `empty.tsx`       | Empty state với media, title, description, actions            | ✅ Empty task list                       |

### 🏗️ Block Components (`components/shadcn-studio/blocks/`)

| Component              | File                       | Mô tả                                                      | Sử dụng cho Dashboard                                   |
| ---------------------- | -------------------------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| **StatisticsCard**     | `statistics-card.tsx`      | ⭐ Card thống kê với icon, value, title, change percentage | ✅ **CHÍNH** - Stats cards (Tasks, Projects, Completed) |
| **DashboardFooter**    | `dashboard-footer.tsx`     | Footer cho dashboard                                       | ✅ Đã có sẵn trong dashboard hiện tại                   |
| **WidgetTotalEarning** | `widget-total-earning.tsx` | Widget với trend, progress bars                            | 🔄 Có thể tham khảo layout cho project progress         |
| **ChartSalesMetrics**  | `chart-sales-metrics.tsx`  | Charts với pie và bar                                      | 🔄 Có thể dùng cho productivity chart (optional)        |

### 🧩 Kibo UI Components (`components/kibo-ui/`)

| Component        | File                | Mô tả                                      | Sử dụng cho Dashboard                  |
| ---------------- | ------------------- | ------------------------------------------ | -------------------------------------- |
| **RelativeTime** | `relative-time.tsx` | Hiển thị thời gian tương đối (2 hours ago) | ✅ Activity timestamps, Task deadlines |
| **Status**       | `status.tsx`        | Status indicator với dot animation         | 🔄 Có thể dùng cho task status         |
| **List**         | `list.tsx`          | Draggable list với DnD Kit                 | ❌ Không cần cho Dashboard             |

### 🎭 Shadcn Studio Components (`components/shadcn-studio/`)

| Component        | File                | Mô tả                                             | Sử dụng cho Dashboard                |
| ---------------- | ------------------- | ------------------------------------------------- | ------------------------------------ |
| **AvatarStatus** | `avatar-status.tsx` | Avatar với status indicator (online/offline/busy) | ✅ Member avatars với status         |
| **MotionTabs**   | `motion-tabs.tsx`   | Animated tabs                                     | 🔄 Optional - animated tab switching |
| **SoftSonner**   | `soft-sonner.tsx`   | Soft toast notifications                          | ✅ Feedback khi thực hiện actions    |

### 📋 Existing Page Components (Có thể tái sử dụng)

| Component            | File                                                   | Mô tả                                          | Sử dụng cho Dashboard                  |
| -------------------- | ------------------------------------------------------ | ---------------------------------------------- | -------------------------------------- |
| **ActivityItem**     | `pages/notifications/components/activity-item.tsx`     | ⭐ Item activity với icon, avatar, description | ✅ **CHÍNH** - Recent Activity widget  |
| **ActivityTimeline** | `pages/notifications/components/activity-timeline.tsx` | Timeline grouped by project                    | 🔄 Tham khảo layout cho activity feed  |
| **ProjectCard**      | `pages/projects/components/project-card.tsx`           | Card project với stats                         | ✅ **CHÍNH** - Recent Projects section |
| **TaskCard**         | `pages/projects/lists/tasks/components/task-card.tsx`  | Card task với priority, assignee, deadline     | ✅ **CHÍNH** - My Tasks section        |

### 📊 Chart Components (`components/ui/chart.tsx`)

| Export             | Mô tả                  | Sử dụng                           |
| ------------------ | ---------------------- | --------------------------------- |
| **ChartContainer** | Container cho Recharts | 🔄 Optional - Productivity charts |
| **ChartTooltip**   | Tooltip cho charts     | 🔄 Optional                       |

### 🔧 Utility Components

| Component              | File                                    | Mô tả                           |
| ---------------------- | --------------------------------------- | ------------------------------- | --------------------------------- |
| **Stats**              | `components/stats.tsx`                  | Stat cards với mini area charts | 🔄 Alternative cho StatisticsCard |
| **SparklesText**       | `components/ui/sparkles-text.tsx`       | Text với sparkle animation      | ✅ Đã dùng trong welcome message  |
| **PlaceholderPattern** | `components/ui/placeholder-pattern.tsx` | SVG pattern cho placeholder     | ❌ Sẽ thay thế bằng nội dung thực |

---

## 🎯 Kế Hoạch Thiết Kế Dashboard

### Layout Tổng Quan

```
┌─────────────────────────────────────────────────────────────┐
│  👋 Welcome Card (Giữ nguyên - đã có sẵn)                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  StatisticsCard │ │  StatisticsCard │ │  StatisticsCard │
│  📋 My Tasks    │ │  📁 Projects    │ │  ✅ Completed   │
└─────────────────┘ └─────────────────┘ └─────────────────┘

┌───────────────────────────────────┐ ┌─────────────────────┐
│  📋 My Tasks (TaskCard list)      │ │ ⏰ Upcoming         │
│  - ScrollArea với grouped tasks   │ │ - 5 nearest tasks   │
│  - Overdue / Today / This Week    │ ├─────────────────────┤
│  - Quick complete action          │ │ 📈 Recent Activity  │
│  - Click to view details          │ │ - ActivityItem list │
└───────────────────────────────────┘ └─────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📁 Recent Projects (ProjectCard grid)                      │
│  - 4-6 projects gần đây                                     │
│  - Progress bar, member avatars                             │
└─────────────────────────────────────────────────────────────┘
```

### Section 1: Stats Cards (Sử dụng `StatisticsCard`)

```tsx
// 3 cards trong grid md:grid-cols-3
<StatisticsCard
    icon={<CheckSquare />}
    value="12"
    title="My Tasks"
    changePercentage="+3" // hoặc "2 overdue"
/>
```

**Props cần truyền từ backend:**

- `myTasksCount` - Số tasks được giao
- `overdueCount` - Số tasks quá hạn
- `projectsCount` - Số projects active
- `archivedProjectsCount` - Số projects archived
- `completedThisWeek` - Số tasks hoàn thành tuần này
- `completedLastWeek` - Số tasks hoàn thành tuần trước (để tính % change)

### Section 2: My Tasks (Sử dụng `TaskCard` simplified)

**Cần tạo component mới:** `DashboardTaskCard` (simplified version của TaskCard)

- Không cần drag & drop
- Compact hơn
- Quick complete action
- Click to navigate to project

**Grouped by:**

1. 🔴 **Overdue** - Tasks quá hạn
2. 📅 **Due Today** - Tasks đến hạn hôm nay
3. 📆 **This Week** - Tasks đến hạn trong tuần
4. 📋 **Later** - Tasks còn lại

**Data từ backend:**

```php
'myTasks' => [
    'overdue' => TaskResource::collection($overdueTasks),
    'today' => TaskResource::collection($todayTasks),
    'this_week' => TaskResource::collection($thisWeekTasks),
    'later' => TaskResource::collection($laterTasks),
]
```

### Section 3: Sidebar Widgets

#### 3.1 Upcoming Deadlines Widget

**Sử dụng:** Custom component với `Card` + list items

- 5 tasks sắp đến hạn nhất
- Hiển thị: title, project name, due date (với `RelativeTime`)

#### 3.2 Recent Activity Widget

**Sử dụng:** `ActivityItem` từ notifications

- 10 activities gần nhất
- Grouped by time (Today, Yesterday, Earlier)

### Section 4: Recent Projects (Sử dụng `ProjectCard` hoặc simplified)

**Option 1:** Reuse `ProjectCard` trực tiếp

- Ưu: Không cần code mới
- Nhược: Có thể quá nhiều thông tin

**Option 2:** Tạo `DashboardProjectCard` (simplified)

- Compact hơn
- Focus vào progress và recent activity
- 4 cards trong grid

**Data cần:**

- Project info (name, color, icon)
- Progress: completed_tasks / total_tasks
- Members (first 3 + count)
- Last activity time

---

## 📁 Cấu Trúc Files Mới Cần Tạo

```
app/Http/Controllers/
└── DashboardController.php          # Mới

resources/js/Pages/
└── dashboard/
    ├── index.tsx                    # Thay thế dashboard.tsx
    └── components/
        ├── dashboard-header.tsx     # Welcome card (move from current)
        ├── stats-section.tsx        # 3 stat cards
        ├── my-tasks-section.tsx     # Task list với grouping
        ├── dashboard-task-card.tsx  # Simplified task card
        ├── upcoming-widget.tsx      # Upcoming deadlines
        ├── activity-widget.tsx      # Recent activity
        └── projects-section.tsx     # Recent projects
```

---

## 🔄 Data Flow

### Backend (DashboardController)

```php
public function index(Request $request): Response
{
    $user = $request->user();

    // Stats
    $myTasks = Task::where('assigned_to', $user->id)
        ->whereNull('completed_at')
        ->get();

    $overdueCount = $myTasks->filter(fn($t) => $t->isOverdue())->count();

    // Group tasks by deadline
    $today = now()->startOfDay();
    $endOfWeek = now()->endOfWeek();

    $tasksGrouped = [
        'overdue' => $myTasks->filter(fn($t) => $t->isOverdue()),
        'today' => $myTasks->filter(fn($t) =>
            $t->due_date->isSameDay($today) && !$t->isOverdue()
        ),
        'this_week' => $myTasks->filter(fn($t) =>
            $t->due_date->between($today->addDay(), $endOfWeek)
        ),
        'later' => $myTasks->filter(fn($t) =>
            $t->due_date->isAfter($endOfWeek)
        ),
    ];

    // Recent activities
    $projectIds = $user->allProjects()->pluck('id');
    $activities = Activity::whereIn('project_id', $projectIds)
        ->latest()
        ->limit(10)
        ->get();

    // Recent projects with stats
    $recentProjects = $user->allProjects()
        ->with(['tasks' => fn($q) => $q->withCount('completed')])
        ->latest('updated_at')
        ->limit(6)
        ->get();

    return Inertia::render('dashboard/index', [
        'stats' => [
            'my_tasks_count' => $myTasks->count(),
            'overdue_count' => $overdueCount,
            'projects_count' => $user->allProjects()->count(),
            'completed_this_week' => $completedThisWeek,
        ],
        'myTasks' => $tasksGrouped,
        'upcomingDeadlines' => $upcoming,
        'recentActivities' => $activities,
        'recentProjects' => $recentProjects,
    ]);
}
```

---

## ✅ Checklist Triển Khai

### Phase 1: Backend

- [ ] Tạo `DashboardController.php`
- [ ] Cập nhật `routes/web.php` để sử dụng controller
- [ ] Tạo `DashboardResource` nếu cần
- [ ] Viết Feature tests

### Phase 2: Frontend - Components

- [ ] Tạo folder `resources/js/Pages/dashboard/`
- [ ] Tạo `dashboard-header.tsx` (move welcome card)
- [ ] Tạo `stats-section.tsx` (sử dụng StatisticsCard)
- [ ] Tạo `dashboard-task-card.tsx`
- [ ] Tạo `my-tasks-section.tsx`
- [ ] Tạo `upcoming-widget.tsx`
- [ ] Tạo `activity-widget.tsx` (reuse ActivityItem)
- [ ] Tạo `projects-section.tsx`

### Phase 3: Integration

- [ ] Cập nhật `dashboard/index.tsx` với layout mới
- [ ] Kết nối data từ backend
- [ ] Thêm animations với Framer Motion
- [ ] Responsive design
- [ ] Loading states với Skeleton

### Phase 4: Polish

- [ ] Empty states cho mỗi section
- [ ] Quick actions (create task, create project)
- [ ] Click handlers để navigate
- [ ] Dark mode support

---

## 📝 Notes

1. **Tái sử dụng tối đa** - Ưu tiên sử dụng components có sẵn, chỉ tạo mới khi cần thiết
2. **Consistent styling** - Sử dụng Tailwind classes giống các pages khác
3. **Motion animations** - Sử dụng `motion/react` cho animations nhất quán
4. **Plan-aware** - Một số features có thể khác nhau giữa Free/Pro (activity retention)
5. **Performance** - Lazy load sections, use deferred props cho data nặng
