<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Task Due Soon Reminder Hours
    |--------------------------------------------------------------------------
    |
    | This value determines how many hours before a task's due date
    | to send a reminder notification. You can specify multiple
    | reminder intervals in hours.
    |
    | Examples:
    | - [24] = One reminder, 24 hours before due date
    | - [24, 1] = Two reminders, 24 hours and 1 hour before
    | - [48, 24, 1] = Three reminders at 48h, 24h, and 1h before
    |
    */

    'task_due_soon_hours' => explode(',', env('NOTIFICATION_TASK_DUE_HOURS', '24')),

    /*
    |--------------------------------------------------------------------------
    | Task Overdue Notification Hours
    |--------------------------------------------------------------------------
    |
    | This value determines how many hours after a task becomes overdue
    | to send a notification. You can specify multiple intervals.
    |
    | Examples:
    | - [1] = Notify 1 hour after task becomes overdue
    | - [1, 24] = Notify at 1 hour and 24 hours overdue
    |
    */

    'task_overdue_hours' => explode(',', env('NOTIFICATION_TASK_OVERDUE_HOURS', '1,24')),

];
