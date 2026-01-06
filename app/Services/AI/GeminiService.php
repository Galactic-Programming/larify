<?php

declare(strict_types=1);

namespace App\Services\AI;

use App\Models\User;
use Gemini\Data\Content;
use Gemini\Data\GenerationConfig;
use Gemini\Enums\Role;
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
                $generativeModel = $generativeModel->withSystemInstruction(
                    Content::parse($systemPrompt)
                );
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
     * Generate streaming content using Gemini API.
     * Yields partial responses as they become available.
     *
     * @return \Generator<string>|null
     */
    public function streamGenerate(
        string $prompt,
        string $configKey = 'chat_assistant',
        ?string $systemPrompt = null
    ): ?\Generator {
        if (! config('ai.enabled')) {
            return null;
        }

        try {
            $modelConfig = config("ai.models.{$configKey}", config('ai.models.chat_assistant'));
            $model = $modelConfig['model'] ?? config('ai.default_model');

            $generativeModel = Gemini::generativeModel($model)
                ->withGenerationConfig(new GenerationConfig(
                    temperature: $modelConfig['temperature'] ?? 0.7,
                    maxOutputTokens: $modelConfig['max_output_tokens'] ?? 4096,
                ));

            if ($systemPrompt) {
                $generativeModel = $generativeModel->withSystemInstruction(
                    Content::parse($systemPrompt)
                );
            }

            $stream = $generativeModel->streamGenerateContent($prompt);

            foreach ($stream as $response) {
                yield $response->text();
            }
        } catch (\Exception $e) {
            Log::error('Gemini Stream API Error', [
                'message' => $e->getMessage(),
                'prompt' => substr($prompt, 0, 100),
            ]);

            return null;
        }
    }

    /**
     * Generate content with conversation history (multi-turn chat).
     *
     * @param  array<array{role: string, content: string}>  $history
     */
    public function generateWithHistory(
        string $message,
        array $history = [],
        string $configKey = 'chat_assistant',
        ?string $systemPrompt = null
    ): ?string {
        if (! config('ai.enabled')) {
            return null;
        }

        try {
            $modelConfig = config("ai.models.{$configKey}", config('ai.models.chat_assistant'));
            $model = $modelConfig['model'] ?? config('ai.default_model');

            $generativeModel = Gemini::generativeModel($model)
                ->withGenerationConfig(new GenerationConfig(
                    temperature: $modelConfig['temperature'] ?? 0.7,
                    maxOutputTokens: $modelConfig['max_output_tokens'] ?? 2048,
                ));

            if ($systemPrompt) {
                $generativeModel = $generativeModel->withSystemInstruction(
                    Content::parse($systemPrompt)
                );
            }

            // Convert history to Gemini Content format
            $geminiHistory = $this->convertHistoryToGeminiFormat($history);

            // Start chat with history
            $chat = $generativeModel->startChat(history: $geminiHistory);

            // Send the new message
            $response = $chat->sendMessage($message);

            return $response->text();
        } catch (\Exception $e) {
            Log::error('Gemini Chat API Error', [
                'message' => $e->getMessage(),
                'history_count' => count($history),
            ]);

            return null;
        }
    }

    /**
     * Convert our history format to Gemini Content format.
     *
     * @param  array<array{role: string, content: string}>  $history
     * @return array<Content>
     */
    protected function convertHistoryToGeminiFormat(array $history): array
    {
        return array_map(function ($item) {
            $role = $item['role'] === 'user' ? Role::USER : Role::MODEL;

            return Content::parse(part: $item['content'], role: $role);
        }, $history);
    }

    /**
     * Parse natural language into task data.
     */
    public function parseTaskFromText(string $text): ?array
    {
        $systemPrompt = str_replace(
            '{current_date}',
            now()->format('Y-m-d (l, F j, Y)'),
            config('ai.prompts.task_creation')
        );
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
     * Generate new label suggestions for a task when project has no labels.
     *
     * @return array<array{name: string, color: string}>
     */
    public function generateLabelSuggestions(string $title, ?string $description, string $projectName): array
    {
        $systemPrompt = config('ai.prompts.label_generation');

        $prompt = "Project: {$projectName}\nTask: {$title}";
        if ($description) {
            $prompt .= "\nDescription: {$description}";
        }

        $response = $this->generate($prompt, 'suggestions', $systemPrompt);

        if (! $response) {
            return [];
        }

        $labels = $this->parseJson($response);

        if (! is_array($labels)) {
            return [];
        }

        // Validate and normalize the response
        $validColors = ['gray', 'red', 'yellow', 'green', 'blue', 'purple', 'pink', 'indigo', 'cyan', 'teal', 'orange', 'lime'];

        return array_values(array_filter(array_map(function ($label) use ($validColors) {
            if (! is_array($label) || ! isset($label['name'])) {
                return null;
            }

            return [
                'name' => substr($label['name'], 0, 50), // Max 50 chars
                'color' => in_array($label['color'] ?? 'blue', $validColors)
                    ? $label['color']
                    : 'blue',
            ];
        }, $labels)));
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
     * Chat with AI in a conversation context (with richer project data).
     *
     * @param  array<string, mixed>  $projectContext
     * @param  array<array{role: string, content: string}>  $history
     */
    public function chatInConversation(string $message, array $projectContext, array $history = []): ?string
    {
        $systemPrompt = $this->buildConversationSystemPrompt($projectContext);

        // Use multi-turn chat if history is provided
        if (! empty($history)) {
            return $this->generateWithHistory($message, $history, 'chat_assistant', $systemPrompt);
        }

        return $this->generate($message, 'chat_assistant', $systemPrompt);
    }

    /**
     * Build a comprehensive system prompt for conversation AI.
     *
     * @param  array<string, mixed>  $projectContext
     */
    protected function buildConversationSystemPrompt(array $projectContext): string
    {
        $prompt = "You are LaraFlow AI, an intelligent project management assistant integrated into team conversations.\n";
        $prompt .= "Today's date: ".now()->format('Y-m-d').' ('.now()->format('l').")\n\n";

        // Project Overview
        $prompt .= "# PROJECT: {$projectContext['name']}\n";
        if (! empty($projectContext['description'])) {
            $prompt .= "Description: {$projectContext['description']}\n";
        }
        $prompt .= "Created: {$projectContext['created_at']}\n\n";

        // Statistics Summary
        $prompt .= "## 📊 Project Statistics\n";
        $prompt .= "- Total Tasks: {$projectContext['total_tasks']}\n";
        $prompt .= "- Completed: {$projectContext['completed_tasks']} ({$projectContext['completion_rate']}%)\n";
        $prompt .= "- Pending: {$projectContext['pending_tasks']}\n";
        $prompt .= "- Overdue: {$projectContext['overdue_count']}\n\n";

        // Lists Overview
        if (! empty($projectContext['lists'])) {
            $prompt .= "## 📋 Lists\n";
            foreach ($projectContext['lists'] as $list) {
                $prompt .= "- **{$list['name']}**: {$list['pending']} pending, {$list['completed']} completed (total: {$list['total']})\n";
            }
            $prompt .= "\n";
        }

        // OVERDUE TASKS (Critical - show first)
        if (! empty($projectContext['overdue_tasks'])) {
            $prompt .= "## 🚨 OVERDUE TASKS (Urgent!)\n";
            foreach ($projectContext['overdue_tasks'] as $task) {
                $assignee = $task['assignee'] ? " → {$task['assignee']}" : '';
                $priority = $task['priority'] ? " [{$task['priority']}]" : '';
                $prompt .= "- **{$task['title']}**{$priority} - {$task['days_overdue']} days overdue (was due {$task['due_date']}){$assignee}\n";
            }
            $prompt .= "\n";
        }

        // Tasks Due Soon (next 3 days)
        if (! empty($projectContext['tasks_due_soon'])) {
            $prompt .= "## ⚡ Due Within 3 Days\n";
            foreach ($projectContext['tasks_due_soon'] as $task) {
                $assignee = $task['assignee'] ? " → {$task['assignee']}" : '';
                $priority = $task['priority'] ? " [{$task['priority']}]" : '';
                $prompt .= "- {$task['title']}{$priority} - Due: {$task['due_date']}{$assignee}\n";
            }
            $prompt .= "\n";
        }

        // ALL Pending Tasks (detailed)
        if (! empty($projectContext['pending_tasks_details'])) {
            $prompt .= "## 📝 All Pending Tasks ({$projectContext['pending_tasks']} total)\n";
            foreach ($projectContext['pending_tasks_details'] as $task) {
                $priority = $task['priority'] ? "[{$task['priority']}] " : '';
                $dueInfo = '';
                if ($task['due_date']) {
                    $days = $task['days_until_due'];
                    if ($days < 0) {
                        $dueInfo = ' | ⚠️ OVERDUE by '.abs($days).' days';
                    } elseif ($days === 0) {
                        $dueInfo = ' | 📅 Due TODAY';
                    } elseif ($days <= 3) {
                        $dueInfo = " | 📅 Due in {$days} days ({$task['due_date']})";
                    } else {
                        $dueInfo = " | Due: {$task['due_date']}";
                    }
                }
                $assignee = $task['assignee'] ? " | Assigned: {$task['assignee']}" : '';
                $labels = ! empty($task['labels']) ? ' | Labels: '.implode(', ', $task['labels']) : '';
                $list = $task['list'] ? " | List: {$task['list']}" : '';

                $prompt .= "- {$priority}**{$task['title']}**{$dueInfo}{$assignee}{$list}{$labels}\n";
                if ($task['description']) {
                    $prompt .= "  └─ {$task['description']}...\n";
                }
            }
            $prompt .= "\n";
        }

        // Recently Completed
        if (! empty($projectContext['recently_completed'])) {
            $prompt .= "## ✅ Recently Completed (Last 7 Days)\n";
            foreach ($projectContext['recently_completed'] as $task) {
                $prompt .= "- {$task['title']} - Completed: {$task['completed_at']}\n";
            }
            $prompt .= "\n";
        }

        // Team Members
        $prompt .= "## 👥 Team ({$projectContext['team_size']} members)\n";
        $prompt .= "- **Owner**: {$projectContext['owner']['name']} ({$projectContext['owner']['email']})\n";
        if (! empty($projectContext['members'])) {
            foreach ($projectContext['members'] as $member) {
                $role = ucfirst($member['role'] ?? 'member');
                $prompt .= "- {$member['name']} ({$member['email']}) - {$role}\n";
            }
        }
        $prompt .= "\n";

        // Labels
        if (! empty($projectContext['labels'])) {
            $prompt .= '## 🏷️ Available Labels: ';
            $labelNames = array_map(fn ($l) => $l['name'], $projectContext['labels']);
            $prompt .= implode(', ', $labelNames)."\n\n";
        }

        // AI Instructions
        $prompt .= "## Your Capabilities\n";
        $prompt .= "You have access to ALL project data above. You can:\n";
        $prompt .= "1. **Answer task questions**: List tasks by status, priority, assignee, due date, labels\n";
        $prompt .= "2. **Provide status reports**: Progress summaries, completion rates, bottlenecks\n";
        $prompt .= "3. **Alert about deadlines**: Overdue tasks, upcoming due dates\n";
        $prompt .= "4. **Team workload**: Who's assigned what, workload distribution\n";
        $prompt .= "5. **Productivity insights**: Completion trends, suggestions for improvement\n";
        $prompt .= "6. **Answer 'what should I work on next?'**: Prioritize based on urgency/priority\n\n";

        $prompt .= "## Response Guidelines\n";
        $prompt .= "- Use the ACTUAL data provided above - never make up task names or details\n";
        $prompt .= "- Adapt response length to question complexity\n";
        $prompt .= "- Use markdown formatting (headers, lists, bold, tables) for readability\n";
        $prompt .= "- Be specific with dates, numbers, and names from the context\n";
        $prompt .= "- For Vietnamese questions, respond in Vietnamese\n";
        $prompt .= "- Be friendly, professional, and actionable\n";

        return $prompt;
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
     * Uses atomic increment to prevent race conditions.
     */
    public function incrementUsage(User $user): void
    {
        $cacheKey = "ai_usage:{$user->id}:".now()->format('Y-m-d');

        if (Cache::has($cacheKey)) {
            Cache::increment($cacheKey);
        } else {
            // First request of the day - set initial value with expiry
            Cache::put($cacheKey, 1, now()->endOfDay());
        }
    }

    /**
     * Increment the AI thinking counter for a conversation.
     * Returns the new count.
     */
    public function incrementAIThinkingCount(int $conversationId): int
    {
        $cacheKey = "ai_thinking_count:{$conversationId}";

        if (Cache::has($cacheKey)) {
            return Cache::increment($cacheKey);
        }

        // Set with 5-minute expiry (safety cleanup)
        Cache::put($cacheKey, 1, now()->addMinutes(5));

        return 1;
    }

    /**
     * Decrement the AI thinking counter for a conversation.
     * Returns the new count (0 or greater).
     */
    public function decrementAIThinkingCount(int $conversationId): int
    {
        $cacheKey = "ai_thinking_count:{$conversationId}";

        $current = (int) Cache::get($cacheKey, 0);

        if ($current <= 1) {
            Cache::forget($cacheKey);

            return 0;
        }

        return Cache::decrement($cacheKey);
    }

    /**
     * Get the current AI thinking count for a conversation.
     */
    public function getAIThinkingCount(int $conversationId): int
    {
        return (int) Cache::get("ai_thinking_count:{$conversationId}", 0);
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
