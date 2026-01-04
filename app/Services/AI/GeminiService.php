<?php

declare(strict_types=1);

namespace App\Services\AI;

use App\Models\User;
use Gemini\Data\GenerationConfig;
use Gemini\Laravel\Facades\Gemini;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    /**
     * Generate content using Gemini API.
     */
    public function generate(
        string $prompt,
        string $configKey = 'task_creation',
        ?string $systemPrompt = null
    ): ?string {
        if (! config('ai.enabled')) {
            return null;
        }

        try {
            $modelConfig = config("ai.models.{$configKey}", config('ai.models.task_creation'));
            $model = $modelConfig['model'] ?? config('ai.default_model');

            $generativeModel = Gemini::generativeModel($model)
                ->withGenerationConfig(new GenerationConfig(
                    temperature: $modelConfig['temperature'] ?? 0.7,
                    maxOutputTokens: $modelConfig['max_output_tokens'] ?? 1024,
                ));

            if ($systemPrompt) {
                $generativeModel = $generativeModel->withSystemInstruction($systemPrompt);
            }

            $response = $generativeModel->generateContent($prompt);

            return $response->text();
        } catch (\Exception $e) {
            Log::error('Gemini API Error', [
                'message' => $e->getMessage(),
                'prompt' => substr($prompt, 0, 100),
            ]);

            return null;
        }
    }

    /**
     * Parse natural language into task data.
     */
    public function parseTaskFromText(string $text): ?array
    {
        $systemPrompt = config('ai.prompts.task_creation');
        $response = $this->generate($text, 'task_creation', $systemPrompt);

        if (! $response) {
            return null;
        }

        return $this->parseJson($response);
    }

    /**
     * Generate task description from title.
     */
    public function generateTaskDescription(string $title): ?string
    {
        $systemPrompt = config('ai.prompts.description_generator');
        $prompt = "Generate a detailed description for this task: {$title}";

        return $this->generate($prompt, 'description_generator', $systemPrompt);
    }

    /**
     * Suggest labels for a task.
     *
     * @param  array<string>  $availableLabels
     * @return array<string>
     */
    public function suggestLabels(string $title, ?string $description, array $availableLabels): array
    {
        if (empty($availableLabels)) {
            return [];
        }

        $systemPrompt = str_replace(
            '{labels}',
            implode(', ', $availableLabels),
            config('ai.prompts.label_suggestions')
        );

        $prompt = "Task: {$title}";
        if ($description) {
            $prompt .= "\nDescription: {$description}";
        }

        $response = $this->generate($prompt, 'suggestions', $systemPrompt);

        if (! $response) {
            return [];
        }

        $labels = $this->parseJson($response);

        return is_array($labels) ? array_intersect($labels, $availableLabels) : [];
    }

    /**
     * Suggest priority for a task.
     */
    public function suggestPriority(string $title, ?string $description): string
    {
        $systemPrompt = config('ai.prompts.priority_suggestion');

        $prompt = "Task: {$title}";
        if ($description) {
            $prompt .= "\nDescription: {$description}";
        }

        $response = $this->generate($prompt, 'suggestions', $systemPrompt);

        $validPriorities = ['low', 'medium', 'high', 'urgent'];
        $response = strtolower(trim($response ?? 'medium'));

        return in_array($response, $validPriorities) ? $response : 'medium';
    }

    /**
     * Chat with AI assistant about a project.
     *
     * @param  array<string, mixed>  $projectContext
     */
    public function chat(string $message, array $projectContext): ?string
    {
        $systemPrompt = str_replace(
            ['{project_name}', '{total_tasks}', '{completed_tasks}', '{pending_tasks}'],
            [
                $projectContext['name'] ?? 'Unknown',
                $projectContext['total_tasks'] ?? 0,
                $projectContext['completed_tasks'] ?? 0,
                $projectContext['pending_tasks'] ?? 0,
            ],
            config('ai.prompts.chat_assistant')
        );

        return $this->generate($message, 'chat_assistant', $systemPrompt);
    }

    /**
     * Parse meeting notes into tasks.
     *
     * @return array<array<string, mixed>>
     */
    public function parseMeetingNotes(string $notes): array
    {
        $systemPrompt = config('ai.prompts.meeting_notes_parser');
        $response = $this->generate($notes, 'task_creation', $systemPrompt);

        if (! $response) {
            return [];
        }

        $tasks = $this->parseJson($response);

        return is_array($tasks) ? $tasks : [];
    }

    /**
     * Check if user can use AI (has Pro subscription and within daily limit).
     */
    public function canUserUseAI(User $user): bool
    {
        // Check if AI is enabled globally
        if (! config('ai.enabled')) {
            return false;
        }

        // Check if user has active subscription (Pro or Business)
        if (! $user->hasActiveSubscription()) {
            return false;
        }

        // Check daily limit
        return ! $this->hasReachedDailyLimit($user);
    }

    /**
     * Check if user has reached their daily AI request limit.
     */
    public function hasReachedDailyLimit(User $user): bool
    {
        $plan = $user->subscribed('default') ? 'pro' : 'free';

        // Business plan check (if you have tiered subscriptions)
        // $plan = $user->subscribedToPrice('price_business') ? 'business' : $plan;

        $limit = config("ai.daily_limits.{$plan}", 0);

        if ($limit === 0) {
            return true; // Free plan has no AI access
        }

        $usage = $this->getDailyUsage($user);

        return $usage >= $limit;
    }

    /**
     * Get user's daily AI usage count.
     */
    public function getDailyUsage(User $user): int
    {
        $cacheKey = "ai_usage:{$user->id}:".now()->format('Y-m-d');

        return (int) Cache::get($cacheKey, 0);
    }

    /**
     * Increment user's daily AI usage.
     */
    public function incrementUsage(User $user): void
    {
        $cacheKey = "ai_usage:{$user->id}:".now()->format('Y-m-d');

        $currentUsage = (int) Cache::get($cacheKey, 0);
        Cache::put($cacheKey, $currentUsage + 1, now()->endOfDay());
    }

    /**
     * Get remaining AI requests for user today.
     */
    public function getRemainingRequests(User $user): int
    {
        $plan = $user->subscribed('default') ? 'pro' : 'free';
        $limit = config("ai.daily_limits.{$plan}", 0);
        $usage = $this->getDailyUsage($user);

        return max(0, $limit - $usage);
    }

    /**
     * Parse JSON from AI response, handling markdown code blocks.
     */
    protected function parseJson(string $response): mixed
    {
        // Remove markdown code blocks if present
        $response = preg_replace('/^```(?:json)?\s*/m', '', $response);
        $response = preg_replace('/\s*```$/m', '', $response);
        $response = trim($response);

        try {
            return json_decode($response, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            Log::warning('Failed to parse AI JSON response', [
                'response' => substr($response, 0, 200),
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
