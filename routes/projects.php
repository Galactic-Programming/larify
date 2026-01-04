<?php

use App\Http\Controllers\Api\UserSearchController;
use App\Http\Controllers\Projects\LabelController;
use App\Http\Controllers\Projects\ProjectController;
use App\Http\Controllers\Projects\ProjectMemberController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Project Routes
|--------------------------------------------------------------------------
|
| Routes for managing projects, project members, and project labels.
|
*/

Route::middleware(['auth', 'verified'])->group(function () {
    // Projects
    Route::resource('projects', ProjectController::class);
    Route::patch('projects/{project}/archive', [ProjectController::class, 'toggleArchive'])
        ->name('projects.archive');

    // Project Members
    Route::get('projects/{project}/members', [ProjectMemberController::class, 'index'])
        ->name('projects.members.index');
    Route::post('projects/{project}/members', [ProjectMemberController::class, 'store'])
        ->name('projects.members.store');
    Route::patch('projects/{project}/members/{member}', [ProjectMemberController::class, 'update'])
        ->name('projects.members.update');
    Route::delete('projects/{project}/members/{member}', [ProjectMemberController::class, 'destroy'])
        ->name('projects.members.destroy');

    // API: Search users for adding to project
    Route::get('api/projects/{project}/users/search', [UserSearchController::class, 'search'])
        ->name('api.projects.users.search');

    // Project Labels
    Route::get('projects/{project}/labels', [LabelController::class, 'index'])
        ->name('projects.labels.index');
    Route::post('projects/{project}/labels', [LabelController::class, 'store'])
        ->name('projects.labels.store');
    Route::patch('projects/{project}/labels/{label}', [LabelController::class, 'update'])
        ->name('projects.labels.update');
    Route::delete('projects/{project}/labels/{label}', [LabelController::class, 'destroy'])
        ->name('projects.labels.destroy');
});
