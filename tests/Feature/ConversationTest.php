<?php

use App\Enums\ProjectRole;
use App\Models\Conversation;
use App\Models\Project;
use App\Models\User;

/**
 * Helper to create a project with members and conversation.
 */
function createProjectWithConversation(User $owner, array $members = []): array
{
    $project = Project::factory()->create(['user_id' => $owner->id]);

    foreach ($members as $member) {
        $project->members()->attach($member->id, [
            'role' => ProjectRole::Editor->value,
            'joined_at' => now(),
        ]);
    }

    // Trigger conversation creation if there are 2+ members
    $conversation = $project->getOrCreateConversation();

    return [$project, $conversation];
}

// === CONVERSATION LIST ===

it('allows authenticated user to view conversations list', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('conversations.index'));

    $response->assertOk();
});

it('shows conversations from user projects', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();

    [$project, $conversation] = createProjectWithConversation($owner, [$member]);

    $response = $this->actingAs($owner)->get(route('conversations.index'));

    $response->assertOk();
    expect($conversation)->not->toBeNull();
});

it('does not show conversations from projects user is not a member of', function () {
    $user = User::factory()->create();
    $otherOwner = User::factory()->create();
    $otherMember = User::factory()->create();

    // Other user's project with conversation
    createProjectWithConversation($otherOwner, [$otherMember]);

    // Get user's conversations
    $conversations = $user->conversations;

    expect($conversations)->toHaveCount(0);
});

// === CONVERSATION ACCESS ===

it('allows project member to view conversation', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();

    [$project, $conversation] = createProjectWithConversation($owner, [$member]);

    $response = $this->actingAs($owner)->get(route('conversations.show', $conversation));
    $response->assertOk();

    $response = $this->actingAs($member)->get(route('conversations.show', $conversation));
    $response->assertOk();
});

it('prevents non-member from viewing conversation', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();
    $outsider = User::factory()->create();

    [$project, $conversation] = createProjectWithConversation($owner, [$member]);

    $response = $this->actingAs($outsider)->get(route('conversations.show', $conversation));

    $response->assertForbidden();
});

// === SHOW BY PROJECT ===

it('allows project member to access chat via project route', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();

    [$project, $conversation] = createProjectWithConversation($owner, [$member]);

    $response = $this->actingAs($owner)->get(route('projects.chat', $project));

    // showByProject returns Inertia render (not redirect) when conversation exists
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('conversations/show')
        ->has('conversation')
    );
});

it('shows empty state for single-member project chat', function () {
    $owner = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $owner->id]);

    // Project has only owner, no conversation should exist
    $response = $this->actingAs($owner)->get(route('projects.chat', $project));

    // Should render empty state (conversation is null)
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('conversations/show')
        ->has('project')
        ->where('conversation', null)
    );
});

it('prevents non-member from accessing project chat', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();
    $outsider = User::factory()->create();

    [$project, $conversation] = createProjectWithConversation($owner, [$member]);

    $response = $this->actingAs($outsider)->get(route('projects.chat', $project));

    $response->assertForbidden();
});

// === CONVERSATION CREATION ===

it('creates conversation when project has 2+ members', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();

    $project = Project::factory()->create(['user_id' => $owner->id]);
    $project->members()->attach($member->id, [
        'role' => ProjectRole::Editor->value,
        'joined_at' => now(),
    ]);

    // Conversation should be created when getOrCreateConversation is called
    $conversation = $project->getOrCreateConversation();

    expect($conversation)->not->toBeNull();
    expect(Conversation::where('project_id', $project->id)->count())->toBe(1);
});

it('does not create conversation for single-member project', function () {
    $owner = User::factory()->create();
    $project = Project::factory()->create(['user_id' => $owner->id]);

    // Should return null for single-member project
    $conversation = $project->getOrCreateConversation();

    expect($conversation)->toBeNull();
    expect(Conversation::where('project_id', $project->id)->count())->toBe(0);
});

it('reuses existing conversation for same project', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();

    $project = Project::factory()->create(['user_id' => $owner->id]);
    $project->members()->attach($member->id, [
        'role' => ProjectRole::Editor->value,
        'joined_at' => now(),
    ]);

    $conversation1 = $project->getOrCreateConversation();
    $conversation2 = $project->getOrCreateConversation();

    expect($conversation1->id)->toBe($conversation2->id);
    expect(Conversation::where('project_id', $project->id)->count())->toBe(1);
});

// === PARTICIPANT SYNC ===

it('syncs participants when members are added', function () {
    $owner = User::factory()->create();
    $member1 = User::factory()->create();
    $member2 = User::factory()->create();

    $project = Project::factory()->create(['user_id' => $owner->id]);
    $project->members()->attach($member1->id, [
        'role' => ProjectRole::Editor->value,
        'joined_at' => now(),
    ]);

    // Create conversation with initial members
    $conversation = $project->getOrCreateConversation();
    expect($conversation->participants)->toHaveCount(2);

    // Add another member and sync
    $project->members()->attach($member2->id, [
        'role' => ProjectRole::Editor->value,
        'joined_at' => now(),
    ]);
    $project->syncConversationParticipants();

    $conversation->refresh();
    expect($conversation->participants)->toHaveCount(3);
});

// === CONVERSATION DISPLAY ===

it('displays project name as conversation name', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();

    $project = Project::factory()->create([
        'user_id' => $owner->id,
        'name' => 'My Test Project',
    ]);
    $project->members()->attach($member->id, [
        'role' => ProjectRole::Editor->value,
        'joined_at' => now(),
    ]);

    $conversation = $project->getOrCreateConversation();

    expect($conversation->getDisplayName())->toBe('My Test Project');
});

it('displays project color and icon', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();

    $project = Project::factory()->create([
        'user_id' => $owner->id,
        'color' => 'blue',
        'icon' => 'Folder',
    ]);
    $project->members()->attach($member->id, [
        'role' => ProjectRole::Editor->value,
        'joined_at' => now(),
    ]);

    $conversation = $project->getOrCreateConversation();

    expect($conversation->getDisplayColor())->toBe('blue');
    expect($conversation->getDisplayIcon())->toBe('Folder');
});
