<?php

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('parses mentioned user from message content', function () {
    $sender = User::factory()->create(['name' => 'John Doe']);
    $mentionedUser = User::factory()->create(['name' => 'Jane Smith']);

    $conversation = Conversation::factory()->create();
    $conversation->participants()->attach([$sender->id, $mentionedUser->id]);

    $message = Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $sender->id,
        'content' => 'Hello @Jane Smith, check this out!',
    ]);

    $participantIds = [$sender->id, $mentionedUser->id];
    $mentions = $message->parseMentions($participantIds);

    expect($mentions)->toContain($mentionedUser->id);
});

it('does not allow sender to mention themselves', function () {
    $sender = User::factory()->create(['name' => 'John Doe']);
    $otherUser = User::factory()->create(['name' => 'Jane Smith']);

    $conversation = Conversation::factory()->create();
    $conversation->participants()->attach([$sender->id, $otherUser->id]);

    $message = Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $sender->id,
        'content' => 'Hey @John Doe and @Jane Smith, look at this!',
    ]);

    $participantIds = [$sender->id, $otherUser->id];
    $mentions = $message->parseMentions($participantIds);

    // Should NOT contain sender's ID (self-mention not allowed)
    expect($mentions)->not->toContain($sender->id);
    // Should contain the other user's ID
    expect($mentions)->toContain($otherUser->id);
});

it('syncs mentions excluding sender', function () {
    $sender = User::factory()->create(['name' => 'John Doe', 'email' => 'john@example.com']);
    $user1 = User::factory()->create(['name' => 'Jane Smith']);
    $user2 = User::factory()->create(['name' => 'Bob Wilson']);

    $conversation = Conversation::factory()->create();
    $conversation->participants()->attach([$sender->id, $user1->id, $user2->id]);

    $message = Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $sender->id,
        'content' => '@John Doe @Jane Smith @Bob Wilson - team meeting!',
    ]);

    $participantIds = [$sender->id, $user1->id, $user2->id];
    $message->syncMentions($participantIds);

    // Reload mentions
    $mentionedUserIds = $message->mentions()->pluck('user_id')->toArray();

    // Should have 2 mentions (Jane and Bob, not John who is the sender)
    expect($mentionedUserIds)->toHaveCount(2);
    expect($mentionedUserIds)->not->toContain($sender->id);
    expect($mentionedUserIds)->toContain($user1->id);
    expect($mentionedUserIds)->toContain($user2->id);
});

it('parses mention by email', function () {
    $sender = User::factory()->create(['email' => 'sender@example.com']);
    $mentionedUser = User::factory()->create(['email' => 'jane@example.com']);

    $conversation = Conversation::factory()->create();
    $conversation->participants()->attach([$sender->id, $mentionedUser->id]);

    $message = Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $sender->id,
        'content' => 'Hey @jane@example.com, check this!',
    ]);

    $participantIds = [$sender->id, $mentionedUser->id];
    $mentions = $message->parseMentions($participantIds);

    expect($mentions)->toContain($mentionedUser->id);
});

it('does not parse self mention by email', function () {
    $sender = User::factory()->create(['email' => 'john@example.com']);
    $otherUser = User::factory()->create(['email' => 'jane@example.com']);

    $conversation = Conversation::factory()->create();
    $conversation->participants()->attach([$sender->id, $otherUser->id]);

    $message = Message::factory()->create([
        'conversation_id' => $conversation->id,
        'sender_id' => $sender->id,
        'content' => '@john@example.com @jane@example.com look!',
    ]);

    $participantIds = [$sender->id, $otherUser->id];
    $mentions = $message->parseMentions($participantIds);

    expect($mentions)->not->toContain($sender->id);
    expect($mentions)->toContain($otherUser->id);
});
