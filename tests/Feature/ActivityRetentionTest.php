<?php

use App\Enums\ActivityType;
use App\Enums\UserPlan;
use App\Models\Activity;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Carbon;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

/**
 * Helper to create activity with specific date
 */
function createActivityAt(array $data, Carbon $date): Activity
{
    $activity = Activity::create($data);
    $activity->created_at = $date;
    $activity->save();

    return $activity;
}

describe('Activity Retention', function () {
    it('shows activities from last 7 days for Free user on notifications page', function () {
        $user = User::factory()->create(['plan' => UserPlan::Free]);
        $project = Project::factory()->create(['user_id' => $user->id]);

        // Activity within 7 days (should be visible)
        $recentActivity = createActivityAt([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'type' => ActivityType::TaskCreated,
            'description' => 'Recent activity',
        ], now()->subDays(3));

        // Activity older than 7 days (should NOT be visible)
        $oldActivity = createActivityAt([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'type' => ActivityType::TaskCreated,
            'description' => 'Old activity',
        ], now()->subDays(10));

        $response = $this->actingAs($user)->get(route('notifications.index'));

        $response->assertOk();
        $activities = $response->original->getData()['page']['props']['activities']['data'];

        expect(collect($activities)->pluck('id'))
            ->toContain($recentActivity->id)
            ->not->toContain($oldActivity->id);
    });

    it('shows activities from last 30 days for Pro user on notifications page', function () {
        $user = User::factory()->create(['plan' => UserPlan::Pro]);
        $project = Project::factory()->create(['user_id' => $user->id]);

        // Activity within 30 days (should be visible)
        $recentActivity = createActivityAt([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'type' => ActivityType::TaskCreated,
            'description' => 'Recent activity',
        ], now()->subDays(15));

        // Activity at boundary (25 days, should be visible for Pro)
        $boundaryActivity = createActivityAt([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'type' => ActivityType::TaskCreated,
            'description' => 'Boundary activity',
        ], now()->subDays(25));

        // Activity older than 30 days (should NOT be visible)
        $oldActivity = createActivityAt([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'type' => ActivityType::TaskCreated,
            'description' => 'Old activity',
        ], now()->subDays(35));

        $response = $this->actingAs($user)->get(route('notifications.index'));

        $response->assertOk();
        $activities = $response->original->getData()['page']['props']['activities']['data'];

        expect(collect($activities)->pluck('id'))
            ->toContain($recentActivity->id)
            ->toContain($boundaryActivity->id)
            ->not->toContain($oldActivity->id);
    });

    it('shows activities from last 7 days for Free user on project endpoint', function () {
        $user = User::factory()->create(['plan' => UserPlan::Free]);
        $project = Project::factory()->create(['user_id' => $user->id]);

        // Activity within 7 days (should be visible)
        $recentActivity = createActivityAt([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'type' => ActivityType::TaskCreated,
            'description' => 'Recent activity',
        ], now()->subDays(5));

        // Activity older than 7 days (should NOT be visible)
        $oldActivity = createActivityAt([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'type' => ActivityType::TaskCreated,
            'description' => 'Old activity',
        ], now()->subDays(10));

        $response = $this->actingAs($user)->getJson(
            route('api.projects.activities', $project)
        );

        $response->assertOk();
        $activityIds = collect($response->json('activities'))->pluck('id');

        expect($activityIds)
            ->toContain($recentActivity->id)
            ->not->toContain($oldActivity->id);
    });

    it('shows activities from last 30 days for Pro user on project endpoint', function () {
        $user = User::factory()->create(['plan' => UserPlan::Pro]);
        $project = Project::factory()->create(['user_id' => $user->id]);

        // Activity within 30 days (should be visible)
        $recentActivity = createActivityAt([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'type' => ActivityType::TaskCreated,
            'description' => 'Recent activity',
        ], now()->subDays(20));

        // Activity older than 30 days (should NOT be visible)
        $oldActivity = createActivityAt([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'type' => ActivityType::TaskCreated,
            'description' => 'Old activity',
        ], now()->subDays(35));

        $response = $this->actingAs($user)->getJson(
            route('api.projects.activities', $project)
        );

        $response->assertOk();
        $activityIds = collect($response->json('activities'))->pluck('id');

        expect($activityIds)
            ->toContain($recentActivity->id)
            ->not->toContain($oldActivity->id);
    });

    it('shows activities from last 7 days for Free user on list endpoint', function () {
        $user = User::factory()->create(['plan' => UserPlan::Free]);
        $project = Project::factory()->create(['user_id' => $user->id]);

        // Activity within 7 days (should be visible)
        $recentActivity = createActivityAt([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'type' => ActivityType::TaskCreated,
            'description' => 'Recent activity',
        ], now()->subDays(3));

        // Activity older than 7 days (should NOT be visible)
        $oldActivity = createActivityAt([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'type' => ActivityType::TaskCreated,
            'description' => 'Old activity',
        ], now()->subDays(10));

        $response = $this->actingAs($user)->getJson(route('api.activities.list'));

        $response->assertOk();
        $activityIds = collect($response->json('activities'))->pluck('id');

        expect($activityIds)
            ->toContain($recentActivity->id)
            ->not->toContain($oldActivity->id);
    });

    it('shows activities from last 30 days for Pro user on list endpoint', function () {
        $user = User::factory()->create(['plan' => UserPlan::Pro]);
        $project = Project::factory()->create(['user_id' => $user->id]);

        // Activity within 30 days (should be visible)
        $recentActivity = createActivityAt([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'type' => ActivityType::TaskCreated,
            'description' => 'Recent activity',
        ], now()->subDays(15));

        // Activity older than 30 days (should NOT be visible)
        $oldActivity = createActivityAt([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'type' => ActivityType::TaskCreated,
            'description' => 'Old activity',
        ], now()->subDays(35));

        $response = $this->actingAs($user)->getJson(route('api.activities.list'));

        $response->assertOk();
        $activityIds = collect($response->json('activities'))->pluck('id');

        expect($activityIds)
            ->toContain($recentActivity->id)
            ->not->toContain($oldActivity->id);
    });

    it('Free user sees less history than Pro user for same project', function () {
        $proUser = User::factory()->create(['plan' => UserPlan::Pro]);
        $project = Project::factory()->create(['user_id' => $proUser->id]);

        // Create Free user as member
        $freeUser = User::factory()->create(['plan' => UserPlan::Free]);
        $project->members()->attach($freeUser->id, ['role' => 'viewer']);

        // Activity at 15 days (visible for Pro, NOT for Free)
        $midActivity = createActivityAt([
            'user_id' => $proUser->id,
            'project_id' => $project->id,
            'type' => ActivityType::TaskCreated,
            'description' => 'Mid-range activity',
        ], now()->subDays(15));

        // Activity at 3 days (visible for both)
        $recentActivity = createActivityAt([
            'user_id' => $proUser->id,
            'project_id' => $project->id,
            'type' => ActivityType::TaskCreated,
            'description' => 'Recent activity',
        ], now()->subDays(3));

        // Pro user sees both
        $proResponse = $this->actingAs($proUser)->getJson(route('api.activities.list'));
        $proActivityIds = collect($proResponse->json('activities'))->pluck('id');

        expect($proActivityIds)
            ->toContain($recentActivity->id)
            ->toContain($midActivity->id);

        // Free user sees only recent
        $freeResponse = $this->actingAs($freeUser)->getJson(route('api.activities.list'));
        $freeActivityIds = collect($freeResponse->json('activities'))->pluck('id');

        expect($freeActivityIds)
            ->toContain($recentActivity->id)
            ->not->toContain($midActivity->id);
    });

    it('downgraded user loses access to older activities', function () {
        $user = User::factory()->create(['plan' => UserPlan::Pro]);
        $project = Project::factory()->create(['user_id' => $user->id]);

        // Activity at 15 days
        $midActivity = createActivityAt([
            'user_id' => $user->id,
            'project_id' => $project->id,
            'type' => ActivityType::TaskCreated,
            'description' => 'Mid-range activity',
        ], now()->subDays(15));

        // As Pro, can see 15-day old activity
        $proResponse = $this->actingAs($user)->getJson(route('api.activities.list'));
        expect(collect($proResponse->json('activities'))->pluck('id'))
            ->toContain($midActivity->id);

        // Downgrade to Free
        $user->update(['plan' => UserPlan::Free]);
        $user->refresh();

        // As Free, cannot see 15-day old activity
        $freeResponse = $this->actingAs($user)->getJson(route('api.activities.list'));
        expect(collect($freeResponse->json('activities'))->pluck('id'))
            ->not->toContain($midActivity->id);
    });
});
