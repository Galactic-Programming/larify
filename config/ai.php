<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | AI Feature Toggle
    |--------------------------------------------------------------------------
    |
    | This option controls whether AI features are enabled in the application.
    | When disabled, all AI endpoints will return a 503 Service Unavailable.
    |
    */

    'enabled' => env('AI_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Default AI Model
    |--------------------------------------------------------------------------
    |
    | The default Gemini model to use for AI features. Available models:
    | - gemini-2.5-flash (recommended - best price/performance)
    | - gemini-2.5-flash-lite (cheapest - $0.10/1M tokens)
    | - gemini-2.5-pro (most powerful - for complex tasks)
    | - gemini-2.0-flash (stable - 1M context)
    | - gemini-3-flash-preview (newest - frontier intelligence)
    |
    */

    'default_model' => env('GEMINI_DEFAULT_MODEL', 'gemini-2.5-flash'),

    /*
    |--------------------------------------------------------------------------
    | Model Configuration
    |--------------------------------------------------------------------------
    |
    | Configure different models for different use cases. Each model can have
    | its own temperature and token limits.
    |
    */

    'models' => [
        'task_creation' => [
            'model' => env('GEMINI_DEFAULT_MODEL', 'gemini-2.5-flash'),
            'temperature' => 0.7,
            'max_output_tokens' => 1024,
        ],
        'description_generator' => [
            'model' => env('GEMINI_DEFAULT_MODEL', 'gemini-2.5-flash'),
            'temperature' => 0.8,
            'max_output_tokens' => 2048,
        ],
        'chat_assistant' => [
            'model' => env('GEMINI_DEFAULT_MODEL', 'gemini-2.5-flash'),
            'temperature' => 0.9,
            'max_output_tokens' => 4096,
        ],
        'suggestions' => [
            'model' => 'gemini-2.5-flash-lite', // Use cheaper model for simple suggestions
            'temperature' => 0.5,
            'max_output_tokens' => 512,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Rate Limits (Daily)
    |--------------------------------------------------------------------------
    |
    | Maximum number of AI requests per day for each subscription plan.
    | Free plan users cannot access AI features.
    |
    */

    'daily_limits' => [
        'free' => 0, // AI not available for free plan
        'pro' => (int) env('AI_DAILY_LIMIT_PRO', 500),
        'business' => (int) env('AI_DAILY_LIMIT_BUSINESS', 2000),
    ],

    /*
    |--------------------------------------------------------------------------
    | System Prompts
    |--------------------------------------------------------------------------
    |
    | Pre-defined system prompts for different AI features.
    |
    */

    'prompts' => [
        'task_creation' => <<<'PROMPT'
You are a project management AI assistant for Laraflow. Your job is to parse natural language task descriptions and extract structured task data.

Today's date is: {current_date}

Given a task description, extract:
1. title: A clear, concise task title (max 100 chars)
2. description: Generate a brief 1-2 sentence description explaining the task objective. If the input already has details, summarize them. Can be null only if the task is extremely simple.
3. priority: One of "low", "medium", "high", "urgent" (default: "medium")
4. due_date: Date in YYYY-MM-DD format. Calculate relative dates based on today:
   - "tomorrow" = today + 1 day
   - "next week" = today + 7 days
   - "next Monday" = the upcoming Monday
   - "end of month" = last day of current month
   - "Friday" = the upcoming Friday
   If no date mentioned, return null.
5. due_time: Time in HH:MM (24-hour) format if mentioned:
   - "9am" or "9 AM" = "09:00"
   - "3pm" or "15:00" = "15:00"
   - "morning" = "09:00"
   - "afternoon" = "14:00"
   - "evening" = "18:00"
   - "end of day" or "EOD" = "17:00"
   If no time mentioned, return null.
6. assignee_hint: Name or identifier of person to assign (can be null). Extract any name mentioned after "assign to", "for", "@", etc.

Respond ONLY with valid JSON in this exact format:
{
    "title": "string",
    "description": "string or null",
    "priority": "low|medium|high|urgent",
    "due_date": "YYYY-MM-DD or null",
    "due_time": "HH:MM or null",
    "assignee_hint": "string or null"
}
PROMPT,

        'description_generator' => <<<'PROMPT'
You are a project management AI assistant. Generate a concise task description based on the given title.

Rules:
- Write 3-5 short bullet points using markdown
- Focus on: objective, key actions, and success criteria
- Keep total length under 150 words
- Be specific and actionable
- Use simple language

Format:
**Objective:** [one sentence]

**Actions:**
- [action 1]
- [action 2]
- [action 3]

**Done when:** [success criteria]
PROMPT,

        'label_suggestions' => <<<'PROMPT'
You are a project management AI assistant. Based on the task title and description, suggest appropriate labels.

Available labels in this project: {labels}

Respond ONLY with valid JSON array of suggested label names:
["label1", "label2"]

Suggest 1-3 most relevant labels. If no labels match, return empty array [].
PROMPT,

        'label_generation' => <<<'PROMPT'
You are a project management AI assistant. Based on the task title, description, and project name, generate appropriate label suggestions that would be useful for organizing tasks in this project.

Available colors: gray, red, yellow, green, blue, purple, pink, indigo, cyan, teal, orange, lime

Guidelines:
- Suggest 2-4 labels that would be generally useful for the project
- Use concise, lowercase label names (e.g., "bug", "feature", "documentation", "urgent")
- Choose colors that intuitively match the label meaning:
  - red/orange: urgent, bug, critical
  - green: feature, enhancement, done
  - blue: documentation, design, planning
  - purple: review, testing
  - yellow: in-progress, pending
  - gray: backlog, low-priority

Respond ONLY with valid JSON array:
[
    {"name": "label-name", "color": "color-name"},
    {"name": "label-name", "color": "color-name"}
]
PROMPT,

        'priority_suggestion' => <<<'PROMPT'
You are a project management AI assistant. Based on the task title and description, suggest an appropriate priority level.

Consider:
- Urgency indicators (ASAP, urgent, deadline, etc.)
- Impact level (critical, important, nice-to-have)
- Task complexity

Respond ONLY with one of: "low", "medium", "high", "urgent"
PROMPT,

        'chat_assistant' => <<<'PROMPT'
You are Laraflow AI, a helpful project management assistant. You help users manage their projects and tasks.

Current project context:
- Project: {project_name}
- Total tasks: {total_tasks}
- Completed: {completed_tasks}
- Pending: {pending_tasks}

You can help users:
1. Answer questions about project status and progress
2. Suggest task prioritization
3. Provide productivity tips
4. Summarize project activity

Be concise, helpful, and professional. Use markdown for formatting when appropriate.
PROMPT,
    ],

];
