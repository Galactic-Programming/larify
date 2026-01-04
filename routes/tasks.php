<?php

use App\Http\Controllers\Tasks\TaskAttachmentController;
use App\Http\Controllers\Tasks\TaskController;
use App\Http\Controllers\Tasks\TaskLabelController;
use App\Http\Controllers\TaskLists\TaskListController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Task Routes
|--------------------------------------------------------------------------
|
| Routes for managing task lists, tasks, task labels, and task attachments.
|
*/

Route::middleware(['auth', 'verified'])->group(function () {
    // Task Lists (nested under projects)
    Route::get('projects/{project}/lists', [TaskListController::class, 'index'])
        ->name('projects.lists.index');
    Route::post('projects/{project}/lists', [TaskListController::class, 'store'])
        ->name('projects.lists.store');
    Route::patch('projects/{project}/lists/reorder', [TaskListController::class, 'reorder'])
        ->name('projects.lists.reorder');
    Route::patch('projects/{project}/lists/{list}', [TaskListController::class, 'update'])
        ->name('projects.lists.update');
    Route::patch('projects/{project}/lists/{list}/done', [TaskListController::class, 'setDoneList'])
        ->name('projects.lists.done');
    Route::delete('projects/{project}/lists/{list}', [TaskListController::class, 'destroy'])
        ->name('projects.lists.destroy');

    // Tasks (nested under projects/lists)
    Route::post('projects/{project}/lists/{list}/tasks', [TaskController::class, 'store'])
        ->name('projects.tasks.store');
    Route::patch('projects/{project}/tasks/{task}', [TaskController::class, 'update'])
        ->name('projects.tasks.update');
    Route::delete('projects/{project}/tasks/{task}', [TaskController::class, 'destroy'])
        ->name('projects.tasks.destroy');
    Route::patch('projects/{project}/tasks/{task}/move', [TaskController::class, 'move'])
        ->name('projects.tasks.move');
    Route::patch('projects/{project}/lists/{list}/tasks/reorder', [TaskController::class, 'reorder'])
        ->name('projects.tasks.reorder');
    Route::patch('projects/{project}/tasks/{task}/complete', [TaskController::class, 'complete'])
        ->name('projects.tasks.complete');
    Route::patch('projects/{project}/tasks/{task}/reopen', [TaskController::class, 'reopen'])
        ->name('projects.tasks.reopen');

    // Task Labels
    Route::put('projects/{project}/tasks/{task}/labels', [TaskLabelController::class, 'sync'])
        ->name('projects.tasks.labels.sync');
    Route::post('projects/{project}/tasks/{task}/labels/attach', [TaskLabelController::class, 'attach'])
        ->name('projects.tasks.labels.attach');
    Route::post('projects/{project}/tasks/{task}/labels/detach', [TaskLabelController::class, 'detach'])
        ->name('projects.tasks.labels.detach');

    // Task Attachments
    Route::get('api/projects/{project}/tasks/{task}/attachments', [TaskAttachmentController::class, 'index'])
        ->name('api.projects.tasks.attachments.index');
    Route::post('projects/{project}/tasks/{task}/attachments', [TaskAttachmentController::class, 'store'])
        ->middleware('throttle:30,1')
        ->name('projects.tasks.attachments.store');
    Route::delete('projects/{project}/tasks/{task}/attachments/{taskAttachment}', [TaskAttachmentController::class, 'destroy'])
        ->middleware('throttle:30,1')
        ->name('projects.tasks.attachments.destroy');
    Route::get('task-attachments/{taskAttachment}', [TaskAttachmentController::class, 'show'])
        ->name('task-attachments.show');
    Route::get('task-attachments/{taskAttachment}/download', [TaskAttachmentController::class, 'download'])
        ->name('task-attachments.download');
});
