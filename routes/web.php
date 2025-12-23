<?php

use App\Http\Controllers\Activities\ActivityController;
use App\Http\Controllers\Api\UserSearchController;
use App\Http\Controllers\Auth\SocialController;
use App\Http\Controllers\Conversations\ConversationController;
use App\Http\Controllers\Conversations\ConversationParticipantController;
use App\Http\Controllers\Conversations\MessageController;
use App\Http\Controllers\Notifications\NotificationController;
use App\Http\Controllers\Projects\ProjectController;
use App\Http\Controllers\Projects\ProjectMemberController;
use App\Http\Controllers\Projects\ProjectTrashController;
use App\Http\Controllers\TaskLists\TaskListController;
use App\Http\Controllers\Tasks\TaskController;
use App\Http\Controllers\Trash\TrashController;
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

    // API: Search users for adding to project
    Route::get('api/projects/{project}/users/search', [UserSearchController::class, 'search'])
        ->name('api.projects.users.search');

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

    // Conversations (Chat)
    Route::get('conversations', [ConversationController::class, 'index'])
        ->name('conversations.index');
    Route::post('conversations', [ConversationController::class, 'store'])
        ->name('conversations.store');
    Route::get('conversations/{conversation}', [ConversationController::class, 'show'])
        ->name('conversations.show');
    Route::patch('conversations/{conversation}', [ConversationController::class, 'update'])
        ->name('conversations.update');
    Route::delete('conversations/{conversation}', [ConversationController::class, 'destroy'])
        ->name('conversations.destroy');
    Route::post('conversations/{conversation}/leave', [ConversationController::class, 'leave'])
        ->name('conversations.leave');

    // Conversation Participants
    Route::post('conversations/{conversation}/participants', [ConversationParticipantController::class, 'store'])
        ->name('conversations.participants.store');
    Route::patch('conversations/{conversation}/participants/{participant}', [ConversationParticipantController::class, 'update'])
        ->name('conversations.participants.update');
    Route::delete('conversations/{conversation}/participants/{participant}', [ConversationParticipantController::class, 'destroy'])
        ->name('conversations.participants.destroy');
    Route::post('conversations/{conversation}/participants/{participant}/transfer-ownership', [ConversationParticipantController::class, 'transferOwnership'])
        ->name('conversations.participants.transfer-ownership');

    // Messages
    Route::get('api/conversations/{conversation}/messages', [MessageController::class, 'index'])
        ->name('api.conversations.messages.index');
    Route::post('conversations/{conversation}/messages', [MessageController::class, 'store'])
        ->name('conversations.messages.store');
    Route::patch('conversations/{conversation}/messages/{message}', [MessageController::class, 'update'])
        ->name('conversations.messages.update');
    Route::delete('conversations/{conversation}/messages/{message}', [MessageController::class, 'destroy'])
        ->name('conversations.messages.destroy');
    Route::post('conversations/{conversation}/messages/read', [MessageController::class, 'markAsRead'])
        ->name('conversations.messages.read');
    Route::post('conversations/{conversation}/typing', [MessageController::class, 'typing'])
        ->name('conversations.typing');
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

require __DIR__.'/settings.php';
require __DIR__.'/billing.php';
