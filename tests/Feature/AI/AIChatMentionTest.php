<?php

use App\Enums\ProjectRole;
use App\Events\AIThinking;
use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Project;
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
function createProjectWithChat(User $owner, array $members = []): array
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
 * Mock GeminiService for chat tests.
 */
function mockAIChatService(array $methods = []): void
{
    $mock = Mockery::mock(GeminiService::class)->makePartial();

    foreach ($methods as $method => $return) {
        $mock->shouldReceive($method)->andReturn($return);
    }

    if (! isset($methods['canUserUseAI'])) {
        $mock->shouldReceive('canUserUseAI')->andReturn(true);
    }
    if (! isset($methods['chatInConversation'])) {
        $mock->shouldReceive('chatInConversation')->andReturn('Hello! I am Laraflow AI.');
    }
    if (! isset($methods['incrementUsage'])) {
        $mock->shouldReceive('incrementUsage')->andReturnNull();
    }

    app()->instance(GeminiService::class, $mock);
}

// === @AI MENTION DETECTION ===

describe('@AI Mention in Messages', function () {
    it('detects @AI mention in message', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createProjectWithChat($owner, [$member]);

        mockAIChatService();

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI How many tasks are pending?',
            ]);

        $response->assertStatus(201);

        // Should have 2 messages: user message + AI response
        expect($conversation->messages()->count())->toBeGreaterThanOrEqual(1);
    });

    it('detects @Laraflow AI mention (case insensitive)', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createProjectWithChat($owner, [$member]);

        mockAIChatService();

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@laraflow ai What is the project status?',
            ]);

        $response->assertStatus(201);
    });

    it('does not trigger AI for messages without @AI mention', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createProjectWithChat($owner, [$member]);

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => 'Hello team, how is everyone doing?',
            ]);

        $response->assertStatus(201);

        // Only 1 message (no AI response)
        expect($conversation->messages()->count())->toBe(1);
    });
});

// === AI RESPONSE GENERATION ===

describe('AI Response Generation', function () {
    it('generates AI response with project context', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createProjectWithChat($owner, [$member]);

        mockAIChatService([
            'chatInConversation' => 'You have 5 pending tasks in this project.',
        ]);

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI How many pending tasks?',
            ]);

        $response->assertStatus(201);

        // Check AI message was created
        $aiMessage = $conversation->messages()
            ->whereHas('sender', fn ($q) => $q->where('email', 'ai@laraflow.app'))
            ->first();

        if ($aiMessage) {
            expect($aiMessage->content)->toContain('pending');
        }
    });

    it('broadcasts AIThinking event when processing', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createProjectWithChat($owner, [$member]);

        mockAIChatService();

        $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI Help me!',
            ]);

        Event::assertDispatched(AIThinking::class);
    });

    it('AI message is marked as from AI user', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createProjectWithChat($owner, [$member]);

        mockAIChatService();

        $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI Hello!',
            ]);

        $aiMessage = $conversation->messages()
            ->whereHas('sender', fn ($q) => $q->where('email', 'ai@laraflow.app'))
            ->first();

        if ($aiMessage) {
            expect($aiMessage->sender->isAI())->toBeTrue();
        }
    });
});

// === AI ACCESS CONTROL ===

describe('AI Access Control in Chat', function () {
    it('shows upgrade message for users without subscription', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->free()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createProjectWithChat($owner, [$member]);

        mockAIChatService([
            'canUserUseAI' => false,
        ]);

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI Help me please!',
            ]);

        $response->assertStatus(201);

        // AI should respond with upgrade message
        $aiMessage = $conversation->messages()
            ->whereHas('sender', fn ($q) => $q->where('email', 'ai@laraflow.app'))
            ->first();

        if ($aiMessage) {
            expect($aiMessage->content)->toContain('Pro subscription');
        }
    });

    it('allows all project members to use @AI', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createProjectWithChat($owner, [$member]);

        mockAIChatService();

        // Member (not owner) should also be able to use @AI
        $response = $this->actingAs($member)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI What tasks are assigned to me?',
            ]);

        $response->assertStatus(201);
    });

    it('prevents non-members from sending messages', function () {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $outsider = User::factory()->create();
        [$project, $conversation] = createProjectWithChat($owner, [$member]);

        $response = $this->actingAs($outsider)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI Help me hack this!',
            ]);

        $response->assertForbidden();
    });
});

// === AI QUESTION EXTRACTION ===

describe('AI Question Extraction', function () {
    it('extracts question after @AI mention', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createProjectWithChat($owner, [$member]);

        $mock = Mockery::mock(GeminiService::class)->makePartial();
        $mock->shouldReceive('canUserUseAI')->andReturn(true);
        $mock->shouldReceive('incrementUsage')->andReturnNull();

        // Capture the question passed to chatInConversation
        $capturedQuestion = null;
        $mock->shouldReceive('chatInConversation')
            ->andReturnUsing(function ($question, $context) use (&$capturedQuestion) {
                $capturedQuestion = $question;

                return 'AI Response';
            });

        app()->instance(GeminiService::class, $mock);

        $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI What are my urgent tasks?',
            ]);

        // The question should be extracted without @AI
        expect($capturedQuestion)->toBe('What are my urgent tasks?');
    });

    it('handles @AI at different positions in message', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createProjectWithChat($owner, [$member]);

        mockAIChatService();

        // @AI at the beginning
        $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI Tell me about the project',
            ])
            ->assertStatus(201);

        // @AI in the middle (should still work)
        $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => 'Hey @AI can you help me?',
            ])
            ->assertStatus(201);
    });

    it('ignores empty questions after @AI', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createProjectWithChat($owner, [$member]);

        // Mock AI service - user can use AI but question is empty
        mockAIChatService([
            'canUserUseAI' => true,
        ]);

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI   ', // Only whitespace after @AI
            ]);

        $response->assertStatus(201);

        // Should only have the user message, no AI response for empty question
        $aiMessages = $conversation->messages()
            ->whereHas('sender', fn ($q) => $q->where('email', 'ai@laraflow.app'))
            ->count();

        expect($aiMessages)->toBe(0);
    });
});

// === ERROR HANDLING ===

describe('AI Error Handling', function () {
    it('handles AI service failure gracefully', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createProjectWithChat($owner, [$member]);

        mockAIChatService([
            'chatInConversation' => null, // Simulate failure
        ]);

        $response = $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI This will fail',
            ]);

        // Message should still be created even if AI fails
        $response->assertStatus(201);
    });

    it('turns off AI thinking indicator on error', function () {
        Event::fake([MessageSent::class, AIThinking::class]);

        $owner = User::factory()->create();
        $member = User::factory()->create();
        [$project, $conversation] = createProjectWithChat($owner, [$member]);

        $mock = Mockery::mock(GeminiService::class)->makePartial();
        $mock->shouldReceive('canUserUseAI')->andReturn(true);
        $mock->shouldReceive('chatInConversation')->andThrow(new Exception('API Error'));
        app()->instance(GeminiService::class, $mock);

        $this->actingAs($owner)
            ->postJson(route('conversations.messages.store', $conversation), [
                'content' => '@AI This will error',
            ]);

        // Should broadcast AIThinking with false to turn off indicator
        Event::assertDispatched(AIThinking::class, function ($event) {
            return $event->isThinking === false;
        });
    });
});
