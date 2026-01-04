<?php

declare(strict_types=1);

namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\AI\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
     */
    public function suggestLabels(Request $request, Project $project): JsonResponse
    {
        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
        ]);

        $availableLabels = $project->labels()->pluck('name')->toArray();

        $suggestions = $this->geminiService->suggestLabels(
            $request->input('title'),
            $request->input('description'),
            $availableLabels
        );

        $this->geminiService->incrementUsage($request->user());

        return response()->json([
            'data' => ['labels' => $suggestions],
            'remaining_requests' => $this->geminiService->getRemainingRequests($request->user()),
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
     */
    public function chat(Request $request, Project $project): JsonResponse
    {
        $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $projectContext = [
            'name' => $project->name,
            'total_tasks' => $project->tasks()->count(),
            'completed_tasks' => $project->tasks()->whereNotNull('completed_at')->count(),
            'pending_tasks' => $project->tasks()->whereNull('completed_at')->count(),
        ];

        $response = $this->geminiService->chat(
            $request->input('message'),
            $projectContext
        );

        if (! $response) {
            return response()->json([
                'message' => 'Failed to get AI response. Please try again.',
            ], 422);
        }

        $this->geminiService->incrementUsage($request->user());

        return response()->json([
            'data' => ['response' => $response],
            'remaining_requests' => $this->geminiService->getRemainingRequests($request->user()),
        ]);
    }

    /**
     * Parse meeting notes into multiple tasks.
     */
    public function parseMeetingNotes(Request $request): JsonResponse
    {
        $request->validate([
            'notes' => ['required', 'string', 'max:10000'],
        ]);

        $tasks = $this->geminiService->parseMeetingNotes($request->input('notes'));

        if (empty($tasks)) {
            return response()->json([
                'message' => 'No tasks could be extracted from the meeting notes.',
            ], 422);
        }

        $this->geminiService->incrementUsage($request->user());

        return response()->json([
            'data' => ['tasks' => $tasks],
            'remaining_requests' => $this->geminiService->getRemainingRequests($request->user()),
        ]);
    }
}
