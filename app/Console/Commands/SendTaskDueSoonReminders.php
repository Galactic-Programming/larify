<?php

namespace App\Console\Commands;

use App\Models\Task;
use App\Notifications\TaskDueSoon;
use Illuminate\Console\Command;

class SendTaskDueSoonReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:task-due-soon
                            {--hours= : Specific hours before due date to check (overrides config)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send notifications for tasks that are due soon';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $hoursConfig = $this->option('hours')
            ? [(int) $this->option('hours')]
            : config('notifications.task_due_soon_hours', [24]);

        $totalSent = 0;

        foreach ($hoursConfig as $hours) {
            $hours = (int) $hours;
            $sent = $this->sendRemindersForHours($hours);
            $totalSent += $sent;
        }

        $this->info("Sent {$totalSent} task due soon notifications.");

        return self::SUCCESS;
    }

    /**
     * Send reminders for tasks due in the specified hours.
     */
    protected function sendRemindersForHours(int $hours): int
    {
        // Calculate the time window (tasks due within this hour window)
        $startTime = now()->addHours($hours)->startOfHour();
        $endTime = now()->addHours($hours)->endOfHour();

        // Find tasks that:
        // 1. Have a due date within our window
        // 2. Are not completed
        // 3. Have an assignee
        // 4. Haven't already received this specific reminder
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
            // Check if we already sent this specific reminder (same hours)
            $alreadySent = $task->assignee
                ->notifications()
                ->where('type', TaskDueSoon::class)
                ->where('data->task_id', $task->id)
                ->where('data->reminder_hours', $hours)
                ->exists();

            if ($alreadySent) {
                continue;
            }

            $timeUntilDue = $this->formatTimeUntilDue($hours);

            $task->assignee->notify(new TaskDueSoon($task, $timeUntilDue, $hours));
            $sent++;

            $this->line("  → Sent reminder to {$task->assignee->name} for task: {$task->title} (due in {$timeUntilDue})");
        }

        return $sent;
    }

    /**
     * Format the time until due for display.
     */
    protected function formatTimeUntilDue(int $hours): string
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
