<?php

use App\Enums\ConversationType;
use App\Enums\ParticipantRole;
use App\Enums\UserPlan;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;

describe('Chat Feature Gating', function () {
    // === VIEWING CONVERSATIONS ===

    it('allows Pro user to view conversations list', function () {
        $user = User::factory()->create(['plan' => UserPlan::Pro]);

        $response = $this->actingAs($user)->get(route('conversations.index'));

        $response->assertOk();
    });

    it('prevents Free user from viewing conversations list', function () {
        $user = User::factory()->create(['plan' => UserPlan::Free]);

        $response = $this->actingAs($user)->get(route('conversations.index'));

        $response->assertForbidden();
    });

    it('allows Pro user to view specific conversation', function () {
        $user = User::factory()->create(['plan' => UserPlan::Pro]);
        $other = User::factory()->create(['plan' => UserPlan::Pro]);

        $conversation = Conversation::create([
            'type' => ConversationType::Direct,
            'created_by' => $user->id,
        ]);
        $conversation->participantRecords()->createMany([
            ['user_id' => $user->id, 'role' => ParticipantRole::Owner, 'joined_at' => now()],
            ['user_id' => $other->id, 'role' => ParticipantRole::Member, 'joined_at' => now()],
        ]);

        $response = $this->actingAs($user)->get(route('conversations.show', $conversation));

        $response->assertOk();
    });

    it('prevents Free user from viewing specific conversation', function () {
        $proUser = User::factory()->create(['plan' => UserPlan::Pro]);
        $freeUser = User::factory()->create(['plan' => UserPlan::Free]);

        // Create conversation when user was Pro
        $conversation = Conversation::create([
            'type' => ConversationType::Direct,
            'created_by' => $proUser->id,
        ]);
        $conversation->participantRecords()->createMany([
            ['user_id' => $proUser->id, 'role' => ParticipantRole::Owner, 'joined_at' => now()],
            ['user_id' => $freeUser->id, 'role' => ParticipantRole::Member, 'joined_at' => now()],
        ]);

        $response = $this->actingAs($freeUser)->get(route('conversations.show', $conversation));

        $response->assertForbidden();
    });

    // === CREATING CONVERSATIONS ===

    it('allows Pro user to create direct conversation', function () {
        $user = User::factory()->create(['plan' => UserPlan::Pro]);
        $other = User::factory()->create();

        $response = $this->actingAs($user)->post(route('conversations.store'), [
            'type' => 'direct',
            'participant_ids' => [$other->id],
        ]);

        $response->assertRedirect();
        expect(Conversation::where('created_by', $user->id)->count())->toBe(1);
    });

    it('allows Pro user to create group conversation', function () {
        $user = User::factory()->create(['plan' => UserPlan::Pro]);
        $member1 = User::factory()->create();
        $member2 = User::factory()->create();

        $response = $this->actingAs($user)->post(route('conversations.store'), [
            'type' => 'group',
            'name' => 'Test Group',
            'participant_ids' => [$member1->id, $member2->id],
        ]);

        $response->assertRedirect();
        expect(Conversation::where('name', 'Test Group')->count())->toBe(1);
    });

    it('prevents Free user from creating conversation', function () {
        $user = User::factory()->create(['plan' => UserPlan::Free]);
        $other = User::factory()->create();

        $response = $this->actingAs($user)->post(route('conversations.store'), [
            'type' => 'direct',
            'participant_ids' => [$other->id],
        ]);

        $response->assertForbidden();
        expect(Conversation::where('created_by', $user->id)->count())->toBe(0);
    });

    it('returns proper error message when Free user tries to create conversation via JSON', function () {
        $user = User::factory()->create(['plan' => UserPlan::Free]);
        $other = User::factory()->create();

        $response = $this->actingAs($user)->postJson(route('conversations.store'), [
            'type' => 'direct',
            'participant_ids' => [$other->id],
        ]);

        $response->assertForbidden();
        $response->assertJson([
            'message' => 'Chat is a Pro feature. Upgrade to Pro to start conversations and message your team.',
        ]);
    });

    // === SENDING MESSAGES ===

    it('allows Pro user to send message', function () {
        $user = User::factory()->create(['plan' => UserPlan::Pro]);
        $other = User::factory()->create(['plan' => UserPlan::Pro]);

        $conversation = Conversation::create([
            'type' => ConversationType::Direct,
            'created_by' => $user->id,
        ]);
        $conversation->participantRecords()->createMany([
            ['user_id' => $user->id, 'role' => ParticipantRole::Owner, 'joined_at' => now()],
            ['user_id' => $other->id, 'role' => ParticipantRole::Member, 'joined_at' => now()],
        ]);

        $response = $this->actingAs($user)->post(
            route('conversations.messages.store', $conversation),
            ['content' => 'Hello!']
        );

        $response->assertRedirect();
        expect(Message::where('conversation_id', $conversation->id)->count())->toBe(1);
    });

    it('prevents Free user from sending message', function () {
        $proUser = User::factory()->create(['plan' => UserPlan::Pro]);
        $freeUser = User::factory()->create(['plan' => UserPlan::Free]);

        $conversation = Conversation::create([
            'type' => ConversationType::Direct,
            'created_by' => $proUser->id,
        ]);
        $conversation->participantRecords()->createMany([
            ['user_id' => $proUser->id, 'role' => ParticipantRole::Owner, 'joined_at' => now()],
            ['user_id' => $freeUser->id, 'role' => ParticipantRole::Member, 'joined_at' => now()],
        ]);

        $response = $this->actingAs($freeUser)->post(
            route('conversations.messages.store', $conversation),
            ['content' => 'Hello!']
        );

        $response->assertForbidden();
        expect(Message::where('conversation_id', $conversation->id)->count())->toBe(0);
    });

    // === DOWNGRADE SCENARIO ===

    it('blocks chat access for downgraded user but preserves existing data', function () {
        // User starts as Pro and creates conversation
        $user = User::factory()->create(['plan' => UserPlan::Pro]);
        $other = User::factory()->create(['plan' => UserPlan::Pro]);

        $conversation = Conversation::create([
            'type' => ConversationType::Direct,
            'created_by' => $user->id,
        ]);
        $conversation->participantRecords()->createMany([
            ['user_id' => $user->id, 'role' => ParticipantRole::Owner, 'joined_at' => now()],
            ['user_id' => $other->id, 'role' => ParticipantRole::Member, 'joined_at' => now()],
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $user->id,
            'content' => 'Hello from Pro!',
        ]);

        // Simulate downgrade
        $user->update(['plan' => UserPlan::Free]);

        // Data should still exist
        expect(Conversation::find($conversation->id))->not->toBeNull();
        expect(Message::where('conversation_id', $conversation->id)->count())->toBe(1);

        // But user cannot access
        $response = $this->actingAs($user->fresh())->get(route('conversations.index'));
        $response->assertForbidden();

        // Cannot send new messages
        $response = $this->actingAs($user->fresh())->post(
            route('conversations.messages.store', $conversation),
            ['content' => 'Trying to send as Free user']
        );
        $response->assertForbidden();
    });
});
