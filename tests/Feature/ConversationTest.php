<?php

use App\Enums\ConversationType;
use App\Enums\ParticipantRole;
use App\Enums\UserPlan;
use App\Models\Conversation;
use App\Models\User;

// === CONVERSATION CREATION ===

it('allows authenticated user to view conversations list', function () {
    // Chat is a Pro feature
    $user = User::factory()->create(['plan' => UserPlan::Pro]);

    $response = $this->actingAs($user)->get(route('conversations.index'));

    expect($response->status())->not->toBe(403);
    expect($response->status())->not->toBe(404);
});

it('allows free user to view conversations page (shows upgrade prompt)', function () {
    // Free users can access the page but will see upgrade prompt
    $user = User::factory()->create(['plan' => UserPlan::Free]);

    $response = $this->actingAs($user)->get(route('conversations.index'));

    expect($response->status())->toBe(200);
});

it('allows user to create a direct conversation', function () {
    // Chat is a Pro feature
    $user1 = User::factory()->create(['plan' => UserPlan::Pro]);
    $user2 = User::factory()->create(['plan' => UserPlan::Pro]);

    $response = $this->actingAs($user1)->post(route('conversations.store'), [
        'type' => 'direct',
        'participant_ids' => [$user2->id],
    ]);

    $response->assertRedirect();

    $conversation = Conversation::where('type', ConversationType::Direct)->first();
    expect($conversation)->not->toBeNull();
    expect($conversation->activeParticipants)->toHaveCount(2);
});

it('reuses existing direct conversation when creating duplicate', function () {
    $user1 = User::factory()->create(['plan' => UserPlan::Pro]);
    $user2 = User::factory()->create(['plan' => UserPlan::Pro]);

    // Create first conversation
    $this->actingAs($user1)->post(route('conversations.store'), [
        'type' => 'direct',
        'participant_ids' => [$user2->id],
    ]);

    $countBefore = Conversation::count();

    // Try to create again
    $this->actingAs($user1)->post(route('conversations.store'), [
        'type' => 'direct',
        'participant_ids' => [$user2->id],
    ]);

    $countAfter = Conversation::count();

    expect($countAfter)->toBe($countBefore);
});

it('allows user to create a group conversation', function () {
    $owner = User::factory()->create(['plan' => UserPlan::Pro]);
    $member1 = User::factory()->create(['plan' => UserPlan::Pro]);
    $member2 = User::factory()->create(['plan' => UserPlan::Pro]);

    $response = $this->actingAs($owner)->post(route('conversations.store'), [
        'type' => 'group',
        'name' => 'Test Group',
        'participant_ids' => [$member1->id, $member2->id],
    ]);

    $response->assertRedirect();

    $conversation = Conversation::where('type', ConversationType::Group)->first();
    expect($conversation)->not->toBeNull();
    expect($conversation->name)->toBe('Test Group');
    expect($conversation->activeParticipants)->toHaveCount(3); // owner + 2 members
});

it('requires name for group conversation', function () {
    $owner = User::factory()->create(['plan' => UserPlan::Pro]);
    $member = User::factory()->create(['plan' => UserPlan::Pro]);

    $response = $this->actingAs($owner)->post(route('conversations.store'), [
        'type' => 'group',
        'participant_ids' => [$member->id],
    ]);

    $response->assertSessionHasErrors('name');
});

it('prevents adding yourself as participant', function () {
    $user = User::factory()->create(['plan' => UserPlan::Pro]);

    $response = $this->actingAs($user)->post(route('conversations.store'), [
        'type' => 'direct',
        'participant_ids' => [$user->id],
    ]);

    $response->assertSessionHasErrors('participant_ids.0');
});

// === CONVERSATION ACCESS ===

it('allows participant to view conversation', function () {
    $user1 = User::factory()->create(['plan' => UserPlan::Pro]);
    $user2 = User::factory()->create(['plan' => UserPlan::Pro]);

    $conversation = Conversation::create([
        'type' => ConversationType::Direct,
        'created_by' => $user1->id,
    ]);
    $conversation->participantRecords()->createMany([
        ['user_id' => $user1->id, 'role' => ParticipantRole::Owner, 'joined_at' => now()],
        ['user_id' => $user2->id, 'role' => ParticipantRole::Member, 'joined_at' => now()],
    ]);

    $response = $this->actingAs($user1)->get(route('conversations.show', $conversation));

    expect($response->status())->not->toBe(403);
    expect($response->status())->not->toBe(404);
});

