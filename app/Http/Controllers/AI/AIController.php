<?php

declare(strict_types=1);

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\AI\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AIController extends Controller
{
    public function __construct(
        protected GeminiService $geminiService
    ) {}

    /**
     * Get AI usage status for current user.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'enabled' => config('ai.enabled'),
            'can_use' => $this->geminiService->canUserUseAI($user),
            'daily_usage' => $this->geminiService->getDailyUsage($user),
            'remaining_requests' => $this->geminiService->getRemainingRequests($user),
            'has_subscription' => $user->hasActiveSubscription(),
        ]);
    }

    /**
     * Parse natural language into task data.
     */
    public function parseTask(Request $request): JsonResponse
    {
        $request->validate([
            'text' => ['required', 'string', 'max:1000'],
        ]);

        $result = $this->geminiService->parseTaskFromText($request->input('text'));

        if (! $result) {
            return response()->json([
                'message' => 'Failed to parse task. Please try again.',
            ], 422);
        }

        // Increment usage after successful request
        $this->geminiService->incrementUsage($request->user());

        return response()->json([
            'data' => $result,
            'remaining_requests' => $this->geminiService->getRemainingRequests($request->user()),
        ]);
    }

    /**
     * Generate task description from title.
     */
    public function generateDescription(Request $request): JsonResponse
    {
        $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);

        $description = $this->geminiService->generateTaskDescription($request->input('title'));

        if (! $description) {
            return response()->json([
                'message' => 'Failed to generate description. Please try again.',
            ], 422);
        }

        $this->geminiService->incrementUsage($request->user());

        return response()->json([
            'data' => ['description' => $description],
            'remaining_requests' => $this->geminiService->getRemainingRequests($request->user()),
        ]);
    }

    /**
     * Suggest labels for a task.
     *
     * If project has labels: suggests from existing labels (Owner & Editor)
     * If project has no labels: generates new label suggestions (Owner only)
     */
    public function suggestLabels(Request $request, Project $project): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        // Check if user is a member of the project
        if (! $project->hasMember($user)) {
            return response()->json([
                'message' => 'You are not a member of this project.',
            ], 403);
        }

        // Check if user can edit (Owner or Editor, not Viewer)
        $role = $project->getMemberRole($user);
        if (! $role?->canEdit()) {
            return response()->json([
                'message' => 'You do not have permission to use this feature.',
            ], 403);
        }

        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
        ]);

        $availableLabels = $project->labels()->pluck('name')->toArray();

        // If project has labels, suggest from existing ones (Owner & Editor can use)
        if (! empty($availableLabels)) {
            $suggestions = $this->geminiService->suggestLabels(
                $request->input('title'),
                $request->input('description'),
                $availableLabels
            );

            $this->geminiService->incrementUsage($user);

            return response()->json([
                'data' => [
                    'labels' => $suggestions,
                    'type' => 'existing',
                ],
                'remaining_requests' => $this->geminiService->getRemainingRequests($user),
            ]);
        }

        // If no labels exist, only Owner can generate new label suggestions
        $isOwner = $project->user_id === $user->id;
        if (! $isOwner) {
            return response()->json([
                'data' => [
                    'labels' => [],
                    'type' => 'none',
                    'message' => 'No labels available. Ask the project owner to create some.',
                ],
                'remaining_requests' => $this->geminiService->getRemainingRequests($user),
            ]);
        }

        // Generate new label suggestions (Owner only)
        $generatedLabels = $this->geminiService->generateLabelSuggestions(
            $request->input('title'),
            $request->input('description'),
            $project->name
        );

        $this->geminiService->incrementUsage($user);

        return response()->json([
            'data' => [
                'labels' => $generatedLabels,
                'type' => 'generated',
            ],
            'remaining_requests' => $this->geminiService->getRemainingRequests($user),
        ]);
    }

    /**
     * Suggest priority for a task.
     */
    public function suggestPriority(Request $request): JsonResponse
    {
        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
        ]);

        $priority = $this->geminiService->suggestPriority(
            $request->input('title'),
            $request->input('description')
        );

        $this->geminiService->incrementUsage($request->user());

        return response()->json([
            'data' => ['priority' => $priority],
            'remaining_requests' => $this->geminiService->getRemainingRequests($request->user()),
        ]);
    }

    /**
     * Chat with AI assistant about a project.
     * All project members (Owner, Editor, Viewer) can use chat.
     * Supports conversation history for context-aware responses.
     */
    public function chat(Request $request, Project $project): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        // Check if user is a member of the project
        if (! $project->hasMember($user)) {
            return response()->json([
                'message' => 'You are not a member of this project.',
            ], 403);
        }

        $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'include_history' => ['nullable', 'boolean'],
        ]);

        $projectContext = [
            'name' => $project->name,
            'total_tasks' => $project->tasks()->count(),
            'completed_tasks' => $project->tasks()->whereNotNull('completed_at')->count(),
            'pending_tasks' => $project->tasks()->whereNull('completed_at')->count(),
        ];

        $message = $request->input('message');
        $includeHistory = $request->input('include_history', true);
        $history = [];

        // Get conversation history if enabled
        if ($includeHistory) {
            $history = $this->geminiService->getConversationHistory($user->id, $project->id);
        }

        $response = $this->geminiService->chat($message, $projectContext, $history);

        if (! $response) {
            return response()->json([
                'message' => 'Failed to get AI response. Please try again.',
            ], 422);
        }

        // Save both user message and AI response to history
        if ($includeHistory) {
            $this->geminiService->saveToConversationHistory($user->id, $project->id, 'user', $message);
            $this->geminiService->saveToConversationHistory($user->id, $project->id, 'model', $response);
        }

        $this->geminiService->incrementUsage($user);

        return response()->json([
            'data' => [
                'response' => $response,
                'history_enabled' => $includeHistory,
            ],
            'remaining_requests' => $this->geminiService->getRemainingRequests($request->user()),
        ]);
    }

    /**
     * Get conversation history for a project.
     */
    public function getHistory(Request $request, Project $project): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if (! $project->hasMember($user)) {
            return response()->json([
                'message' => 'You are not a member of this project.',
            ], 403);
        }

        $history = $this->geminiService->getConversationHistory($user->id, $project->id);

        return response()->json([
            'data' => [
                'history' => $history,
                'count' => count($history),
            ],
        ]);
    }

    /**
     * Clear conversation history for a project.
     */
    public function clearHistory(Request $request, Project $project): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        if (! $project->hasMember($user)) {
            return response()->json([
                'message' => 'You are not a member of this project.',
            ], 403);
        }

        $this->geminiService->clearConversationHistory($user->id, $project->id);

        return response()->json([
            'message' => 'Conversation history cleared.',
        ]);
    }

    /**
     * Stream chat response with AI assistant.
     * Uses Server-Sent Events (SSE) to stream the response.
     */
    public function streamChat(Request $request, Project $project): StreamedResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();

        // Check if user is a member of the project
        if (! $project->hasMember($user)) {
            return response()->stream(function () {
                echo "event: error\n";
                echo 'data: '.json_encode(['message' => 'You are not a member of this project.'])."\n\n";
            }, 403, $this->getStreamHeaders());
        }

        $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'include_history' => ['nullable', 'boolean'],
        ]);

        $message = $request->input('message');
        $includeHistory = $request->input('include_history', true);

        $projectContext = [
            'name' => $project->name,
            'total_tasks' => $project->tasks()->count(),
            'completed_tasks' => $project->tasks()->whereNotNull('completed_at')->count(),
            'pending_tasks' => $project->tasks()->whereNull('completed_at')->count(),
        ];

        $systemPrompt = str_replace(
            ['{project_name}', '{total_tasks}', '{completed_tasks}', '{pending_tasks}'],
            [
                $projectContext['name'],
                $projectContext['total_tasks'],
                $projectContext['completed_tasks'],
                $projectContext['pending_tasks'],
            ],
            config('ai.prompts.chat_assistant')
        );

        $history = [];
        if ($includeHistory) {
            $history = $this->geminiService->getConversationHistory($user->id, $project->id);
        }

        // Capture variables for the closure
        $geminiService = $this->geminiService;
        $userId = $user->id;
        $projectId = $project->id;

        return response()->stream(function () use ($geminiService, $message, $history, $systemPrompt, $includeHistory, $userId, $projectId) {
            // Disable output buffering
            if (ob_get_level()) {
                ob_end_clean();
            }

            $fullResponse = '';

            try {
                // Get streaming response
                $stream = $geminiService->streamChatWithHistory($message, $history, 'chat_assistant', $systemPrompt);

                if ($stream === null) {
                    echo "event: error\n";
                    echo 'data: '.json_encode(['message' => 'Failed to get AI response.'])."\n\n";

                    return;
                }

                foreach ($stream as $chunk) {
                    if ($chunk) {
                        $fullResponse .= $chunk;
                        echo "event: chunk\n";
                        echo 'data: '.json_encode(['content' => $chunk])."\n\n";
                        flush();
                    }
                }

                // Save to history after successful response
                if ($includeHistory && $fullResponse) {
                    $geminiService->saveToConversationHistory($userId, $projectId, 'user', $message);
                    $geminiService->saveToConversationHistory($userId, $projectId, 'model', $fullResponse);
                }

                // Send completion event
                echo "event: done\n";
                echo 'data: '.json_encode([
                    'complete' => true,
                    'remaining_requests' => $geminiService->getRemainingRequests(
                        \App\Models\User::find($userId)
                    ),
                ])."\n\n";
                flush();

            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('AI Stream Error', [
                    'message' => $e->getMessage(),
                    'user_id' => $userId,
                    'project_id' => $projectId,
                ]);

                echo "event: error\n";
                echo 'data: '.json_encode(['message' => 'Streaming failed. Please try again.'])."\n\n";
                flush();
            }

            // Increment usage
            $geminiService->incrementUsage(\App\Models\User::find($userId));

        }, 200, $this->getStreamHeaders());
    }

    /**
     * Get headers for SSE streaming.
     *
     * @return array<string, string>
     */
    protected function getStreamHeaders(): array
    {
        return [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no', // Disable nginx buffering
        ];
    }
}
