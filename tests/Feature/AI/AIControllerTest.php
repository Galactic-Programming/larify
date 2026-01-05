<?php

use App\Http\Middleware\EnsureUserCanUseAI;
use App\Models\Label;
use App\Models\Project;
use App\Models\User;
use App\Services\AI\GeminiService;
use Illuminate\Support\Facades\Config;

beforeEach(function () {
    Config::set('ai.enabled', true);
    Config::set('ai.daily_limits.free', 0);
    Config::set('ai.daily_limits.pro', 500);
});

/**
 * Helper to mock GeminiService for AI responses.
 */
function mockGeminiService(array $methods = []): void
{
    $mock = Mockery::mock(GeminiService::class)->makePartial();

    foreach ($methods as $method => $return) {
        $mock->shouldReceive($method)->andReturn($return);
    }

    // Default mocks for permission checks
    if (! isset($methods['canUserUseAI'])) {
        $mock->shouldReceive('canUserUseAI')->andReturn(true);
    }
    if (! isset($methods['hasReachedDailyLimit'])) {
        $mock->shouldReceive('hasReachedDailyLimit')->andReturn(false);
    }
    if (! isset($methods['getRemainingRequests'])) {
        $mock->shouldReceive('getRemainingRequests')->andReturn(100);
    }
    if (! isset($methods['incrementUsage'])) {
        $mock->shouldReceive('incrementUsage')->andReturnNull();
    }
    if (! isset($methods['getDailyUsage'])) {
        $mock->shouldReceive('getDailyUsage')->andReturn(0);
    }

    app()->instance(GeminiService::class, $mock);
}

// === STATUS ENDPOINT ===

describe('GET /api/ai/status', function () {
    it('returns AI status for authenticated user', function () {
        $user = User::factory()->create();

        mockGeminiService([
            'canUserUseAI' => false,
            'getDailyUsage' => 10,
            'getRemainingRequests' => 0,
        ]);

        $response = $this->actingAs($user)
            ->getJson(route('api.ai.status'));

        $response->assertOk()
            ->assertJsonStructure([
                'enabled',
                'can_use',
                'daily_usage',
                'remaining_requests',
                'has_subscription',
            ]);
    });

    it('requires authentication', function () {
        $response = $this->getJson(route('api.ai.status'));

        $response->assertUnauthorized();
    });
});

// === PARSE TASK ENDPOINT ===

