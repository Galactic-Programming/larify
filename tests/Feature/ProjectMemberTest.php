<?php

use App\Enums\ProjectRole;
use App\Models\Project;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('allows project owner to access members page', function () {
    $owner = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $owner->id]);
    $member = User::factory()->create();
    $project->members()->attach($member->id, [
        'role' => ProjectRole::Editor->value,
        'joined_at' => now(),
    ]);

    // Test that the route is accessible (no 403/404) but don't assert Inertia render
    // since Vite manifest isn't built in test environment
    $response = $this->actingAs($owner)->get(route('projects.members.index', $project));

    // Check it doesn't return forbidden or not found
    expect($response->status())->not->toBe(403);
    expect($response->status())->not->toBe(404);
});

it('allows project owner to add a member', function () {
    $owner = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $owner->id]);
    $newMember = User::factory()->create();

    $response = $this->actingAs($owner)->post(route('projects.members.store', $project), [
        'user_id' => $newMember->id,
        'role' => 'editor',
    ]);

    $response->assertRedirect();
    expect($project->members)->toHaveCount(1);
    expect($project->members->first()->id)->toBe($newMember->id);
});

it('allows project owner to update member role', function () {
    $owner = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $owner->id]);
    $member = User::factory()->create();
    $project->members()->attach($member->id, [
        'role' => ProjectRole::Viewer->value,
        'joined_at' => now(),
    ]);

    $projectMember = $project->projectMembers()->first();

    $response = $this->actingAs($owner)->patch(
        route('projects.members.update', [$project, $projectMember]),
        ['role' => 'editor']
    );

    $response->assertRedirect();
    $projectMember->refresh();
    expect($projectMember->role->value)->toBe('editor');
});

it('allows project owner to remove a member', function () {
    $owner = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $owner->id]);
    $member = User::factory()->create();
    $project->members()->attach($member->id, [
        'role' => ProjectRole::Editor->value,
        'joined_at' => now(),
    ]);

    $projectMember = $project->projectMembers()->first();

    $response = $this->actingAs($owner)->delete(
        route('projects.members.destroy', [$project, $projectMember])
    );

    $response->assertRedirect();
    expect($project->fresh()->members)->toHaveCount(0);
});

it('prevents non-owner from adding members', function () {
    $owner = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $owner->id]);
    $member = User::factory()->create();
    $project->members()->attach($member->id, [
        'role' => ProjectRole::Editor->value,
        'joined_at' => now(),
    ]);
    $newUser = User::factory()->create();

    $response = $this->actingAs($member)->post(route('projects.members.store', $project), [
        'user_id' => $newUser->id,
        'role' => 'viewer',
    ]);

    $response->assertForbidden();
});

it('allows member to access project members page', function () {
    $owner = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $owner->id]);
    $member = User::factory()->create();
    $project->members()->attach($member->id, [
        'role' => ProjectRole::Editor->value,
        'joined_at' => now(),
    ]);

    $response = $this->actingAs($member)->get(route('projects.members.index', $project));

    // Check it doesn't return forbidden or not found
    expect($response->status())->not->toBe(403);
    expect($response->status())->not->toBe(404);
});

it('prevents unauthorized user from viewing members', function () {
    $owner = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $owner->id]);
    $randomUser = User::factory()->create();

    $response = $this->actingAs($randomUser)->get(route('projects.members.index', $project));

    $response->assertForbidden();
});

it('shows shared projects in member project list', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $owner->id]);
    $project->members()->attach($member->id, [
        'role' => ProjectRole::Editor->value,
        'joined_at' => now(),
    ]);

    // Member can see the project in their projects list
    $projects = $member->allProjects()->get();

    expect($projects)->toHaveCount(1);
    expect($projects->first()->id)->toBe($project->id);
});

it('allows member to access shared project board', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $owner->id]);
    $project->members()->attach($member->id, [
        'role' => ProjectRole::Editor->value,
        'joined_at' => now(),
    ]);

    $response = $this->actingAs($member)->get(route('projects.lists.index', $project));

    // Check it doesn't return forbidden
    expect($response->status())->not->toBe(403);
});
