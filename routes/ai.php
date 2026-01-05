<?php

use App\Http\Controllers\AI\AIController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| AI Routes
|--------------------------------------------------------------------------
|
| These routes handle AI-powered features. All routes require authentication
| and an active Pro subscription (enforced by the 'ai' middleware).
|
*/

Route::middleware(['auth', 'verified'])->prefix('api/ai')->name('api.ai.')->group(function () {
    // Status endpoint - no AI middleware (allows checking if user can use AI)
    Route::get('/status', [AIController::class, 'status'])->name('status');

    // AI-powered endpoints - require Pro subscription
    Route::middleware('ai')->group(function () {
        // Task-related AI features
        Route::post('/tasks/parse', [AIController::class, 'parseTask'])->name('tasks.parse');
        Route::post('/tasks/description', [AIController::class, 'generateDescription'])->name('tasks.description');
        Route::post('/tasks/priority', [AIController::class, 'suggestPriority'])->name('tasks.priority');

        // Project-specific AI features
        Route::post('/projects/{project}/labels/suggest', [AIController::class, 'suggestLabels'])
            ->name('projects.labels.suggest');
        Route::post('/projects/{project}/chat', [AIController::class, 'chat'])
            ->name('projects.chat');
        Route::post('/projects/{project}/chat/stream', [AIController::class, 'streamChat'])
            ->name('projects.chat.stream');

        // Conversation history management
        Route::get('/projects/{project}/chat/history', [AIController::class, 'getHistory'])
            ->name('projects.chat.history');
        Route::delete('/projects/{project}/chat/history', [AIController::class, 'clearHistory'])
            ->name('projects.chat.history.clear');
    });
});
