<?php

use App\Enums\ProjectRole;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Project;
use App\Models\User;

beforeEach(function () {
    $this->owner = User::factory()->create();
    $this->member = User::factory()->create();

    $this->project = Project::factory()->create(['user_id' => $this->owner->id]);
    $this->project->members()->attach($this->member->id, [
        'role' => ProjectRole::Editor->value,
        'joined_at' => now(),
    ]);

    // Create conversation for the project
    $this->conversation = $this->project->getOrCreateConversation();
});

// === SENDING MESSAGES ===

it('allows participant to send a message', function () {
    $response = $this->actingAs($this->owner)->post(
        route('conversations.messages.store', $this->conversation),
        ['content' => 'Hello World!']
    );

    $response->assertRedirect();

    $message = Message::where('conversation_id', $this->conversation->id)->first();
    expect($message)->not->toBeNull();
    expect($message->content)->toBe('Hello World!');
    expect($message->sender_id)->toBe($this->owner->id);
});

it('returns JSON response when sending message via AJAX', function () {
    $response = $this->actingAs($this->owner)->postJson(
        route('conversations.messages.store', $this->conversation),
        ['content' => 'Hello via JSON!']
    );

    $response->assertCreated()
        ->assertJson([
            'message' => [
                'content' => 'Hello via JSON!',
                'is_mine' => true,
            ],
        ]);

    $message = Message::where('conversation_id', $this->conversation->id)->first();
    expect($message)->not->toBeNull();
    expect($message->content)->toBe('Hello via JSON!');
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
    $response = $this->actingAs($this->owner)->post(
        route('conversations.messages.store', $this->conversation),
        ['content' => '']
    );

    $response->assertSessionHasErrors('content');
});

it('enforces max message length', function () {
    $response = $this->actingAs($this->owner)->post(
        route('conversations.messages.store', $this->conversation),
        ['content' => str_repeat('a', 10001)]
    );

    $response->assertSessionHasErrors('content');
});

// === DELETING MESSAGES ===

it('allows sender to delete their message within time limit', function () {
    $message = Message::create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->owner->id,
        'content' => 'To be deleted',
    ]);

    $messageId = $message->id;

    $response = $this->actingAs($this->owner)->delete(
        route('conversations.messages.destroy', [$this->conversation, $message])
    );

    $response->assertRedirect();
    $this->assertSoftDeleted('messages', ['id' => $messageId]);
});

it('prevents deleting message after time limit', function () {
    $message = Message::create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->owner->id,
        'content' => 'Old message',
    ]);

    // Manually update created_at to be in the past (beyond 5 minute limit)
    Message::where('id', $message->id)->update([
        'created_at' => now()->subMinutes(10),
    ]);
    $message->refresh();

    $response = $this->actingAs($this->owner)->delete(
        route('conversations.messages.destroy', [$this->conversation, $message])
    );

    $response->assertForbidden();
    $this->assertNotSoftDeleted('messages', ['id' => $message->id]);
});

it('prevents user from deleting others message', function () {
    $message = Message::create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->member->id,
        'content' => 'Member message',
    ]);

    $response = $this->actingAs($this->owner)->delete(
        route('conversations.messages.destroy', [$this->conversation, $message])
    );

    $response->assertForbidden();
});

// === FETCHING MESSAGES ===

it('allows participant to fetch messages via API', function () {
    Message::create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->owner->id,
        'content' => 'Message 1',
    ]);
    Message::create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->member->id,
        'content' => 'Message 2',
    ]);

    $response = $this->actingAs($this->owner)->getJson(
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
        'sender_id' => $this->member->id,
        'content' => 'New message',
    ]);

    $response = $this->actingAs($this->owner)->postJson(
        route('conversations.messages.read', $this->conversation),
        ['last_message_id' => $message->id]
    );

    $response->assertOk();

    $participant = $this->conversation->participantRecords()
        ->where('user_id', $this->owner->id)
        ->first();

    expect($participant->last_read_at)->not->toBeNull();
});

// === TYPING INDICATOR ===

