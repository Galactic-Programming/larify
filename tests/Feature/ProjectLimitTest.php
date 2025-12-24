<?php

use App\Enums\UserPlan;
use App\Models\Project;
use App\Models\User;

describe('Project Creation Limits', function () {
    it('allows Free user to create project when under limit', function () {
        $user = User::factory()->create(['plan' => UserPlan::Free]);

        // Create 2 projects (under limit of 3)
        Project::factory()->count(2)->for($user)->create();

        $response = $this->actingAs($user)->post(route('projects.store'), [
            'name' => 'New Project',
            'description' => 'Test description',
            'color' => '#6366f1',
            'icon' => 'folder',
        ]);

        $response->assertRedirect(route('projects.index'));
        expect($user->projects()->count())->toBe(3);
    });

    it('prevents Free user from creating project when at limit', function () {
        $user = User::factory()->create(['plan' => UserPlan::Free]);

        // Create 3 projects (at limit)
        Project::factory()->count(3)->for($user)->create();

        $response = $this->actingAs($user)->post(route('projects.store'), [
            'name' => 'New Project',
            'description' => 'Test description',
            'color' => '#6366f1',
            'icon' => 'folder',
        ]);

        $response->assertForbidden();
        expect($user->projects()->count())->toBe(3);
    });

    it('returns proper error message when Free user hits project limit via JSON', function () {
        $user = User::factory()->create(['plan' => UserPlan::Free]);
        Project::factory()->count(3)->for($user)->create();

        $response = $this->actingAs($user)->postJson(route('projects.store'), [
            'name' => 'New Project',
            'color' => '#6366f1',
        ]);

        $response->assertForbidden();
        $response->assertJson([
            'message' => 'You have reached the maximum of 3 projects for your plan. Please upgrade to Pro for unlimited projects.',
        ]);
    });

    it('allows Pro user to create unlimited projects', function () {
        $user = User::factory()->create(['plan' => UserPlan::Pro]);

        // Create 10 projects
        Project::factory()->count(10)->for($user)->create();

        $response = $this->actingAs($user)->post(route('projects.store'), [
            'name' => 'Another Project',
            'description' => 'Test description',
            'color' => '#6366f1',
            'icon' => 'folder',
        ]);

        $response->assertRedirect(route('projects.index'));
        expect($user->projects()->count())->toBe(11);
    });

    it('does not count member projects toward Free user limit', function () {
        $owner = User::factory()->create(['plan' => UserPlan::Pro]);
        $member = User::factory()->create(['plan' => UserPlan::Free]);

        // Owner creates 5 projects and adds member
        $projects = Project::factory()->count(5)->for($owner)->create();
        foreach ($projects as $project) {
            $project->members()->attach($member->id, ['role' => 'editor', 'joined_at' => now()]);
        }

        // Member has 0 owned projects, so should be able to create 3
        expect($member->projects()->count())->toBe(0);
        expect($member->memberProjects()->count())->toBe(5);

        $response = $this->actingAs($member)->post(route('projects.store'), [
            'name' => 'My Own Project',
            'color' => '#6366f1',
        ]);

        $response->assertRedirect(route('projects.index'));
        expect($member->projects()->count())->toBe(1);
    });

    it('allows Free user with existing over-limit projects to keep them', function () {
        // Simulate a user who had Pro and downgraded with > 3 projects
        $user = User::factory()->create(['plan' => UserPlan::Free]);

        // Directly insert 5 projects (simulating legacy data)
        Project::factory()->count(5)->for($user)->create();

        // User should not be able to create more but existing ones are preserved
        expect($user->projects()->count())->toBe(5);
        expect($user->canCreateProject())->toBeFalse();

        // Attempting to create should fail
        $response = $this->actingAs($user)->post(route('projects.store'), [
            'name' => 'New Project',
            'color' => '#6366f1',
        ]);

        $response->assertForbidden();
        // Existing projects remain
        expect($user->projects()->count())->toBe(5);
    });
});
