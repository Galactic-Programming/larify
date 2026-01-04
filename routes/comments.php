<?php

use App\Http\Controllers\TaskComments\TaskCommentController;
use App\Http\Controllers\TaskComments\TaskCommentReactionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Comment Routes
|--------------------------------------------------------------------------
|
| Routes for managing task comments and comment reactions.
|
*/

Route::middleware(['auth', 'verified'])->group(function () {
    // Task Comments
    Route::get('api/projects/{project}/tasks/{task}/comments', [TaskCommentController::class, 'index'])
        ->name('api.projects.tasks.comments.index');
    Route::post('projects/{project}/tasks/{task}/comments', [TaskCommentController::class, 'store'])
        ->middleware('throttle:60,1')
        ->name('projects.tasks.comments.store');
    Route::patch('projects/{project}/tasks/{task}/comments/{comment}', [TaskCommentController::class, 'update'])
        ->middleware('throttle:30,1')
        ->name('projects.tasks.comments.update');
    Route::delete('projects/{project}/tasks/{task}/comments/{comment}', [TaskCommentController::class, 'destroy'])
        ->middleware('throttle:30,1')
        ->name('projects.tasks.comments.destroy');

    // Comment Reactions
    Route::post('projects/{project}/tasks/{task}/comments/{comment}/reactions', [TaskCommentReactionController::class, 'toggle'])
        ->middleware('throttle:60,1')
        ->name('projects.tasks.comments.reactions.toggle');
});
