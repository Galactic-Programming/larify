<?php

use App\Http\Controllers\Auth\SocialController;
use App\Http\Controllers\DashboardController;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Core application routes. Feature-specific routes are organized in
| separate files for better maintainability:
|
| - projects.php      → Projects, members, labels
| - tasks.php         → Task lists, tasks, task labels, attachments
| - comments.php      → Task comments, reactions
| - notifications.php → Notifications, activities
| - trash.php         → Global & project trash
| - conversations.php → Chat, messages, attachments
| - settings.php      → User settings
| - billing.php       → Subscription & billing
| - ai.php            → AI features
|
*/

// Guest
Route::get('/', function () {
    return Inertia::render('welcome/index', [
        'canRegister' => Features::enabled(Features::registration()),
        'activeUsersCount' => User::count(),
    ]);
})->name('home');

// Authenticated - Dashboard
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

// Terms & Privacy
Route::get('/terms', function () {
    return Inertia::render('auth/condition', ['type' => 'terms']);
})->name('terms');

Route::get('/privacy', function () {
    return Inertia::render('auth/condition', ['type' => 'privacy']);
})->name('privacy');

// Error Pages
Route::get('/something-went-wrong', function () {
    return Inertia::render('errors/something-went-wrong', [
        'flash' => session()->only(['error', 'success']),
    ]);
})->name('error.general');

// Social Authentication
Route::get('auth/{provider}/redirect', [SocialController::class, 'redirect'])
    ->whereIn('provider', ['google', 'github'])
    ->name('social.redirect');

Route::get('auth/{provider}/callback', [SocialController::class, 'callback'])
    ->whereIn('provider', ['google', 'github'])
    ->name('social.callback');

// Feature Routes
require __DIR__.'/projects.php';
require __DIR__.'/tasks.php';
require __DIR__.'/comments.php';
require __DIR__.'/notifications.php';
require __DIR__.'/trash.php';
require __DIR__.'/conversations.php';
require __DIR__.'/settings.php';
require __DIR__.'/billing.php';
