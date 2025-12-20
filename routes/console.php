<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled Commands
|--------------------------------------------------------------------------
|
| These commands run automatically at the specified intervals.
| Make sure `php artisan schedule:run` is configured in cron:
|
| * * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
|
*/

// Send task due soon reminders every hour
Schedule::command('notifications:task-due-soon')->hourly();

// Send task overdue notifications every hour
Schedule::command('notifications:task-overdue')->hourly();

// Clean up trash items daily at midnight
Schedule::command('trash:cleanup')->daily();
