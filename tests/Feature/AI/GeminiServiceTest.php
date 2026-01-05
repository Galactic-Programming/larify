<?php

use App\Models\User;
use App\Services\AI\GeminiService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;

beforeEach(function () {
    Config::set('ai.enabled', true);
    Config::set('ai.daily_limits.free', 0);
    Config::set('ai.daily_limits.pro', 500);
    Config::set('ai.daily_limits.business', 2000);
});

// === canUserUseAI Tests ===

describe('GeminiService::canUserUseAI()', function () {
    it('returns false when AI is disabled globally', function () {
        Config::set('ai.enabled', false);

        $user = User::factory()->create();
        // Mock subscription
        $user = Mockery::mock($user)->makePartial();
        $user->shouldReceive('hasActiveSubscription')->andReturn(true);

        $service = new GeminiService;
        expect($service->canUserUseAI($user))->toBeFalse();
    });

    it('returns false when user has no active subscription', function () {
        $user = User::factory()->free()->create();

        $service = new GeminiService;
        expect($service->canUserUseAI($user))->toBeFalse();
    });

    it('returns true for user with Pro subscription and available quota', function () {
        $user = User::factory()->create();
        // Mock subscription check
        $user = Mockery::mock($user)->makePartial();
        $user->shouldReceive('hasActiveSubscription')->andReturn(true);
        $user->shouldReceive('subscribed')->with('default')->andReturn(true);

        $service = new GeminiService;
        expect($service->canUserUseAI($user))->toBeTrue();
    });
});

// === Daily Limit Tests ===

describe('GeminiService::hasReachedDailyLimit()', function () {
    it('returns true for free plan users', function () {
        $user = User::factory()->create();
        $user = Mockery::mock($user)->makePartial();
        $user->shouldReceive('subscribed')->with('default')->andReturn(false);

        $service = new GeminiService;
        expect($service->hasReachedDailyLimit($user))->toBeTrue();
    });

    it('returns false for pro user within limit', function () {
        $user = User::factory()->create();
        $user = Mockery::mock($user)->makePartial();
        $user->shouldReceive('subscribed')->with('default')->andReturn(true);

        $service = new GeminiService;
        expect($service->hasReachedDailyLimit($user))->toBeFalse();
    });

    it('returns true when pro user reaches daily limit', function () {
        $user = User::factory()->create();
        $user = Mockery::mock($user)->makePartial();
        $user->shouldReceive('subscribed')->with('default')->andReturn(true);

        // Set usage to limit
        $cacheKey = "ai_usage:{$user->id}:".now()->format('Y-m-d');
        Cache::put($cacheKey, 500, now()->endOfDay());

        $service = new GeminiService;
        expect($service->hasReachedDailyLimit($user))->toBeTrue();
    });
});

// === Usage Tracking Tests ===

describe('GeminiService::getDailyUsage()', function () {
    it('returns 0 for new users with no usage', function () {
        $user = User::factory()->create();

        $service = new GeminiService;
        expect($service->getDailyUsage($user))->toBe(0);
    });

    it('returns correct usage count', function () {
        $user = User::factory()->create();
        $cacheKey = "ai_usage:{$user->id}:".now()->format('Y-m-d');
        Cache::put($cacheKey, 42, now()->endOfDay());

        $service = new GeminiService;
        expect($service->getDailyUsage($user))->toBe(42);
    });
});

describe('GeminiService::incrementUsage()', function () {
    it('increments usage from 0 to 1', function () {
        $user = User::factory()->create();

        $service = new GeminiService;
        $service->incrementUsage($user);

        expect($service->getDailyUsage($user))->toBe(1);
    });

    it('increments existing usage', function () {
        $user = User::factory()->create();
        $cacheKey = "ai_usage:{$user->id}:".now()->format('Y-m-d');
        Cache::put($cacheKey, 10, now()->endOfDay());

        $service = new GeminiService;
        $service->incrementUsage($user);

        expect($service->getDailyUsage($user))->toBe(11);
    });
});

describe('GeminiService::getRemainingRequests()', function () {
    it('returns 0 for free users', function () {
        $user = User::factory()->create();
        $user = Mockery::mock($user)->makePartial();
        $user->shouldReceive('subscribed')->with('default')->andReturn(false);

        $service = new GeminiService;
        expect($service->getRemainingRequests($user))->toBe(0);
    });

    it('returns full limit for pro user with no usage', function () {
        $user = User::factory()->create();
        $user = Mockery::mock($user)->makePartial();
        $user->shouldReceive('subscribed')->with('default')->andReturn(true);

        $service = new GeminiService;
        expect($service->getRemainingRequests($user))->toBe(500);
    });

    it('returns correct remaining for pro user with partial usage', function () {
        $user = User::factory()->create();
        $user = Mockery::mock($user)->makePartial();
        $user->shouldReceive('subscribed')->with('default')->andReturn(true);

        $cacheKey = "ai_usage:{$user->id}:".now()->format('Y-m-d');
        Cache::put($cacheKey, 150, now()->endOfDay());

        $service = new GeminiService;
        expect($service->getRemainingRequests($user))->toBe(350);
    });
});

