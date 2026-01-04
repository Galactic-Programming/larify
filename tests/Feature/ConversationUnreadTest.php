<?php

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->owner = User::factory()->create();
    $this->member = User::factory()->create();
    $this->project = Project::factory()->create(['user_id' => $this->owner->id]);
    $this->project->members()->attach($this->member->id, ['role' => 'editor']);

    // Create conversation for the project
    $this->conversation = Conversation::create([
        'project_id' => $this->project->id,
    ]);
    $this->conversation->participants()->attach([
        $this->owner->id,
        $this->member->id,
    ]);
});

it('returns empty conversations when no unread messages', function () {
    $response = $this->actingAs($this->owner)
        ->getJson(route('api.conversations.unread'));

    $response->assertOk()
        ->assertJson([
            'conversations' => [],
            'total_unread' => 0,
        ]);
});

it('returns conversations with unread messages', function () {
    // Create a message from member (unread by owner)
    Message::factory()->create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->member->id,
        'content' => 'Hello from member!',
    ]);

    $response = $this->actingAs($this->owner)
        ->getJson(route('api.conversations.unread'));

    $response->assertOk()
        ->assertJsonCount(1, 'conversations')
        ->assertJsonPath('total_unread', 1)
        ->assertJsonPath('conversations.0.id', $this->conversation->id)
        ->assertJsonPath('conversations.0.unread_count', 1);
});

it('does not count own messages as unread', function () {
    // Create a message from owner (should not be counted as unread for owner)
    Message::factory()->create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->owner->id,
        'content' => 'My own message',
    ]);

    $response = $this->actingAs($this->owner)
        ->getJson(route('api.conversations.unread'));

    $response->assertOk()
        ->assertJson([
            'conversations' => [],
            'total_unread' => 0,
        ]);
});

it('counts multiple unread messages correctly', function () {
    // Create 3 messages from member
    Message::factory()->count(3)->create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->member->id,
    ]);

    $response = $this->actingAs($this->owner)
        ->getJson(route('api.conversations.unread'));

    $response->assertOk()
        ->assertJsonPath('total_unread', 3)
        ->assertJsonPath('conversations.0.unread_count', 3);
});

it('marks messages as read after viewing conversation', function () {
    // Create unread message
    Message::factory()->create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->member->id,
    ]);

    // Verify unread count is 1
    $response = $this->actingAs($this->owner)
        ->getJson(route('api.conversations.unread'));
    $response->assertJsonPath('total_unread', 1);

    // Visit the conversation (marks as read)
    $this->actingAs($this->owner)
        ->get(route('conversations.show', $this->conversation));

    // Verify unread count is now 0
    $response = $this->actingAs($this->owner)
        ->getJson(route('api.conversations.unread'));
    $response->assertJsonPath('total_unread', 0);
});

it('includes last message info in response', function () {
    $message = Message::factory()->create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->member->id,
        'content' => 'Test message content',
    ]);

    $response = $this->actingAs($this->owner)
        ->getJson(route('api.conversations.unread'));

    $response->assertOk()
        ->assertJsonPath('conversations.0.last_message.content', 'Test message content')
        ->assertJsonPath('conversations.0.last_message.sender_name', $this->member->name);
});

it('limits to 10 conversations', function () {
    // Create 12 projects with conversations and unread messages
    for ($i = 0; $i < 12; $i++) {
        $project = Project::factory()->create(['user_id' => $this->owner->id]);
        $project->members()->attach($this->member->id, ['role' => 'editor']);

        $conversation = Conversation::create(['project_id' => $project->id]);
        $conversation->participants()->attach([$this->owner->id, $this->member->id]);

        Message::factory()->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $this->member->id,
        ]);
    }

    $response = $this->actingAs($this->owner)
        ->getJson(route('api.conversations.unread'));

    $response->assertOk()
        ->assertJsonCount(10, 'conversations')
        ->assertJsonPath('total_unread', 12);
});

it('requires authentication', function () {
    $response = $this->getJson(route('api.conversations.unread'));

    $response->assertUnauthorized();
});
