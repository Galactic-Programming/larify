<?php

use App\Enums\UserPlan;
use App\Models\Project;
use App\Models\TaskList;
use App\Models\User;

// === User::canCreateProject() Tests ===

describe('User::canCreateProject()', function () {
    it('allows Free user to create project when under limit', function () {
        $user = User::factory()->create(['plan' => UserPlan::Free]);

        // Create 2 projects (under limit of 3)
        Project::factory()->count(2)->for($user)->create();

        expect($user->canCreateProject())->toBeTrue();
    });

    it('prevents Free user from creating project when at limit', function () {
        $user = User::factory()->create(['plan' => UserPlan::Free]);

        // Create 3 projects (at limit)
        Project::factory()->count(3)->for($user)->create();

        expect($user->canCreateProject())->toBeFalse();
    });

    it('allows Pro user to create unlimited projects', function () {
        $user = User::factory()->create(['plan' => UserPlan::Pro]);

        // Create 10 projects
        Project::factory()->count(10)->for($user)->create();

        expect($user->canCreateProject())->toBeTrue();
    });

    it('allows Free user with no projects to create project', function () {
        $user = User::factory()->create(['plan' => UserPlan::Free]);

        expect($user->canCreateProject())->toBeTrue();
    });
});

// === User::remainingProjectSlots() Tests ===

describe('User::remainingProjectSlots()', function () {
    it('returns correct remaining slots for Free user', function () {
        $user = User::factory()->create(['plan' => UserPlan::Free]);

        Project::factory()->count(1)->for($user)->create();

        expect($user->remainingProjectSlots())->toBe(2);
    });

    it('returns 0 when Free user is at limit', function () {
        $user = User::factory()->create(['plan' => UserPlan::Free]);

        Project::factory()->count(3)->for($user)->create();

        expect($user->remainingProjectSlots())->toBe(0);
    });

    it('returns null (unlimited) for Pro user', function () {
        $user = User::factory()->create(['plan' => UserPlan::Pro]);

        expect($user->remainingProjectSlots())->toBeNull();
    });

    it('returns 3 for Free user with no projects', function () {
        $user = User::factory()->create(['plan' => UserPlan::Free]);

        expect($user->remainingProjectSlots())->toBe(3);
    });
});

// === User::canCreateListInProject() Tests ===

describe('User::canCreateListInProject()', function () {
    it('allows creating list when project owner (Free) is under limit', function () {
        $owner = User::factory()->create(['plan' => UserPlan::Free]);
        $project = Project::factory()->for($owner)->create();

        // Create 4 lists (under limit of 5)
        TaskList::factory()->count(4)->for($project)->create();

        expect($owner->canCreateListInProject($project))->toBeTrue();
    });

    it('prevents creating list when project owner (Free) is at limit', function () {
        $owner = User::factory()->create(['plan' => UserPlan::Free]);
        $project = Project::factory()->for($owner)->create();

        // Create 5 lists (at limit)
        TaskList::factory()->count(5)->for($project)->create();

        expect($owner->canCreateListInProject($project))->toBeFalse();
    });

    it('allows creating list when project owner is Pro', function () {
        $owner = User::factory()->create(['plan' => UserPlan::Pro]);
        $project = Project::factory()->for($owner)->create();

        // Create 10 lists
        TaskList::factory()->count(10)->for($project)->create();

        expect($owner->canCreateListInProject($project))->toBeTrue();
    });

    it('checks owner plan when member tries to create list', function () {
        $owner = User::factory()->create(['plan' => UserPlan::Free]);
        $member = User::factory()->create(['plan' => UserPlan::Pro]);
        $project = Project::factory()->for($owner)->create();

        // Create 5 lists (at owner's limit)
        TaskList::factory()->count(5)->for($project)->create();

        // Even though member is Pro, owner is Free and at limit
        expect($member->canCreateListInProject($project))->toBeFalse();
    });

    it('allows member to create list when owner is Pro', function () {
        $owner = User::factory()->create(['plan' => UserPlan::Pro]);
        $member = User::factory()->create(['plan' => UserPlan::Free]);
        $project = Project::factory()->for($owner)->create();

        // Create 10 lists
        TaskList::factory()->count(10)->for($project)->create();

        // Owner is Pro, so unlimited
        expect($member->canCreateListInProject($project))->toBeTrue();
    });
});

// === User::getPlanLimits() Tests ===

describe('User::getPlanLimits()', function () {
    it('returns correct limits with current usage for Free user', function () {
        $user = User::factory()->create(['plan' => UserPlan::Free]);
        Project::factory()->count(2)->for($user)->create();

        $limits = $user->getPlanLimits();

        expect($limits['max_projects'])->toBe(3);
        expect($limits['current_projects'])->toBe(2);
        expect($limits['can_create_project'])->toBeTrue();
        expect($limits['remaining_project_slots'])->toBe(1);
        expect($limits['can_use_chat'])->toBeFalse();
    });

    it('returns correct limits for Pro user', function () {
        $user = User::factory()->create(['plan' => UserPlan::Pro]);
        Project::factory()->count(5)->for($user)->create();

        $limits = $user->getPlanLimits();

        expect($limits['max_projects'])->toBeNull();
        expect($limits['current_projects'])->toBe(5);
        expect($limits['can_create_project'])->toBeTrue();
        expect($limits['remaining_project_slots'])->toBeNull();
        expect($limits['can_use_chat'])->toBeTrue();
    });

    it('returns Free limits for user with default free plan', function () {
        // Users default to 'free' plan in database
        $user = User::factory()->create(['plan' => UserPlan::Free]);

        $limits = $user->getPlanLimits();

        expect($limits['max_projects'])->toBe(3);
        expect($limits['can_use_chat'])->toBeFalse();
    });
});
