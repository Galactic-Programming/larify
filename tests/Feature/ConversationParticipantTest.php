<?php

use App\Enums\ConversationType;
use App\Enums\ParticipantRole;
use App\Enums\UserPlan;
use App\Models\Conversation;
use App\Models\User;

beforeEach(function () {
    // Chat is a Pro feature
    $this->owner = User::factory()->create(['plan' => UserPlan::Pro]);
    $this->member1 = User::factory()->create(['plan' => UserPlan::Pro]);
    $this->member2 = User::factory()->create(['plan' => UserPlan::Pro]);

    $this->groupConversation = Conversation::create([
        'type' => ConversationType::Group,
        'name' => 'Test Group',
        'created_by' => $this->owner->id,
    ]);
    $this->groupConversation->participantRecords()->createMany([
        ['user_id' => $this->owner->id, 'role' => ParticipantRole::Owner, 'joined_at' => now()],
        ['user_id' => $this->member1->id, 'role' => ParticipantRole::Member, 'joined_at' => now()],
    ]);
});

// === ADDING PARTICIPANTS ===

it('allows owner to add participant to group', function () {
    $newMember = User::factory()->create();

    $response = $this->actingAs($this->owner)->post(
        route('conversations.participants.store', $this->groupConversation),
        ['user_id' => $newMember->id]
    );

    $response->assertRedirect();

    expect($this->groupConversation->activeParticipants)->toHaveCount(3);
    expect($this->groupConversation->hasParticipant($newMember))->toBeTrue();
});

it('allows member to add participant to group', function () {
    $newMember = User::factory()->create();

    $response = $this->actingAs($this->member1)->post(
        route('conversations.participants.store', $this->groupConversation),
        ['user_id' => $newMember->id]
    );

    $response->assertRedirect();
    expect($this->groupConversation->activeParticipants)->toHaveCount(3);
    expect($this->groupConversation->hasParticipant($newMember))->toBeTrue();
});

it('prevents adding existing participant', function () {
    $response = $this->actingAs($this->owner)->post(
        route('conversations.participants.store', $this->groupConversation),
        ['user_id' => $this->member1->id]
    );

    $response->assertSessionHasErrors('user_id');
});

it('prevents adding yourself to conversation', function () {
    $newOwner = User::factory()->create();
    $conversation = Conversation::create([
        'type' => ConversationType::Group,
        'name' => 'Another Group',
        'created_by' => $newOwner->id,
    ]);
    $conversation->participantRecords()->create([
        'user_id' => $newOwner->id,
        'role' => ParticipantRole::Owner,
        'joined_at' => now(),
    ]);

    $response = $this->actingAs($newOwner)->post(
        route('conversations.participants.store', $conversation),
        ['user_id' => $newOwner->id]
    );

    $response->assertSessionHasErrors('user_id');
});

it('prevents adding participant to direct conversation', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $user3 = User::factory()->create();

    $directConversation = Conversation::create([
        'type' => ConversationType::Direct,
        'created_by' => $user1->id,
    ]);
    $directConversation->participantRecords()->createMany([
        ['user_id' => $user1->id, 'role' => ParticipantRole::Owner, 'joined_at' => now()],
        ['user_id' => $user2->id, 'role' => ParticipantRole::Member, 'joined_at' => now()],
    ]);

    $response = $this->actingAs($user1)->post(
        route('conversations.participants.store', $directConversation),
        ['user_id' => $user3->id]
    );

    $response->assertForbidden();
});

// === REMOVING PARTICIPANTS ===

it('allows owner to remove participant from group', function () {
    $participant = $this->groupConversation->participantRecords()
        ->where('user_id', $this->member1->id)
        ->first();

    $response = $this->actingAs($this->owner)->delete(
        route('conversations.participants.destroy', [$this->groupConversation, $participant])
    );

    $response->assertRedirect();

    $participant->refresh();
    expect($participant->left_at)->not->toBeNull();
});

