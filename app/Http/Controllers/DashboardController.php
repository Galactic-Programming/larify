<?php

namespace App\Http\Controllers;

use App\Enums\UserPlan;
use App\Models\Activity;
use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard with user's tasks, activities, and projects overview.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $today = now()->startOfDay();
        $endOfWeek = now()->endOfWeek();

        // Get all projects the user has access to
        $projectIds = $user->allProjects()->pluck('id');

        // Get user's assigned tasks (not completed)
        $myTasks = Task::where('assigned_to', $user->id)
            ->whereNull('completed_at')
            ->whereIn('project_id', $projectIds)
            ->with(['project:id,name,color,icon', 'list:id,name'])
            ->orderBy('due_date')
            ->orderBy('due_time')
            ->get();

        // Group tasks by deadline
        $overdueTasks = $myTasks->filter(fn ($task) => $task->isOverdue())->values();
        $todayTasks = $myTasks->filter(fn ($task) => ! $task->isOverdue() && $task->due_date && $task->due_date->isSameDay($today))->values();
        $thisWeekTasks = $myTasks->filter(fn ($task) => ! $task->isOverdue() && $task->due_date && $task->due_date->isAfter($today) && $task->due_date->lte($endOfWeek))->values();
        $laterTasks = $myTasks->filter(fn ($task) => ! $task->isOverdue() && $task->due_date && $task->due_date->isAfter($endOfWeek))->values();
        $noDateTasks = $myTasks->filter(fn ($task) => ! $task->due_date)->values();

        // Limit total tasks to 10 for dashboard display (prioritize by urgency)
        $maxTasks = 10;
        $remaining = $maxTasks;

        $limitedOverdue = $overdueTasks->take($remaining);
        $remaining -= $limitedOverdue->count();

        $limitedToday = $remaining > 0 ? $todayTasks->take($remaining) : collect();
        $remaining -= $limitedToday->count();

        $limitedThisWeek = $remaining > 0 ? $thisWeekTasks->take($remaining) : collect();
        $remaining -= $limitedThisWeek->count();

        $limitedLater = $remaining > 0 ? $laterTasks->take($remaining) : collect();
        $remaining -= $limitedLater->count();

        $limitedNoDate = $remaining > 0 ? $noDateTasks->take($remaining) : collect();

        // Get upcoming deadlines (5 nearest tasks with due dates)
        $upcomingDeadlines = Task::where('assigned_to', $user->id)
            ->whereNull('completed_at')
            ->whereIn('project_id', $projectIds)
            ->whereNotNull('due_date')
            ->where(function ($query) use ($today) {
                $query->where('due_date', '>', $today)
                    ->orWhere(function ($q) use ($today) {
                        $q->where('due_date', '=', $today->format('Y-m-d'))
                            ->where('due_time', '>', now()->format('H:i:s'));
                    });
            })
            ->with(['project:id,name,color,icon'])
            ->orderBy('due_date')
            ->orderBy('due_time')
            ->limit(5)
            ->get();

        // Stats calculations
        $completedThisWeek = Task::where('assigned_to', $user->id)
            ->whereIn('project_id', $projectIds)
            ->whereNotNull('completed_at')
            ->where('completed_at', '>=', now()->startOfWeek())
            ->count();

        $completedLastWeek = Task::where('assigned_to', $user->id)
            ->whereIn('project_id', $projectIds)
            ->whereNotNull('completed_at')
            ->whereBetween('completed_at', [
                now()->subWeek()->startOfWeek(),
                now()->subWeek()->endOfWeek(),
            ])
            ->count();

        // Recent activities (respecting plan's retention days)
        $retentionDays = $user->plan?->activityRetentionDays() ?? UserPlan::Free->activityRetentionDays();
        $cutoffDate = now()->subDays($retentionDays);

        $recentActivities = Activity::whereIn('project_id', $projectIds)
            ->where('created_at', '>=', $cutoffDate)
            ->with(['user:id,name,avatar', 'project:id,name,color,icon'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($activity) => [
                'id' => $activity->id,
                'description' => $activity->formatted_description,
                'created_at' => $activity->created_at->toIso8601String(),
                'data' => [
                    'event' => $activity->type->value,
                ],
                'user' => $activity->user ? [
                    'id' => $activity->user->id,
                    'name' => $activity->user->name,
                    'profile_photo_path' => $activity->user->avatar,
                ] : null,
            ]);

        // Recent projects with progress
        $recentProjects = $user->allProjects()
            ->where('is_archived', false)
            ->with(['members:id,name,avatar'])
            ->withCount([
                'tasks as total_tasks_count',
                'tasks as completed_tasks_count' => fn ($query) => $query->whereNotNull('completed_at'),
            ])
            ->latest('updated_at')
            ->limit(6)
            ->get()
            ->map(fn ($project) => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'color' => $project->color,
                'icon' => $project->icon,
                'total_tasks' => $project->total_tasks_count,
                'completed_tasks' => $project->completed_tasks_count,
                'progress' => $project->total_tasks_count > 0
                    ? round(($project->completed_tasks_count / $project->total_tasks_count) * 100)
                    : 0,
                'members' => $project->members->take(3)->map(fn ($member) => [
                    'id' => $member->id,
                    'name' => $member->name,
                    'avatar' => $member->avatar,
                ]),
                'members_count' => $project->members->count(),
                'updated_at' => $project->updated_at->toIso8601String(),
                'updated_at_human' => $project->updated_at->diffForHumans(),
            ]);

        // Calculate week over week change
        $weekChange = $completedLastWeek > 0
            ? round((($completedThisWeek - $completedLastWeek) / $completedLastWeek) * 100)
            : ($completedThisWeek > 0 ? 100 : 0);

        return Inertia::render('dashboard', [
            'stats' => [
                'my_tasks_count' => $myTasks->count(),
                'overdue_count' => $overdueTasks->count(),
                'projects_count' => $user->allProjects()->where('is_archived', false)->count(),
                'archived_projects_count' => $user->allProjects()->where('is_archived', true)->count(),
                'completed_this_week' => $completedThisWeek,
                'completed_last_week' => $completedLastWeek,
                'week_change' => $weekChange,
            ],
            'myTasks' => [
                'overdue' => $this->formatTasks($limitedOverdue),
                'today' => $this->formatTasks($limitedToday),
                'this_week' => $this->formatTasks($limitedThisWeek),
                'later' => $this->formatTasks($limitedLater),
                'no_date' => $this->formatTasks($limitedNoDate),
            ],
            'upcomingDeadlines' => $this->formatTasks($upcomingDeadlines),
            'recentActivities' => $recentActivities,
            'recentProjects' => $recentProjects,
        ]);
    }

    /**
     * Format tasks for frontend display.
     *
     * @param  \Illuminate\Support\Collection<int, Task>  $tasks
     * @return array<int, array<string, mixed>>
     */
    private function formatTasks($tasks): array
    {
        return $tasks->map(fn (Task $task) => [
            'id' => $task->id,
            'title' => $task->title,
            'description' => $task->description,
            'priority' => $task->priority?->value,
            'due_date' => $task->due_date?->format('Y-m-d'),
            'due_time' => $task->due_time,
            'completed_at' => $task->completed_at?->toIso8601String(),
            'is_overdue' => $task->isOverdue(),
            'project' => $task->project ? [
                'id' => $task->project->id,
                'name' => $task->project->name,
                'color' => $task->project->color,
                'icon' => $task->project->icon,
            ] : null,
            'list' => $task->list ? [
                'id' => $task->list->id,
                'name' => $task->list->name,
            ] : null,
        ])->toArray();
    }
}