it('prevents non-participant from viewing conversation', function () {
    $owner = User::factory()->create(['plan' => UserPlan::Pro]);
    $member = User::factory()->create(['plan' => UserPlan::Pro]);
    $outsider = User::factory()->create(['plan' => UserPlan::Pro]);

    $conversation = Conversation::create([
        'type' => ConversationType::Direct,
        'created_by' => $owner->id,
    ]);
    $conversation->participantRecords()->createMany([
        ['user_id' => $owner->id, 'role' => ParticipantRole::Owner, 'joined_at' => now()],
        ['user_id' => $member->id, 'role' => ParticipantRole::Member, 'joined_at' => now()],
    ]);

    $response = $this->actingAs($outsider)->get(route('conversations.show', $conversation));

    $response->assertForbidden();
});

// === CONVERSATION UPDATE ===

it('allows group owner to update conversation name', function () {
    $owner = User::factory()->create(['plan' => UserPlan::Pro]);
    $member = User::factory()->create(['plan' => UserPlan::Pro]);

    $conversation = Conversation::create([
        'type' => ConversationType::Group,
        'name' => 'Old Name',
        'created_by' => $owner->id,
    ]);
    $conversation->participantRecords()->createMany([
        ['user_id' => $owner->id, 'role' => ParticipantRole::Owner, 'joined_at' => now()],
        ['user_id' => $member->id, 'role' => ParticipantRole::Member, 'joined_at' => now()],
    ]);

    $response = $this->actingAs($owner)->patch(route('conversations.update', $conversation), [
        'name' => 'New Name',
    ]);

    $response->assertRedirect();
    $conversation->refresh();
    expect($conversation->name)->toBe('New Name');
});

it('prevents member from updating group conversation', function () {
    $owner = User::factory()->create(['plan' => UserPlan::Pro]);
    $member = User::factory()->create(['plan' => UserPlan::Pro]);

    $conversation = Conversation::create([
        'type' => ConversationType::Group,
        'name' => 'Old Name',
        'created_by' => $owner->id,
    ]);
    $conversation->participantRecords()->createMany([
        ['user_id' => $owner->id, 'role' => ParticipantRole::Owner, 'joined_at' => now()],
        ['user_id' => $member->id, 'role' => ParticipantRole::Member, 'joined_at' => now()],
    ]);

    $response = $this->actingAs($member)->patch(route('conversations.update', $conversation), [
        'name' => 'Hacked Name',
    ]);

    $response->assertForbidden();
    $conversation->refresh();
    expect($conversation->name)->toBe('Old Name');
});

it('prevents updating direct conversation', function () {
    $user1 = User::factory()->create(['plan' => UserPlan::Pro]);
    $user2 = User::factory()->create(['plan' => UserPlan::Pro]);

    $conversation = Conversation::create([
        'type' => ConversationType::Direct,
        'created_by' => $user1->id,
    ]);
    $conversation->participantRecords()->createMany([
        ['user_id' => $user1->id, 'role' => ParticipantRole::Owner, 'joined_at' => now()],
        ['user_id' => $user2->id, 'role' => ParticipantRole::Member, 'joined_at' => now()],
    ]);

    $response = $this->actingAs($user1)->patch(route('conversations.update', $conversation), [
        'name' => 'Should Not Work',
    ]);

    $response->assertForbidden();
});

// === CONVERSATION DELETION ===

it('allows group owner to delete conversation', function () {
    $owner = User::factory()->create(['plan' => UserPlan::Pro]);
    $member = User::factory()->create(['plan' => UserPlan::Pro]);

    $conversation = Conversation::create([
        'type' => ConversationType::Group,
        'name' => 'Test Group',
        'created_by' => $owner->id,
    ]);
    $conversation->participantRecords()->createMany([
        ['user_id' => $owner->id, 'role' => ParticipantRole::Owner, 'joined_at' => now()],
        ['user_id' => $member->id, 'role' => ParticipantRole::Member, 'joined_at' => now()],
    ]);

    $conversationId = $conversation->id;

    $response = $this->actingAs($owner)->delete(route('conversations.destroy', $conversation));

    $response->assertRedirect();
    expect(Conversation::find($conversationId))->toBeNull();
});

