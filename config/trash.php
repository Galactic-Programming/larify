<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Trash Retention Period
    |--------------------------------------------------------------------------
    |
    | This value determines how many days deleted items will be kept in the
    | trash before being permanently deleted by the cleanup command.
    |
    */
    'retention_days' => env('TRASH_RETENTION_DAYS', 7),

    /*
    |--------------------------------------------------------------------------
    | Models to Clean Up
    |--------------------------------------------------------------------------
    |
    | List of model classes that should be cleaned up by the trash:cleanup
    | command. The order matters - children should be deleted before parents
    | to maintain referential integrity.
    |
    */
    'models' => [
        \App\Models\Task::class,
        \App\Models\TaskList::class,
        \App\Models\Project::class,
    ],
];
