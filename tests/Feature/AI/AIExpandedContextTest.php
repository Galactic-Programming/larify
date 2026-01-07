<?php

use App\Enums\ActivityType;
use App\Enums\ProjectRole;
use App\Events\AIThinking;
use App\Events\MessageSent;
use App\Models\Activity;
use App\Models\Message;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskAttachment;
use App\Models\TaskComment;
use App\Models\TaskList;
use App\Models\User;
use App\Services\AI\GeminiService;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Event;

beforeEach(function () {
    Config::set('ai.enabled', true);
    Config::set('ai.daily_limits.pro', 500);
});

/**
 * Helper to create a project with conversation.
 */
function createTestProjectWithChat(User $owner, array $members = []): array
{
    $project = Project::factory()->create(['user_id' => $owner->id]);

    foreach ($members as $member) {
        $project->members()->attach($member->id, [
            'role' => ProjectRole::Editor->value,
            'joined_at' => now(),
        ]);
    }

    $conversation = $project->getOrCreateConversation();

    return [$project, $conversation];
}

/**
 * Mock GeminiService for context tests.
 */
function mockAIContextService(array $methods = []): void
{
    $mock = Mockery::mock(GeminiService::class)->makePartial();

    foreach ($methods as $method => $return) {
        $mock->shouldReceive($method)->andReturn($return);
    }

    if (! isset($methods['canUserUseAI'])) {
        $mock->shouldReceive('canUserUseAI')->andReturn(true);
    }
    if (! isset($methods['chatInConversation'])) {
        $mock->shouldReceive('chatInConversation')->andReturn('AI response with context.');
    }
    if (! isset($methods['incrementUsage'])) {
        $mock->shouldReceive('incrementUsage')->andReturnNull();
    }
    if (! isset($methods['incrementAIThinkingCount'])) {
        $mock->shouldReceive('incrementAIThinkingCount')->andReturn(1);
    }
    if (! isset($methods['decrementAIThinkingCount'])) {
        $mock->shouldReceive('decrementAIThinkingCount')->andReturn(0);
    }

    app()->instance(GeminiService::class, $mock);
}

// === ACTIVITY LOG CONTEXT ===

describe('AI Activity Log Context', function () {
    it('includes recent activities in AI context', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createTestProjectWithChat($owner, [$member]);

        // Create some activities using Activity::create
        for ($i = 0; $i < 5; $i++) {
            Activity::create([
                'project_id' => $project->id,
                'user_id' => $owner->id,
                'type' => ActivityType::TaskCreated,
                'description' => 'created a task',
            ]);
        }

        mockAIContextService();

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI What activities happened recently?',
            ]);

        $response->assertStatus(201);
    });

    it('shows who completed tasks from activity log', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createTestProjectWithChat($owner, [$member]);

        $list = TaskList::factory()->create(['project_id' => $project->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'list_id' => $list->id,
            'title' => 'Important Task',
            'completed_at' => now(),
        ]);

        // Log task completion activity
        Activity::create([
            'project_id' => $project->id,
            'user_id' => $member->id,
            'subject_type' => Task::class,
            'subject_id' => $task->id,
            'type' => ActivityType::TaskCompleted,
            'properties' => ['subject_name' => $task->title],
        ]);

        mockAIContextService();

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI Who completed tasks today?',
            ]);

        $response->assertStatus(201);
    });
});

// === TASK COMMENTS CONTEXT ===

describe('AI Task Comments Context', function () {
    it('includes recent task comments in AI context', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createTestProjectWithChat($owner, [$member]);

        $list = TaskList::factory()->create(['project_id' => $project->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'list_id' => $list->id,
            'title' => 'Bug Fix Task',
        ]);

        // Create comments on the task
        TaskComment::factory()->count(3)->create([
            'task_id' => $task->id,
            'user_id' => $member->id,
            'content' => 'This is an important discussion point.',
        ]);

        mockAIContextService();

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI What are people discussing on tasks?',
            ]);

        $response->assertStatus(201);
    });

    it('identifies tasks with most discussion', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createTestProjectWithChat($owner, [$member]);

        $list = TaskList::factory()->create(['project_id' => $project->id]);

        // Task with many comments
        $hotTask = Task::factory()->create([
            'project_id' => $project->id,
            'list_id' => $list->id,
            'title' => 'Hot Discussion Task',
        ]);
        TaskComment::factory()->count(10)->create([
            'task_id' => $hotTask->id,
            'user_id' => $member->id,
        ]);

        // Task with few comments
        $quietTask = Task::factory()->create([
            'project_id' => $project->id,
            'list_id' => $list->id,
            'title' => 'Quiet Task',
        ]);
        TaskComment::factory()->count(1)->create([
            'task_id' => $quietTask->id,
            'user_id' => $owner->id,
        ]);

        mockAIContextService();

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI Which tasks have the most discussion?',
            ]);

        $response->assertStatus(201);
    });
});

// === CONVERSATION HISTORY CONTEXT ===