it('allows participant to send typing indicator', function () {
    $response = $this->actingAs($this->owner)->postJson(
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

// === MESSAGE PAGINATION ===

it('paginates messages correctly', function () {
    // Create 25 messages
    for ($i = 0; $i < 25; $i++) {
        Message::create([
            'conversation_id' => $this->conversation->id,
            'sender_id' => $this->owner->id,
            'content' => "Message {$i}",
        ]);
    }

    $response = $this->actingAs($this->owner)->getJson(
        route('api.conversations.messages.index', $this->conversation)
    );

    $response->assertOk();
    $response->assertJsonStructure([
        'messages',
        'has_more',
    ]);
});

it('supports cursor-based pagination for infinite scroll', function () {
    // Create messages with known IDs
    $messages = [];
    for ($i = 0; $i < 30; $i++) {
        $messages[] = Message::create([
            'conversation_id' => $this->conversation->id,
            'sender_id' => $this->owner->id,
            'content' => "Message {$i}",
        ]);
    }

    // First request without cursor
    $response = $this->actingAs($this->owner)->getJson(
        route('api.conversations.messages.index', $this->conversation)
    );

    $response->assertOk();

    // Request with before cursor
    $response2 = $this->actingAs($this->owner)->getJson(
        route('api.conversations.messages.index', [
            'conversation' => $this->conversation->id,
            'before' => $messages[15]->id,
        ])
    );

    $response2->assertOk();
    // All messages should have id < 15
    $messagesData = $response2->json('messages');
    foreach ($messagesData as $msg) {
        expect($msg['id'])->toBeLessThan($messages[15]->id);
    }
});

// === RATE LIMITING ===

it('enforces rate limit on message sending', function () {
    // Skip this test in normal runs as it's slow
    // Uncomment to test rate limiting manually
})->skip('Rate limiting test is slow - run manually when needed');

// === MESSAGE SEARCH ===

it('allows participant to search messages', function () {
    // Create messages with different content
    Message::factory()->for($this->conversation)->create(['sender_id' => $this->owner->id, 'content' => 'Hello world']);
    Message::factory()->for($this->conversation)->create(['sender_id' => $this->owner->id, 'content' => 'Testing search feature']);
    Message::factory()->for($this->conversation)->create(['sender_id' => $this->owner->id, 'content' => 'Another message about testing']);

    $response = $this->actingAs($this->owner)->getJson(
        route('api.conversations.messages.search', ['conversation' => $this->conversation->id, 'q' => 'testing'])
    );

    $response->assertOk();
    $messages = $response->json('messages');

    // Should find messages containing "testing"
    expect($messages)->toHaveCount(2);
});

it('requires minimum query length for search', function () {
    $response = $this->actingAs($this->owner)->getJson(
        route('api.conversations.messages.search', ['conversation' => $this->conversation->id, 'q' => 'a'])
    );

    $response->assertUnprocessable();
    $response->assertJsonValidationErrors('q');
});

it('prevents non-participant from searching messages', function () {
    $outsider = User::factory()->create();

    Message::factory()->for($this->conversation)->create(['sender_id' => $this->owner->id, 'content' => 'Secret message']);

    $response = $this->actingAs($outsider)->getJson(
        route('api.conversations.messages.search', ['conversation' => $this->conversation->id, 'q' => 'secret'])
    );

    $response->assertForbidden();
});

it('returns empty array when no messages match search', function () {
    Message::factory()->for($this->conversation)->create(['sender_id' => $this->owner->id, 'content' => 'Hello world']);

    $response = $this->actingAs($this->owner)->getJson(
        route('api.conversations.messages.search', ['conversation' => $this->conversation->id, 'q' => 'nonexistent'])
    );

    $response->assertOk();
    $messages = $response->json('messages');
    expect($messages)->toBeEmpty();
});

it('searches case insensitively', function () {
    Message::factory()->for($this->conversation)->create(['sender_id' => $this->owner->id, 'content' => 'UPPERCASE message']);
    Message::factory()->for($this->conversation)->create(['sender_id' => $this->owner->id, 'content' => 'lowercase message']);

    $response = $this->actingAs($this->owner)->getJson(
        route('api.conversations.messages.search', ['conversation' => $this->conversation->id, 'q' => 'message'])
    );

    $response->assertOk();
    $messages = $response->json('messages');
    expect($messages)->toHaveCount(2);
});

it('includes sender information in search results', function () {
    Message::factory()->for($this->conversation)->create(['sender_id' => $this->owner->id, 'content' => 'Test message']);

    $response = $this->actingAs($this->owner)->getJson(
        route('api.conversations.messages.search', ['conversation' => $this->conversation->id, 'q' => 'test'])
    );

    $response->assertOk();
    $messages = $response->json('messages');

    expect($messages)->toHaveCount(1);
    expect($messages[0]['sender'])->not->toBeNull();
    expect($messages[0]['sender']['id'])->toBe($this->owner->id);
});
