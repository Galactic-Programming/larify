<?php

use App\Http\Controllers\Activities\ActivityController;
use App\Http\Controllers\Notifications\NotificationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Notification Routes
|--------------------------------------------------------------------------
|
| Routes for managing notifications and activities.
|
*/

Route::middleware(['auth', 'verified'])->group(function () {
    // Notifications
    Route::get('notifications', [NotificationController::class, 'index'])
        ->name('notifications.index');
    Route::get('api/notifications', [NotificationController::class, 'list'])
        ->name('api.notifications.list');
    Route::get('api/notifications/unread-count', [NotificationController::class, 'unreadCount'])
        ->name('api.notifications.unread-count');
    Route::patch('api/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])
        ->name('api.notifications.mark-read');
    Route::patch('api/notifications/read-all', [NotificationController::class, 'markAllAsRead'])
        ->name('api.notifications.mark-all-read');
    // Note: destroyRead must come BEFORE destroy to avoid {notification} capturing "read"
    Route::delete('api/notifications/read', [NotificationController::class, 'destroyRead'])
        ->name('api.notifications.destroy-read');
    Route::delete('api/notifications/{notification}', [NotificationController::class, 'destroy'])
        ->name('api.notifications.destroy');

    // Activities
    Route::get('api/activities', [ActivityController::class, 'list'])
        ->name('api.activities.list');
    Route::get('api/projects/{project}/activities', [ActivityController::class, 'forProject'])
        ->name('api.projects.activities');
});
