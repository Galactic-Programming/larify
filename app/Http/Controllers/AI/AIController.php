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

}
