<?php

use App\Http\Controllers\Attachments\AttachmentController;
use App\Http\Controllers\Conversations\ConversationController;
use App\Http\Controllers\Conversations\MessageController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Conversation Routes
|--------------------------------------------------------------------------
|
| Routes for managing conversations (chat), messages, and attachments.
|
*/

Route::middleware(['auth', 'verified'])->group(function () {
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
    Route::get('api/conversations/{conversation}/participants', [MessageController::class, 'participants'])
        ->name('api.conversations.participants');
    Route::post('conversations/{conversation}/messages', [MessageController::class, 'store'])
        ->middleware('throttle:60,1') // 60 messages per minute
        ->name('conversations.messages.store');
    Route::delete('conversations/{conversation}/messages/{message}', [MessageController::class, 'destroy'])
        ->middleware('throttle:30,1') // 30 deletes per minute
        ->name('conversations.messages.destroy');
    Route::post('conversations/{conversation}/messages/read', [MessageController::class, 'markAsRead'])
        ->name('conversations.messages.read');
    Route::post('conversations/{conversation}/typing', [MessageController::class, 'typing'])
        ->middleware('throttle:30,1') // 30 typing events per minute
        ->name('conversations.typing');

    // Attachments (secure access with authorization)
    Route::get('attachments/{attachment}', [AttachmentController::class, 'show'])
        ->name('attachments.show');
    Route::get('attachments/{attachment}/download', [AttachmentController::class, 'download'])
        ->name('attachments.download');
});
