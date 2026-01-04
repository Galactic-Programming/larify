<?php

use App\Enums\ProjectRole;
use App\Enums\UserPlan;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Event;

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

it('allows pro user to add a member', function () {
    $owner = User::factory()->create(['plan' => UserPlan::Pro]);
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

it('prevents free user from adding members', function () {
    $owner = User::factory()->create(['plan' => UserPlan::Free]);
    $project = Project::factory()->create(['user_id' => $owner->id]);
    $newMember = User::factory()->create();

    $response = $this->actingAs($owner)->post(route('projects.members.store', $project), [
        'user_id' => $newMember->id,
        'role' => 'editor',
    ]);

    $response->assertForbidden();
    expect($project->members)->toHaveCount(0);
});

it('allows pro user to update member role', function () {
    $owner = User::factory()->create(['plan' => UserPlan::Pro]);
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

it('prevents free user from updating member role', function () {
    // Free user somehow has a member (legacy data or downgrade scenario)
    $owner = User::factory()->create(['plan' => UserPlan::Free]);
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

    $response->assertForbidden();
});

it('allows pro user to remove a member', function () {
    $owner = User::factory()->create(['plan' => UserPlan::Pro]);
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

it('prevents free user from removing members', function () {
    $owner = User::factory()->create(['plan' => UserPlan::Free]);
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

    $response->assertForbidden();
    expect($project->fresh()->members)->toHaveCount(1);
});

it('prevents non-owner from adding members', function () {
    $owner = User::factory()->create(['plan' => UserPlan::Pro]);
    $project = Project::factory()->create(['user_id' => $owner->id]);
    $member = User::factory()->create(['plan' => UserPlan::Pro]);
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

it('broadcasts conversation added event when member is added', function () {
    Event::fake([\App\Events\ConversationAdded::class]);

    $owner = User::factory()->create(['plan' => UserPlan::Pro]);
    $project = Project::factory()->create(['user_id' => $owner->id]);
    $newMember = User::factory()->create();

    // Add first member to trigger conversation creation
    $this->actingAs($owner)->post(route('projects.members.store', $project), [
        'user_id' => $newMember->id,
        'role' => 'editor',
    ]);

    // Conversation should be created and both users should be participants
    $conversation = $project->fresh()->conversation;
    expect($conversation)->not->toBeNull();
    expect($conversation->participants)->toHaveCount(2);
    expect($conversation->participants->pluck('id')->toArray())->toContain($owner->id, $newMember->id);

    // Event should be dispatched for new member
    Event::assertDispatched(\App\Events\ConversationAdded::class, function ($event) use ($newMember, $conversation) {
        return $event->user->id === $newMember->id && $event->conversation->id === $conversation->id;
    });
});

it('broadcasts conversation added event to new member when second member is added', function () {
    Event::fake([\App\Events\ConversationAdded::class]);

    $owner = User::factory()->create(['plan' => UserPlan::Pro]);
    $existingMember = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $owner->id]);

    // Add first member (conversation created)
    $project->members()->attach($existingMember->id, [
        'role' => ProjectRole::Editor->value,
        'joined_at' => now(),
    ]);
    $project->getOrCreateConversation();

    // Clear events to only track new events
    Event::fake([\App\Events\ConversationAdded::class]);

    // Add second member
    $newMember = User::factory()->create();
    $this->actingAs($owner)->post(route('projects.members.store', $project), [
        'user_id' => $newMember->id,
        'role' => 'editor',
    ]);

    // Conversation should now have 3 participants
    $conversation = $project->fresh()->conversation;
    expect($conversation->participants)->toHaveCount(3);

    // Event should only be dispatched for new member
    Event::assertDispatched(\App\Events\ConversationAdded::class, function ($event) use ($newMember) {
        return $event->user->id === $newMember->id;
    });

    // Event should NOT be dispatched for existing members
    Event::assertNotDispatched(\App\Events\ConversationAdded::class, function ($event) use ($owner, $existingMember) {
        return $event->user->id === $owner->id || $event->user->id === $existingMember->id;
    });
});

it('broadcasts conversation removed event when member is removed', function () {
    Event::fake([\App\Events\ConversationRemoved::class]);

    $owner = User::factory()->create(['plan' => UserPlan::Pro]);
    $member = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $owner->id]);

    // Add member and create conversation
    $project->members()->attach($member->id, [
        'role' => ProjectRole::Editor->value,
        'joined_at' => now(),
    ]);
    $conversation = $project->getOrCreateConversation();

    // Get projectMember record for route
    $projectMember = $project->projectMembers()->first();

    // Clear events to only track remove events
    Event::fake([\App\Events\ConversationRemoved::class]);

    // Remove member
    $this->actingAs($owner)->delete(route('projects.members.destroy', [$project, $projectMember]));

    // Member should be removed from project
    expect($project->fresh()->members)->toHaveCount(0);

    // Conversation should only have owner as participant
    expect($conversation->fresh()->participants)->toHaveCount(1);
    expect($conversation->fresh()->participants->first()->id)->toBe($owner->id);

    // ConversationRemoved event should be dispatched for removed member
    Event::assertDispatched(\App\Events\ConversationRemoved::class, function ($event) use ($member, $conversation) {
        return $event->user->id === $member->id && $event->conversationId === $conversation->id;
    });
});
