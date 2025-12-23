<?php

use App\Enums\ConversationType;
use App\Enums\ParticipantRole;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;

beforeEach(function () {
    $this->user1 = User::factory()->create();
    $this->user2 = User::factory()->create();

    $this->conversation = Conversation::create([
        'type' => ConversationType::Direct,
        'created_by' => $this->user1->id,
    ]);
    $this->conversation->participantRecords()->createMany([
        ['user_id' => $this->user1->id, 'role' => ParticipantRole::Owner, 'joined_at' => now()],
        ['user_id' => $this->user2->id, 'role' => ParticipantRole::Member, 'joined_at' => now()],
    ]);
});

// === SENDING MESSAGES ===

it('allows participant to send a message', function () {
    $response = $this->actingAs($this->user1)->post(
        route('conversations.messages.store', $this->conversation),
        ['content' => 'Hello World!']
    );

    $response->assertRedirect();

    $message = Message::where('conversation_id', $this->conversation->id)->first();
    expect($message)->not->toBeNull();
    expect($message->content)->toBe('Hello World!');
    expect($message->sender_id)->toBe($this->user1->id);
});

it('prevents non-participant from sending message', function () {
    $outsider = User::factory()->create();

    $response = $this->actingAs($outsider)->post(
        route('conversations.messages.store', $this->conversation),
        ['content' => 'Hacking attempt!']
    );

    $response->assertForbidden();
    expect(Message::where('conversation_id', $this->conversation->id)->count())->toBe(0);
});

it('requires content or attachments for message', function () {
    $response = $this->actingAs($this->user1)->post(
        route('conversations.messages.store', $this->conversation),
        ['content' => '']
    );

    $response->assertSessionHasErrors('content');
});

it('enforces max message length', function () {
    $response = $this->actingAs($this->user1)->post(
        route('conversations.messages.store', $this->conversation),
        ['content' => str_repeat('a', 10001)]
    );

    $response->assertSessionHasErrors('content');
});

// === REPLY TO MESSAGE ===

it('allows replying to a message', function () {
    $originalMessage = Message::create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->user2->id,
        'content' => 'Original message',
    ]);

    $response = $this->actingAs($this->user1)->post(
        route('conversations.messages.store', $this->conversation),
        [
            'content' => 'This is a reply',
            'parent_id' => $originalMessage->id,
        ]
    );

    $response->assertRedirect();

    $reply = Message::where('parent_id', $originalMessage->id)->first();
    expect($reply)->not->toBeNull();
    expect($reply->content)->toBe('This is a reply');
});

it('prevents replying to message from different conversation', function () {
    $otherUser = User::factory()->create();
    $otherConversation = Conversation::create([
        'type' => ConversationType::Direct,
        'created_by' => $otherUser->id,
    ]);
    $otherConversation->participantRecords()->create([
        'user_id' => $otherUser->id,
        'role' => ParticipantRole::Owner,
        'joined_at' => now(),
    ]);

    $otherMessage = Message::create([
        'conversation_id' => $otherConversation->id,
        'sender_id' => $otherUser->id,
        'content' => 'Message in other conversation',
    ]);

    $response = $this->actingAs($this->user1)->post(
        route('conversations.messages.store', $this->conversation),
        [
            'content' => 'Trying to reply to wrong conversation',
            'parent_id' => $otherMessage->id,
        ]
    );

    $response->assertSessionHasErrors('parent_id');
});

// === EDITING MESSAGES ===

it('allows sender to edit their message within time limit', function () {
    $message = Message::create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->user1->id,
        'content' => 'Original content',
        'created_at' => now(), // Within time limit
    ]);

    $response = $this->actingAs($this->user1)->patch(
        route('conversations.messages.update', [$this->conversation, $message]),
        ['content' => 'Edited content']
    );

    $response->assertRedirect();

    $message->refresh();
    expect($message->content)->toBe('Edited content');
    expect($message->is_edited)->toBeTrue();
    expect($message->edited_at)->not->toBeNull();
});

