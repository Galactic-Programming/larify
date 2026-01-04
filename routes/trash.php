<?php

use App\Http\Controllers\Projects\ProjectTrashController;
use App\Http\Controllers\Trash\TrashController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Trash Routes
|--------------------------------------------------------------------------
|
| Routes for managing global trash and project-specific trash.
|
*/

Route::middleware(['auth', 'verified'])->group(function () {
    // Global Trash
    Route::get('trash', [TrashController::class, 'index'])
        ->name('trash.index');
    Route::patch('trash/projects/{project}/restore', [TrashController::class, 'restoreProject'])
        ->name('trash.projects.restore');
    Route::delete('trash/projects/{project}', [TrashController::class, 'forceDeleteProject'])
        ->name('trash.projects.force-delete');
    Route::patch('trash/lists/{list}/restore', [TrashController::class, 'restoreList'])
        ->name('trash.lists.restore');
    Route::delete('trash/lists/{list}', [TrashController::class, 'forceDeleteList'])
        ->name('trash.lists.force-delete');
    Route::patch('trash/tasks/{task}/restore', [TrashController::class, 'restoreTask'])
        ->name('trash.tasks.restore');
    Route::delete('trash/tasks/{task}', [TrashController::class, 'forceDeleteTask'])
        ->name('trash.tasks.force-delete');
    Route::delete('trash', [TrashController::class, 'emptyTrash'])
        ->name('trash.empty');

    // Project Trash
    Route::get('api/projects/{project}/trash', [ProjectTrashController::class, 'index'])
        ->name('api.projects.trash.index');
    Route::patch('projects/{project}/trash/lists/{list}/restore', [ProjectTrashController::class, 'restoreList'])
        ->name('projects.trash.lists.restore');
    Route::delete('projects/{project}/trash/lists/{list}', [ProjectTrashController::class, 'forceDeleteList'])
        ->name('projects.trash.lists.force-delete');
    Route::patch('projects/{project}/trash/tasks/{task}/restore', [ProjectTrashController::class, 'restoreTask'])
        ->name('projects.trash.tasks.restore');
    Route::delete('projects/{project}/trash/tasks/{task}', [ProjectTrashController::class, 'forceDeleteTask'])
        ->name('projects.trash.tasks.force-delete');
    Route::delete('projects/{project}/trash', [ProjectTrashController::class, 'emptyTrash'])
        ->name('projects.trash.empty');
});
