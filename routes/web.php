<?php

use App\Http\Controllers\Activities\ActivityController;
use App\Http\Controllers\Api\UserSearchController;
use App\Http\Controllers\Attachments\AttachmentController;
use App\Http\Controllers\Auth\SocialController;
use App\Http\Controllers\Conversations\ConversationController;
use App\Http\Controllers\Conversations\MessageController;
use App\Http\Controllers\Conversations\ReactionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Notifications\NotificationController;
use App\Http\Controllers\Projects\LabelController;
use App\Http\Controllers\Projects\ProjectController;
use App\Http\Controllers\Projects\ProjectMemberController;
use App\Http\Controllers\Projects\ProjectTrashController;
use App\Http\Controllers\TaskComments\TaskCommentController;
use App\Http\Controllers\TaskComments\TaskCommentReactionController;
use App\Http\Controllers\TaskLists\TaskListController;
use App\Http\Controllers\Tasks\TaskAttachmentController;
use App\Http\Controllers\Tasks\TaskController;
use App\Http\Controllers\Tasks\TaskLabelController;
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
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

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

    // Project Labels
    Route::get('projects/{project}/labels', [LabelController::class, 'index'])
        ->name('projects.labels.index');
    Route::post('projects/{project}/labels', [LabelController::class, 'store'])
        ->name('projects.labels.store');
    Route::patch('projects/{project}/labels/{label}', [LabelController::class, 'update'])
        ->name('projects.labels.update');
    Route::delete('projects/{project}/labels/{label}', [LabelController::class, 'destroy'])
        ->name('projects.labels.destroy');

    // Task Labels
    Route::put('projects/{project}/tasks/{task}/labels', [TaskLabelController::class, 'sync'])
        ->name('projects.tasks.labels.sync');
    Route::post('projects/{project}/tasks/{task}/labels/attach', [TaskLabelController::class, 'attach'])
        ->name('projects.tasks.labels.attach');
    Route::post('projects/{project}/tasks/{task}/labels/detach', [TaskLabelController::class, 'detach'])
        ->name('projects.tasks.labels.detach');

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
    Route::post('projects/{project}/tasks/{task}/comments/{comment}/reactions', [TaskCommentReactionController::class, 'toggle'])
        ->middleware('throttle:60,1')
        ->name('projects.tasks.comments.reactions.toggle');

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
    Route::get('conversations/{conversation}', [ConversationController::class, 'show'])
        ->name('conversations.show');
    Route::get('projects/{project}/chat', [ConversationController::class, 'showByProject'])
        ->name('projects.chat');

    // Messages
    Route::get('api/conversations/{conversation}/messages', [MessageController::class, 'index'])
        ->name('api.conversations.messages.index');
    Route::get('api/conversations/{conversation}/messages/search', [MessageController::class, 'search'])
        ->name('api.conversations.messages.search');
    Route::post('conversations/{conversation}/messages', [MessageController::class, 'store'])
        ->middleware('throttle:60,1') // 60 messages per minute
        ->name('conversations.messages.store');
    Route::patch('conversations/{conversation}/messages/{message}', [MessageController::class, 'update'])
        ->middleware('throttle:30,1') // 30 edits per minute
        ->name('conversations.messages.update');
    Route::delete('conversations/{conversation}/messages/{message}', [MessageController::class, 'destroy'])
        ->middleware('throttle:30,1') // 30 deletes per minute
        ->name('conversations.messages.destroy');
    Route::post('conversations/{conversation}/messages/read', [MessageController::class, 'markAsRead'])
        ->name('conversations.messages.read');
    Route::post('conversations/{conversation}/typing', [MessageController::class, 'typing'])
        ->middleware('throttle:30,1') // 30 typing events per minute
        ->name('conversations.typing');

    // Reactions
    Route::post('messages/{message}/reactions', [ReactionController::class, 'toggle'])
        ->middleware('throttle:60,1') // 60 reaction toggles per minute
        ->name('messages.reactions.toggle');

    // Attachments (secure access with authorization)
    Route::get('attachments/{attachment}', [AttachmentController::class, 'show'])
        ->name('attachments.show');
    Route::get('attachments/{attachment}/download', [AttachmentController::class, 'download'])
        ->name('attachments.download');
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