it('prevents editing message after time limit', function () {
    // Create a message that's older than the edit limit
    $message = Message::factory()->create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->user1->id,
        'content' => 'Original content',
    ]);

    // Manually update created_at to be in the past (beyond 15 minute limit)
    Message::where('id', $message->id)->update([
        'created_at' => now()->subMinutes(20),
    ]);

    $response = $this->actingAs($this->user1)->patch(
        route('conversations.messages.update', [$this->conversation, $message]),
        ['content' => 'Too late edit']
    );

    // Form Request authorization failure returns 403
    $response->assertForbidden();

    $message->refresh();
    expect($message->content)->toBe('Original content');
});

it('prevents user from editing others message', function () {
    $message = Message::create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->user2->id,
        'content' => 'User 2 message',
    ]);

    $response = $this->actingAs($this->user1)->patch(
        route('conversations.messages.update', [$this->conversation, $message]),
        ['content' => 'Hacked content']
    );

    $response->assertForbidden();

    $message->refresh();
    expect($message->content)->toBe('User 2 message');
});

// === DELETING MESSAGES ===

it('allows sender to delete their message', function () {
    $message = Message::create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->user1->id,
        'content' => 'To be deleted',
    ]);

    $messageId = $message->id;

    $response = $this->actingAs($this->user1)->delete(
        route('conversations.messages.destroy', [$this->conversation, $message])
    );

    $response->assertRedirect();
    $this->assertSoftDeleted('messages', ['id' => $messageId]);
});

it('prevents user from deleting others message in direct conversation', function () {
    $message = Message::create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->user2->id,
        'content' => 'User 2 message',
    ]);

    $response = $this->actingAs($this->user1)->delete(
        route('conversations.messages.destroy', [$this->conversation, $message])
    );

    $response->assertForbidden();
});

it('allows group owner to delete any message', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();

    $groupConversation = Conversation::create([
        'type' => ConversationType::Group,
        'name' => 'Test Group',
        'created_by' => $owner->id,
    ]);
    $groupConversation->participantRecords()->createMany([
        ['user_id' => $owner->id, 'role' => ParticipantRole::Owner, 'joined_at' => now()],
        ['user_id' => $member->id, 'role' => ParticipantRole::Member, 'joined_at' => now()],
    ]);

    $message = Message::create([
        'conversation_id' => $groupConversation->id,
        'sender_id' => $member->id,
        'content' => 'Member message',
    ]);

    $messageId = $message->id;

    $response = $this->actingAs($owner)->delete(
        route('conversations.messages.destroy', [$groupConversation, $message])
    );

    $response->assertRedirect();
    $this->assertSoftDeleted('messages', ['id' => $messageId]);
});

// === FETCHING MESSAGES ===

it('allows participant to fetch messages via API', function () {
    // Create some messages
    Message::create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->user1->id,
        'content' => 'Message 1',
    ]);
    Message::create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->user2->id,
        'content' => 'Message 2',
    ]);

    $response = $this->actingAs($this->user1)->getJson(
        route('api.conversations.messages.index', $this->conversation)
    );

    $response->assertOk();
    $response->assertJsonCount(2, 'messages');
});

it('prevents non-participant from fetching messages', function () {
    $outsider = User::factory()->create();

    $response = $this->actingAs($outsider)->getJson(
        route('api.conversations.messages.index', $this->conversation)
    );

    $response->assertForbidden();
});

// === READ RECEIPTS ===

it('allows participant to mark messages as read', function () {
    $message = Message::create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->user2->id,
        'content' => 'New message',
    ]);

    $response = $this->actingAs($this->user1)->postJson(
        route('conversations.messages.read', $this->conversation),
        ['last_message_id' => $message->id]
    );

    $response->assertOk();

    $participant = $this->conversation->participantRecords()
        ->where('user_id', $this->user1->id)
        ->first();

    expect($participant->last_read_at)->not->toBeNull();
});

// === TYPING INDICATOR ===

it('allows participant to send typing indicator', function () {
    $response = $this->actingAs($this->user1)->postJson(
        route('conversations.typing', $this->conversation),
        ['is_typing' => true]
    );

    $response->assertOk();
    $response->assertJson(['success' => true]);
});

it('prevents non-participant from sending typing indicator', function () {
    $outsider = User::factory()->create();

    $response = $this->actingAs($outsider)->postJson(
        route('conversations.typing', $this->conversation),
        ['is_typing' => true]
    );

    $response->assertForbidden();
});
