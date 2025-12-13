<?php

use App\Http\Controllers\Auth\SocialController;
use App\Http\Controllers\Projects\ProjectController;
use App\Http\Controllers\TaskLists\TaskListController;
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

    // Task Lists (nested under projects)
    Route::post('projects/{project}/lists', [TaskListController::class, 'store'])
        ->name('projects.lists.store');
    Route::patch('projects/{project}/lists/{list}', [TaskListController::class, 'update'])
        ->name('projects.lists.update');
    Route::delete('projects/{project}/lists/{list}', [TaskListController::class, 'destroy'])
        ->name('projects.lists.destroy');
    Route::patch('projects/{project}/lists/reorder', [TaskListController::class, 'reorder'])
        ->name('projects.lists.reorder');
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

require __DIR__.'/settings.php';