describe('POST /api/ai/tasks/parse', function () {
    it('parses natural language into task data', function () {
        $user = User::factory()->create();

        mockGeminiService([
            'parseTaskFromText' => [
                'title' => 'Fix login bug',
                'description' => 'Fix authentication issue',
                'priority' => 'high',
                'due_date' => '2026-01-10',
                'due_time' => null,
                'assignee_hint' => null,
            ],
        ]);

        $response = $this->withoutMiddleware(EnsureUserCanUseAI::class)
            ->actingAs($user)
            ->postJson(route('api.ai.tasks.parse'), [
                'text' => 'Fix login bug with high priority due next Friday',
            ]);

        $response->assertOk()
            ->assertJsonStructure([
                'data' => ['title', 'priority'],
                'remaining_requests',
            ]);
    });

    it('validates text is required', function () {
        $user = User::factory()->create();

        mockGeminiService();

        $response = $this->withoutMiddleware(EnsureUserCanUseAI::class)
            ->actingAs($user)
            ->postJson(route('api.ai.tasks.parse'), []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['text']);
    });

    it('validates text max length', function () {
        $user = User::factory()->create();

        mockGeminiService();

        $response = $this->withoutMiddleware(EnsureUserCanUseAI::class)
            ->actingAs($user)
            ->postJson(route('api.ai.tasks.parse'), [
                'text' => str_repeat('a', 1001),
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['text']);
    });

    it('returns 403 for users without subscription', function () {
        $user = User::factory()->free()->create();

        // Use real middleware - don't bypass it
        Config::set('ai.enabled', true);

        $response = $this->actingAs($user)
            ->postJson(route('api.ai.tasks.parse'), [
                'text' => 'Create a task',
            ]);

        $response->assertForbidden()
            ->assertJson([
                'reason' => 'subscription_required',
            ]);
    });

    it('returns 422 when AI fails to parse', function () {
        $user = User::factory()->create();

        mockGeminiService([
            'parseTaskFromText' => null,
        ]);

        $response = $this->withoutMiddleware(EnsureUserCanUseAI::class)
            ->actingAs($user)
            ->postJson(route('api.ai.tasks.parse'), [
                'text' => 'Invalid gibberish text',
            ]);

        $response->assertUnprocessable();
    });
});

// === GENERATE DESCRIPTION ENDPOINT ===

describe('POST /api/ai/tasks/description', function () {
    it('generates description from title', function () {
        $user = User::factory()->create();

        mockGeminiService([
            'generateTaskDescription' => '**Objective:** Implement login feature...',
        ]);

        $response = $this->withoutMiddleware(EnsureUserCanUseAI::class)
            ->actingAs($user)
            ->postJson(route('api.ai.tasks.description'), [
                'title' => 'Implement user login',
            ]);

        $response->assertOk()
            ->assertJsonStructure([
                'data' => ['description'],
                'remaining_requests',
            ]);
    });

    it('validates title is required', function () {
        $user = User::factory()->create();

        mockGeminiService();

        $response = $this->withoutMiddleware(EnsureUserCanUseAI::class)
            ->actingAs($user)
            ->postJson(route('api.ai.tasks.description'), []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    });
});

// === SUGGEST PRIORITY ENDPOINT ===

describe('POST /api/ai/tasks/priority', function () {
    it('suggests priority for task', function () {
        $user = User::factory()->create();

        mockGeminiService([
            'suggestPriority' => 'high',
        ]);

        $response = $this->withoutMiddleware(EnsureUserCanUseAI::class)
            ->actingAs($user)
            ->postJson(route('api.ai.tasks.priority'), [
                'title' => 'URGENT: Server is down!',
                'description' => 'Production server crashed',
            ]);

        $response->assertOk()
            ->assertJson([
                'data' => ['priority' => 'high'],
            ]);
    });

    it('validates title is required', function () {
        $user = User::factory()->create();

        mockGeminiService();

        $response = $this->withoutMiddleware(EnsureUserCanUseAI::class)
            ->actingAs($user)
            ->postJson(route('api.ai.tasks.priority'), []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['title']);
    });
});

// === SUGGEST LABELS ENDPOINT ===

describe('POST /api/ai/projects/{project}/labels/suggest', function () {
    it('suggests labels from existing project labels', function () {
        $user = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id]);

        // Create some labels
        Label::factory()->create(['project_id' => $project->id, 'name' => 'bug']);
        Label::factory()->create(['project_id' => $project->id, 'name' => 'feature']);
        Label::factory()->create(['project_id' => $project->id, 'name' => 'docs']);

        mockGeminiService([
            'suggestLabels' => ['bug', 'feature'],
        ]);

        $response = $this->withoutMiddleware(EnsureUserCanUseAI::class)
            ->actingAs($user)
            ->postJson(route('api.ai.projects.labels.suggest', $project), [
                'title' => 'Fix authentication error',
                'description' => 'Users cannot login',
            ]);

        $response->assertOk()
            ->assertJsonStructure([
                'data' => ['labels', 'type'],
                'remaining_requests',
            ])
            ->assertJson([
                'data' => ['type' => 'existing'],
            ]);
    });

    it('generates new labels when project has no labels (owner only)', function () {
        $user = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $user->id]);

        mockGeminiService([
            'generateLabelSuggestions' => [
                ['name' => 'bug', 'color' => 'red'],
                ['name' => 'feature', 'color' => 'green'],
            ],
        ]);

        $response = $this->withoutMiddleware(EnsureUserCanUseAI::class)
            ->actingAs($user)
            ->postJson(route('api.ai.projects.labels.suggest', $project), [
                'title' => 'New feature request',
            ]);

        $response->assertOk()
            ->assertJson([
                'data' => ['type' => 'generated'],
            ]);
    });

    it('prevents non-members from suggesting labels', function () {
        $owner = User::factory()->create();
        $outsider = User::factory()->create();
        $project = Project::factory()->create(['user_id' => $owner->id]);

        mockGeminiService();

        $response = $this->withoutMiddleware(EnsureUserCanUseAI::class)
            ->actingAs($outsider)
            ->postJson(route('api.ai.projects.labels.suggest', $project), [
                'title' => 'Some task',
            ]);

        $response->assertForbidden();
    });
});

// === RATE LIMITING ===

describe('AI Rate Limiting', function () {
    it('returns 429 when daily limit is exceeded', function () {
        // Create a user with active subscription (Pro plan)
        $user = User::factory()->create();

        // Mock user's subscription check
        $user = Mockery::mock($user)->makePartial();
        $user->shouldReceive('hasActiveSubscription')->andReturn(true);

        // Mock GeminiService to simulate rate limit exceeded
        $mock = Mockery::mock(GeminiService::class)->makePartial();
        $mock->shouldReceive('hasReachedDailyLimit')->andReturn(true);
        $mock->shouldReceive('getRemainingRequests')->andReturn(0);
        app()->instance(GeminiService::class, $mock);

        $response = $this->actingAs($user)
            ->postJson(route('api.ai.tasks.parse'), [
                'text' => 'Create a task',
            ]);

        $response->assertStatus(429)
            ->assertJson([
                'reason' => 'daily_limit_exceeded',
            ])
            ->assertJsonStructure([
                'remaining_requests',
                'resets_at',
            ]);
    });
});

// === AI DISABLED ===

describe('AI Feature Toggle', function () {
    it('returns 503 when AI is disabled globally', function () {
        Config::set('ai.enabled', false);

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson(route('api.ai.tasks.parse'), [
                'text' => 'Create a task',
            ]);

        $response->assertServiceUnavailable();
    });
});