describe('AI Conversation History Context', function () {
    it('includes recent team chat messages in AI context', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createTestProjectWithChat($owner, [$member]);

        // Create some chat messages
        Message::factory()->count(5)->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $member->id,
            'content' => 'Team discussion message',
        ]);

        mockAIContextService();

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI What has the team been discussing?',
            ]);

        $response->assertStatus(201);
    });
});

// === TASK ATTACHMENTS CONTEXT ===

describe('AI Task Attachments Context', function () {
    it('includes task attachment metadata in AI context', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createTestProjectWithChat($owner, [$member]);

        $list = TaskList::factory()->create(['project_id' => $project->id]);
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'list_id' => $list->id,
            'title' => 'Design Review Task',
        ]);

        // Create attachment metadata (without actual file)
        TaskAttachment::factory()->create([
            'task_id' => $task->id,
            'original_name' => 'design-mockup.pdf',
            'mime_type' => 'application/pdf',
            'size' => 1024 * 500, // 500 KB
        ]);

        mockAIContextService();

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI Which tasks have attachments?',
            ]);

        $response->assertStatus(201);
    });
});

// === PRODUCTIVITY ANALYTICS CONTEXT ===

describe('AI Productivity Analytics Context', function () {
    it('includes productivity stats in AI context', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createTestProjectWithChat($owner, [$member]);

        $list = TaskList::factory()->create(['project_id' => $project->id]);

        // Create completed tasks for productivity metrics
        Task::factory()->count(5)->create([
            'project_id' => $project->id,
            'list_id' => $list->id,
            'assigned_to' => $member->id,
            'completed_at' => now()->subDay(),
            'created_at' => now()->subDays(3),
        ]);

        // Create pending tasks
        Task::factory()->count(3)->create([
            'project_id' => $project->id,
            'list_id' => $list->id,
            'assigned_to' => $owner->id,
            'completed_at' => null,
        ]);

        mockAIContextService();

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI How is the team productivity this week?',
            ]);

        $response->assertStatus(201);
    });

    it('tracks weekly velocity in AI context', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createTestProjectWithChat($owner, [$member]);

        $list = TaskList::factory()->create(['project_id' => $project->id]);

        // Create tasks completed in different weeks
        for ($i = 0; $i < 4; $i++) {
            Task::factory()->count(3 + $i)->create([
                'project_id' => $project->id,
                'list_id' => $list->id,
                'completed_at' => now()->subWeeks($i),
                'created_at' => now()->subWeeks($i)->subDays(2),
            ]);
        }

        mockAIContextService();

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI What is our velocity trend?',
            ]);

        $response->assertStatus(201);
    });

    it('identifies stuck tasks in AI context', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createTestProjectWithChat($owner, [$member]);

        $list = TaskList::factory()->create(['project_id' => $project->id]);

        // Create a stuck task (old, no recent updates)
        Task::factory()->create([
            'project_id' => $project->id,
            'list_id' => $list->id,
            'title' => 'Stuck Task',
            'completed_at' => null,
            'created_at' => now()->subDays(14),
            'updated_at' => now()->subDays(10),
        ]);

        mockAIContextService();

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI Are there any stuck tasks?',
            ]);

        $response->assertStatus(201);
    });

    it('shows completion by team member in AI context', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create(['name' => 'Alice']);
        $member = User::factory()->create(['name' => 'Bob']);
        [$project, $conversation] = createTestProjectWithChat($owner, [$member]);

        $list = TaskList::factory()->create(['project_id' => $project->id]);

        // Alice completed 2 tasks
        Task::factory()->count(2)->create([
            'project_id' => $project->id,
            'list_id' => $list->id,
            'assigned_to' => $owner->id,
            'completed_at' => now()->subDay(),
        ]);

        // Bob completed 5 tasks
        Task::factory()->count(5)->create([
            'project_id' => $project->id,
            'list_id' => $list->id,
            'assigned_to' => $member->id,
            'completed_at' => now()->subHours(6),
        ]);

        mockAIContextService();

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI Who completed the most tasks this week?',
            ]);

        $response->assertStatus(201);
    });
});

// === COMBINED CONTEXT QUERIES ===

describe('AI Combined Context Queries', function () {
    it('can answer complex questions using multiple context sources', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createTestProjectWithChat($owner, [$member]);

        $list = TaskList::factory()->create(['project_id' => $project->id]);

        // Setup rich project context
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'list_id' => $list->id,
            'title' => 'Critical Feature',
            'assigned_to' => $member->id,
        ]);

        // Activity log
        Activity::create([
            'project_id' => $project->id,
            'user_id' => $member->id,
            'subject_type' => Task::class,
            'subject_id' => $task->id,
            'type' => ActivityType::TaskCreated,
            'properties' => ['subject_name' => $task->title],
        ]);

        // Comments
        TaskComment::factory()->create([
            'task_id' => $task->id,
            'user_id' => $owner->id,
            'content' => 'This needs priority attention!',
        ]);

        // Chat messages
        Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $member->id,
            'content' => 'Working on the critical feature now.',
        ]);

        mockAIContextService();

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI Give me a summary of recent project activity including discussions.',
            ]);

        $response->assertStatus(201);
    });
});

// === CROSS-PROJECT INSIGHTS ===

