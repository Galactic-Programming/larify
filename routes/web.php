<?php

use App\Http\Controllers\Auth\SocialController;
use App\Http\Controllers\Projects\ProjectController;
use App\Http\Controllers\Projects\ProjectMemberController;
use App\Http\Controllers\TaskLists\TaskListController;
use App\Http\Controllers\Tasks\TaskController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

// Guest
Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// Authenticated
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

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

    // Task Lists (nested under projects)
    Route::post('projects/{project}/lists', [TaskListController::class, 'store'])
        ->name('projects.lists.store');
    Route::patch('projects/{project}/lists/{list}', [TaskListController::class, 'update'])
        ->name('projects.lists.update');
    Route::delete('projects/{project}/lists/{list}', [TaskListController::class, 'destroy'])
        ->name('projects.lists.destroy');
    Route::patch('projects/{project}/lists/reorder', [TaskListController::class, 'reorder'])
        ->name('projects.lists.reorder');

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
    Route::patch('projects/{project}/tasks/{task}/start', [TaskController::class, 'start'])
        ->name('projects.tasks.start');
    Route::patch('projects/{project}/tasks/{task}/complete', [TaskController::class, 'complete'])
        ->name('projects.tasks.complete');
});

// Terms & Privacy
Route::get('/terms', function () {
    return Inertia::render('auth/condition', ['type' => 'terms']);
})->name('terms');

Route::get('/privacy', function () {
    return Inertia::render('auth/condition', ['type' => 'privacy']);
})->name('privacy');

// Social Authentication
Route::get('auth/{provider}/redirect', [SocialController::class, 'redirect'])
    ->whereIn('provider', ['google', 'github'])
    ->name('social.redirect');

Route::get('auth/{provider}/callback', [SocialController::class, 'callback'])
    ->whereIn('provider', ['google', 'github'])
    ->name('social.callback');

require __DIR__ . '/settings.php';
