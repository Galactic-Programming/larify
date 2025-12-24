<?php

use App\Enums\ProjectRole;
use App\Enums\UserPlan;
use App\Models\Project;
use App\Models\TaskList;
use App\Models\User;

describe('Task List Creation Limits', function () {
    it('allows creating list when owner (Free) is under limit', function () {
        $owner = User::factory()->create(['plan' => UserPlan::Free]);
        $project = Project::factory()->for($owner)->create();

        // Create 4 lists (under limit of 5)
        TaskList::factory()->count(4)->for($project)->create();

        $response = $this->actingAs($owner)->post(
            route('projects.lists.store', $project),
            ['name' => 'New List']
        );

        $response->assertRedirect();
        expect($project->lists()->count())->toBe(5);
    });

    it('prevents creating list when owner (Free) is at limit', function () {
        $owner = User::factory()->create(['plan' => UserPlan::Free]);
        $project = Project::factory()->for($owner)->create();

        // Create 5 lists (at limit)
        TaskList::factory()->count(5)->for($project)->create();

        $response = $this->actingAs($owner)->post(
            route('projects.lists.store', $project),
            ['name' => 'New List']
        );

        $response->assertForbidden();
        expect($project->lists()->count())->toBe(5);
    });

    it('returns proper error message when hitting list limit via JSON', function () {
        $owner = User::factory()->create(['plan' => UserPlan::Free]);
        $project = Project::factory()->for($owner)->create();
        TaskList::factory()->count(5)->for($project)->create();

        $response = $this->actingAs($owner)->postJson(
            route('projects.lists.store', $project),
            ['name' => 'New List']
        );

        $response->assertForbidden();
        $response->assertJson([
            'message' => 'This project has reached the maximum of 5 lists. The project owner needs to upgrade to Pro for unlimited lists.',
        ]);
    });

    it('allows creating list when owner is Pro', function () {
        $owner = User::factory()->create(['plan' => UserPlan::Pro]);
        $project = Project::factory()->for($owner)->create();

        // Create 10 lists
        TaskList::factory()->count(10)->for($project)->create();

        $response = $this->actingAs($owner)->post(
            route('projects.lists.store', $project),
            ['name' => 'New List']
        );

        $response->assertRedirect();
        expect($project->lists()->count())->toBe(11);
    });

    it('checks owner plan when member tries to create list', function () {
        $owner = User::factory()->create(['plan' => UserPlan::Free]);
        $member = User::factory()->create(['plan' => UserPlan::Pro]);
        $project = Project::factory()->for($owner)->create();

        // Add member as editor
        $project->members()->attach($member->id, [
            'role' => ProjectRole::Editor->value,
            'joined_at' => now(),
        ]);

        // Create 5 lists (at owner's limit)
        TaskList::factory()->count(5)->for($project)->create();

        // Member is Pro but owner is Free at limit
        $response = $this->actingAs($member)->post(
            route('projects.lists.store', $project),
            ['name' => 'New List']
        );

        $response->assertForbidden();
        expect($project->lists()->count())->toBe(5);
    });

    it('allows member to create list when owner is Pro', function () {
        $owner = User::factory()->create(['plan' => UserPlan::Pro]);
        $member = User::factory()->create(['plan' => UserPlan::Free]);
        $project = Project::factory()->for($owner)->create();

        // Add member as editor
        $project->members()->attach($member->id, [
            'role' => ProjectRole::Editor->value,
            'joined_at' => now(),
        ]);

        // Create 10 lists
        TaskList::factory()->count(10)->for($project)->create();

        $response = $this->actingAs($member)->post(
            route('projects.lists.store', $project),
            ['name' => 'New List']
        );

        $response->assertRedirect();
        expect($project->lists()->count())->toBe(11);
    });

    it('prevents viewer from creating lists regardless of limit', function () {
        $owner = User::factory()->create(['plan' => UserPlan::Pro]);
        $viewer = User::factory()->create();
        $project = Project::factory()->for($owner)->create();

        // Add viewer
        $project->members()->attach($viewer->id, [
            'role' => ProjectRole::Viewer->value,
            'joined_at' => now(),
        ]);

        $response = $this->actingAs($viewer)->post(
            route('projects.lists.store', $project),
            ['name' => 'New List']
        );

        $response->assertForbidden();
        // Error should be about permission, not limit
        expect($response->getContent())->toContain('permission');
    });

    it('does not count soft-deleted lists toward limit', function () {
        $owner = User::factory()->create(['plan' => UserPlan::Free]);
        $project = Project::factory()->for($owner)->create();

        // Create 5 lists and soft delete 2
        $lists = TaskList::factory()->count(5)->for($project)->create();
        $lists[0]->delete();
        $lists[1]->delete();

        // Active lists = 3, should be able to create 2 more
        expect($project->lists()->count())->toBe(3);

        $response = $this->actingAs($owner)->post(
            route('projects.lists.store', $project),
            ['name' => 'New List']
        );

        $response->assertRedirect();
        expect($project->lists()->count())->toBe(4);
    });
});