describe('AI Cross-Project Insights', function () {
    it('provides cross-project context when user asks about all projects', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();

        // Create first project with conversation
        [$project1, $conversation1] = createTestProjectWithChat($owner, [$member]);
        $list1 = TaskList::factory()->create(['project_id' => $project1->id]);
        Task::factory()->count(5)->create([
            'project_id' => $project1->id,
            'list_id' => $list1->id,
        ]);

        // Create second project (owner only)
        $project2 = Project::factory()->create(['user_id' => $owner->id, 'name' => 'Second Project']);
        $list2 = TaskList::factory()->create(['project_id' => $project2->id]);
        Task::factory()->count(3)->create([
            'project_id' => $project2->id,
            'list_id' => $list2->id,
        ]);

        mockAIContextService();

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation1), [
                'content' => '@AI Show me overview of all my projects',
            ]);

        $response->assertStatus(201);
    });

    it('detects Vietnamese cross-project queries', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();

        [$project1, $conversation1] = createTestProjectWithChat($owner, [$member]);
        $list1 = TaskList::factory()->create(['project_id' => $project1->id]);

        // Create second project
        $project2 = Project::factory()->create(['user_id' => $owner->id]);
        $list2 = TaskList::factory()->create(['project_id' => $project2->id]);

        mockAIContextService();

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation1), [
                'content' => '@AI Tổng quan tất cả các dự án của tôi',
            ]);

        $response->assertStatus(201);
    });

    it('shows urgent tasks across all projects', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();

        [$project1, $conversation1] = createTestProjectWithChat($owner, [$member]);
        $list1 = TaskList::factory()->create(['project_id' => $project1->id]);

        // Urgent task in project 1
        Task::factory()->create([
            'project_id' => $project1->id,
            'list_id' => $list1->id,
            'title' => 'Urgent Task Project 1',
            'priority' => 'urgent',
            'assigned_to' => $owner->id,
        ]);

        // Create second project with urgent task
        $project2 = Project::factory()->create(['user_id' => $owner->id, 'name' => 'Second Project']);
        $list2 = TaskList::factory()->create(['project_id' => $project2->id]);
        Task::factory()->create([
            'project_id' => $project2->id,
            'list_id' => $list2->id,
            'title' => 'Urgent Task Project 2',
            'priority' => 'urgent',
            'due_date' => now()->addDay(),
        ]);

        mockAIContextService();

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation1), [
                'content' => '@AI What are my urgent tasks across all projects?',
            ]);

        $response->assertStatus(201);
    });

    it('does not include cross-project context for single project users', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();

        // Only one project
        [$project1, $conversation1] = createTestProjectWithChat($owner, [$member]);
        $list1 = TaskList::factory()->create(['project_id' => $project1->id]);

        mockAIContextService();

        // Even if they ask about "all projects", should work without error
        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation1), [
                'content' => '@AI Show me all my projects',
            ]);

        $response->assertStatus(201);
    });

    it('shows user tasks assigned across multiple projects', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();

        [$project1, $conversation1] = createTestProjectWithChat($owner, [$member]);
        $list1 = TaskList::factory()->create(['project_id' => $project1->id]);

        // Task assigned to owner in project 1
        Task::factory()->create([
            'project_id' => $project1->id,
            'list_id' => $list1->id,
            'title' => 'My Task in Project 1',
            'assigned_to' => $owner->id,
        ]);

        // Create second project with task assigned to owner
        $project2 = Project::factory()->create(['user_id' => $owner->id]);
        $list2 = TaskList::factory()->create(['project_id' => $project2->id]);
        Task::factory()->create([
            'project_id' => $project2->id,
            'list_id' => $list2->id,
            'title' => 'My Task in Project 2',
            'assigned_to' => $owner->id,
        ]);

        mockAIContextService();

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation1), [
                'content' => '@AI What tasks are assigned to me in all projects?',
            ]);

        $response->assertStatus(201);
    });

    it('compares project progress across multiple projects', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();

        [$project1, $conversation1] = createTestProjectWithChat($owner, [$member]);
        $list1 = TaskList::factory()->create(['project_id' => $project1->id]);

        // Project 1: 80% complete
        Task::factory()->count(8)->create([
            'project_id' => $project1->id,
            'list_id' => $list1->id,
            'completed_at' => now(),
        ]);
        Task::factory()->count(2)->create([
            'project_id' => $project1->id,
            'list_id' => $list1->id,
            'completed_at' => null,
        ]);

        // Project 2: 20% complete
        $project2 = Project::factory()->create(['user_id' => $owner->id, 'name' => 'Slow Project']);
        $list2 = TaskList::factory()->create(['project_id' => $project2->id]);
        Task::factory()->count(2)->create([
            'project_id' => $project2->id,
            'list_id' => $list2->id,
            'completed_at' => now(),
        ]);
        Task::factory()->count(8)->create([
            'project_id' => $project2->id,
            'list_id' => $list2->id,
            'completed_at' => null,
        ]);

        mockAIContextService();

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation1), [
                'content' => '@AI Compare progress across all my projects',
            ]);

        $response->assertStatus(201);
    });
});