// === Priority Suggestion Tests ===

describe('GeminiService::suggestPriority()', function () {
    it('returns medium as default when AI is disabled', function () {
        Config::set('ai.enabled', false);

        $service = new GeminiService;
        $result = $service->suggestPriority('Test task', null);

        expect($result)->toBe('medium');
    });

    it('validates and normalizes priority response', function () {
        // Create a partial mock of GeminiService
        $service = Mockery::mock(GeminiService::class)->makePartial();
        $service->shouldReceive('generate')
            ->andReturn('high');

        $result = $service->suggestPriority('URGENT: Fix production bug!', null);

        expect($result)->toBeIn(['low', 'medium', 'high', 'urgent']);
    });

    it('returns medium for invalid priority response', function () {
        $service = Mockery::mock(GeminiService::class)->makePartial();
        $service->shouldReceive('generate')
            ->andReturn('invalid_priority');

        $result = $service->suggestPriority('Some task', null);

        expect($result)->toBe('medium');
    });
});

// === Label Suggestion Tests ===

describe('GeminiService::suggestLabels()', function () {
    it('returns empty array when no labels available', function () {
        $service = new GeminiService;
        $result = $service->suggestLabels('Test task', 'Description', []);

        expect($result)->toBe([]);
    });

    it('filters suggestions to only available labels', function () {
        $service = Mockery::mock(GeminiService::class)->makePartial();
        $service->shouldReceive('generate')
            ->andReturn('["bug", "feature", "unknown"]');

        $result = $service->suggestLabels('Fix login issue', 'Bug in auth', ['bug', 'feature', 'docs']);

        // Should only return labels that exist in available labels
        expect($result)->toBeArray();
        foreach ($result as $label) {
            expect($label)->toBeIn(['bug', 'feature', 'docs']);
        }
    });

    it('returns empty array when AI returns invalid JSON', function () {
        $service = Mockery::mock(GeminiService::class)->makePartial();
        $service->shouldReceive('generate')
            ->andReturn('not valid json');

        $result = $service->suggestLabels('Task', 'Desc', ['bug']);

        expect($result)->toBe([]);
    });
});

// === Task Parsing Tests ===

describe('GeminiService::parseTaskFromText()', function () {
    it('returns null when AI is disabled', function () {
        Config::set('ai.enabled', false);

        $service = new GeminiService;
        $result = $service->parseTaskFromText('Create a new feature');

        expect($result)->toBeNull();
    });

    it('parses natural language into task data', function () {
        $service = Mockery::mock(GeminiService::class)->makePartial();
        $service->shouldReceive('generate')
            ->andReturn(json_encode([
                'title' => 'Fix login bug',
                'description' => 'Fix the authentication issue',
                'priority' => 'high',
                'due_date' => '2026-01-10',
                'due_time' => null,
                'assignee_hint' => null,
            ]));

        $result = $service->parseTaskFromText('Fix login bug with high priority due next week');

        expect($result)->toBeArray();
        expect($result)->toHaveKey('title');
        expect($result)->toHaveKey('priority');
        expect($result['title'])->toBe('Fix login bug');
        expect($result['priority'])->toBe('high');
    });

    it('returns null when AI returns invalid JSON', function () {
        $service = Mockery::mock(GeminiService::class)->makePartial();
        $service->shouldReceive('generate')
            ->andReturn('This is not JSON at all');

        $result = $service->parseTaskFromText('Invalid input');

        expect($result)->toBeNull();
    });
});

// === Description Generation Tests ===

describe('GeminiService::generateTaskDescription()', function () {
    it('returns null when AI is disabled', function () {
        Config::set('ai.enabled', false);

        $service = new GeminiService;
        $result = $service->generateTaskDescription('Implement login');

        expect($result)->toBeNull();
    });

    it('generates description from title', function () {
        $expectedDescription = '**Objective:** Implement user authentication...';

        $service = Mockery::mock(GeminiService::class)->makePartial();
        $service->shouldReceive('generate')
            ->andReturn($expectedDescription);

        $result = $service->generateTaskDescription('Implement user login');

        expect($result)->toBeString();
        expect($result)->toBe($expectedDescription);
    });

    it('returns null when AI fails', function () {
        $service = Mockery::mock(GeminiService::class)->makePartial();
        $service->shouldReceive('generate')
            ->andReturn(null);

        $result = $service->generateTaskDescription('Some task');

        expect($result)->toBeNull();
    });
});
