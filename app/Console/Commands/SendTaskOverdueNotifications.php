<?php

namespace App\Console\Commands;

use App\Models\Task;
use App\Notifications\TaskOverdue;
use Illuminate\Console\Command;

class SendTaskOverdueNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:task-overdue
                            {--hours= : Specific hours after due date to check (overrides config)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send notifications for tasks that are overdue';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $hoursConfig = $this->option('hours')
            ? [(int) $this->option('hours')]
            : config('notifications.task_overdue_hours', [1, 24]);

        $totalSent = 0;

        foreach ($hoursConfig as $hours) {
            $hours = (int) $hours;
            $sent = $this->sendNotificationsForHours($hours);
            $totalSent += $sent;
        }

        $this->info("Sent {$totalSent} task overdue notifications.");

        return self::SUCCESS;
    }

    /**
     * Send notifications for tasks overdue by the specified hours.
     */
    protected function sendNotificationsForHours(int $hours): int
    {
        // Calculate the time window (tasks that became overdue within this hour)
        $startTime = now()->subHours($hours)->startOfHour();
        $endTime = now()->subHours($hours)->endOfHour();

        // Find tasks that:
        // 1. Have a due date within our overdue window
        // 2. Are not completed
        // 3. Have an assignee
        // 4. Haven't already received this specific overdue notification
        $tasks = Task::query()
            ->whereNull('completed_at')
            ->whereNotNull('assigned_to')
            ->whereNotNull('due_date')
            ->where(function ($query) use ($startTime, $endTime) {
                // Handle tasks with due_time
                $query->whereRaw("CONCAT(due_date, ' ', COALESCE(due_time, '23:59:59')) BETWEEN ? AND ?", [
                    $startTime->format('Y-m-d H:i:s'),
                    $endTime->format('Y-m-d H:i:s'),
                ]);
            })
            ->with(['assignee', 'project'])
            ->get();

        $sent = 0;

        foreach ($tasks as $task) {
            // Check if we already sent this specific overdue notification (same hours)
            $alreadySent = $task->assignee
                ->notifications()
                ->where('type', TaskOverdue::class)
                ->where('data->task_id', $task->id)
                ->where('data->overdue_hours', $hours)
                ->exists();

            if ($alreadySent) {
                continue;
            }

            $overdueBy = $this->formatOverdueTime($hours);

            $task->assignee->notify(new TaskOverdue($task, $overdueBy, $hours));
            $sent++;

            $this->line("  → Sent overdue notification to {$task->assignee->name} for task: {$task->title} (overdue by {$overdueBy})");
        }

        return $sent;
    }

    /**
     * Format the overdue time for display.
     */
    protected function formatOverdueTime(int $hours): string
    {
        if ($hours < 1) {
            return 'less than an hour';
        }

        if ($hours === 1) {
            return '1 hour';
        }

        if ($hours < 24) {
            return "{$hours} hours";
        }

        $days = (int) floor($hours / 24);
        $remainingHours = $hours % 24;

        if ($remainingHours === 0) {
            return $days === 1 ? '1 day' : "{$days} days";
        }

        return "{$days} day".($days > 1 ? 's' : '')." and {$remainingHours} hour".($remainingHours > 1 ? 's' : '');
    }
}