it('prevents member from removing other participants', function () {
    $participant = $this->groupConversation->participantRecords()
        ->where('user_id', $this->member1->id)
        ->first();

    // Add member2 to conversation first
    $this->groupConversation->participantRecords()->create([
        'user_id' => $this->member2->id,
        'role' => ParticipantRole::Member,
        'joined_at' => now(),
    ]);

    $response = $this->actingAs($this->member2)->delete(
        route('conversations.participants.destroy', [$this->groupConversation, $participant])
    );

    $response->assertForbidden();
});

it('prevents owner from being removed', function () {
    $ownerParticipant = $this->groupConversation->participantRecords()
        ->where('user_id', $this->owner->id)
        ->first();

    $response = $this->actingAs($this->owner)->delete(
        route('conversations.participants.destroy', [$this->groupConversation, $ownerParticipant])
    );

    $response->assertRedirect();
    $response->assertSessionHas('error');

    $ownerParticipant->refresh();
    expect($ownerParticipant->left_at)->toBeNull();
});

// === TRANSFER OWNERSHIP ===

it('allows owner to transfer ownership', function () {
    $memberParticipant = $this->groupConversation->participantRecords()
        ->where('user_id', $this->member1->id)
        ->first();

    $response = $this->actingAs($this->owner)->post(
        route('conversations.participants.transfer-ownership', [$this->groupConversation, $memberParticipant])
    );

    $response->assertRedirect();

    $ownerParticipant = $this->groupConversation->participantRecords()
        ->where('user_id', $this->owner->id)
        ->first();
    $memberParticipant->refresh();

    expect($ownerParticipant->role)->toBe(ParticipantRole::Member);
    expect($memberParticipant->role)->toBe(ParticipantRole::Owner);
});

it('prevents member from transferring ownership', function () {
    // Add member2 to conversation
    $this->groupConversation->participantRecords()->create([
        'user_id' => $this->member2->id,
        'role' => ParticipantRole::Member,
        'joined_at' => now(),
    ]);

    $member2Participant = $this->groupConversation->participantRecords()
        ->where('user_id', $this->member2->id)
        ->first();

    $response = $this->actingAs($this->member1)->post(
        route('conversations.participants.transfer-ownership', [$this->groupConversation, $member2Participant])
    );

    $response->assertForbidden();
});

it('prevents transferring ownership to yourself', function () {
    $ownerParticipant = $this->groupConversation->participantRecords()
        ->where('user_id', $this->owner->id)
        ->first();

    $response = $this->actingAs($this->owner)->post(
        route('conversations.participants.transfer-ownership', [$this->groupConversation, $ownerParticipant])
    );

    $response->assertRedirect();
    $response->assertSessionHas('error');
});

// === PARTICIPANT ROLE MODEL TESTS ===

it('correctly identifies owner role', function () {
    $ownerParticipant = $this->groupConversation->participantRecords()
        ->where('user_id', $this->owner->id)
        ->first();

    expect($ownerParticipant->isOwner())->toBeTrue();
    expect($ownerParticipant->role->canManageMembers())->toBeTrue();
});

it('correctly identifies member role', function () {
    $memberParticipant = $this->groupConversation->participantRecords()
        ->where('user_id', $this->member1->id)
        ->first();

    expect($memberParticipant->isOwner())->toBeFalse();
    expect($memberParticipant->isMember())->toBeTrue();
    expect($memberParticipant->role->canManageMembers())->toBeFalse();
});

// === REJOIN CONVERSATION ===

it('allows previously left user to rejoin when added again', function () {
    // First, have member leave
    $this->groupConversation->participantRecords()
        ->where('user_id', $this->member1->id)
        ->update(['left_at' => now()]);

    expect($this->groupConversation->hasParticipant($this->member1))->toBeFalse();

    // Owner adds them back - this should create a new participant record
    $response = $this->actingAs($this->owner)->post(
        route('conversations.participants.store', $this->groupConversation),
        ['user_id' => $this->member1->id]
    );

    $response->assertRedirect();

    // Check there's an active participant record
    $activeParticipant = $this->groupConversation->participantRecords()
        ->where('user_id', $this->member1->id)
        ->whereNull('left_at')
        ->first();

    expect($activeParticipant)->not->toBeNull();
});