it('prevents member from deleting group conversation', function () {
    $owner = User::factory()->create(['plan' => UserPlan::Pro]);
    $member = User::factory()->create(['plan' => UserPlan::Pro]);

    $conversation = Conversation::create([
        'type' => ConversationType::Group,
        'name' => 'Test Group',
        'created_by' => $owner->id,
    ]);
    $conversation->participantRecords()->createMany([
        ['user_id' => $owner->id, 'role' => ParticipantRole::Owner, 'joined_at' => now()],
        ['user_id' => $member->id, 'role' => ParticipantRole::Member, 'joined_at' => now()],
    ]);

    $response = $this->actingAs($member)->delete(route('conversations.destroy', $conversation));

    $response->assertForbidden();
});

// === LEAVING CONVERSATION ===

it('allows member to leave group conversation', function () {
    $owner = User::factory()->create(['plan' => UserPlan::Pro]);
    $member = User::factory()->create(['plan' => UserPlan::Pro]);

    $conversation = Conversation::create([
        'type' => ConversationType::Group,
        'name' => 'Test Group',
        'created_by' => $owner->id,
    ]);
    $conversation->participantRecords()->createMany([
        ['user_id' => $owner->id, 'role' => ParticipantRole::Owner, 'joined_at' => now()],
        ['user_id' => $member->id, 'role' => ParticipantRole::Member, 'joined_at' => now()],
    ]);

    $response = $this->actingAs($member)->post(route('conversations.leave', $conversation));

    $response->assertRedirect();

    $participant = $conversation->participantRecords()->where('user_id', $member->id)->first();
    expect($participant->left_at)->not->toBeNull();
});

it('prevents owner from leaving group conversation', function () {
    $owner = User::factory()->create(['plan' => UserPlan::Pro]);
    $member = User::factory()->create(['plan' => UserPlan::Pro]);

    $conversation = Conversation::create([
        'type' => ConversationType::Group,
        'name' => 'Test Group',
        'created_by' => $owner->id,
    ]);
    $conversation->participantRecords()->createMany([
        ['user_id' => $owner->id, 'role' => ParticipantRole::Owner, 'joined_at' => now()],
        ['user_id' => $member->id, 'role' => ParticipantRole::Member, 'joined_at' => now()],
    ]);

    $response = $this->actingAs($owner)->post(route('conversations.leave', $conversation));

    $response->assertForbidden();
});

// === ARCHIVING DIRECT CONVERSATION ===

it('allows user to archive direct conversation', function () {
    $user1 = User::factory()->create(['plan' => UserPlan::Pro]);
    $user2 = User::factory()->create(['plan' => UserPlan::Pro]);

    $conversation = Conversation::findOrCreateDirect($user1, $user2);

    $response = $this->actingAs($user1)->delete(route('conversations.destroy', $conversation));

    $response->assertRedirect(route('conversations.index'));

    // Conversation should still exist
    expect(Conversation::find($conversation->id))->not->toBeNull();

    // User1's participant record should be archived
    $participant1 = $conversation->participantRecords()->where('user_id', $user1->id)->first();
    expect($participant1->archived_at)->not->toBeNull();

    // User2's participant record should NOT be archived
    $participant2 = $conversation->participantRecords()->where('user_id', $user2->id)->first();
    expect($participant2->archived_at)->toBeNull();
});

it('hides archived conversation from user list', function () {
    $user1 = User::factory()->create(['plan' => UserPlan::Pro]);
    $user2 = User::factory()->create(['plan' => UserPlan::Pro]);

    $conversation = Conversation::findOrCreateDirect($user1, $user2);

    // Archive the conversation for user1
    $conversation->participantRecords()
        ->where('user_id', $user1->id)
        ->update(['archived_at' => now()]);

    // User1 should not see the conversation
    expect($user1->activeConversations()->count())->toBe(0);

    // User2 should still see the conversation
    expect($user2->activeConversations()->count())->toBe(1);
});

it('allows other user to still see archived conversation', function () {
    $user1 = User::factory()->create(['plan' => UserPlan::Pro]);
    $user2 = User::factory()->create(['plan' => UserPlan::Pro]);

    $conversation = Conversation::findOrCreateDirect($user1, $user2);

    // User1 archives the conversation
    $this->actingAs($user1)->delete(route('conversations.destroy', $conversation));

    // User2 can still view the conversation
    $response = $this->actingAs($user2)->get(route('conversations.show', $conversation));
    $response->assertOk();
});
