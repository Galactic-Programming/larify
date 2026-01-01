<?php

use App\Enums\ProjectRole;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');

    $this->owner = User::factory()->create();
    $this->member = User::factory()->create();
    $this->outsider = User::factory()->create();

    $this->project = Project::factory()->create(['user_id' => $this->owner->id]);
    $this->project->members()->attach($this->member->id, [
        'role' => ProjectRole::Editor->value,
        'joined_at' => now(),
    ]);

    $this->conversation = $this->project->getOrCreateConversation();

    // Create a message with attachment for testing
    $this->message = Message::create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->owner->id,
        'content' => 'Test message with attachment',
    ]);

    $this->attachment = MessageAttachment::factory()
        ->for($this->message)
        ->create([
            'disk' => 'public',
            'path' => 'attachments/test-file.jpg',
            'original_name' => 'test-image.jpg',
            'mime_type' => 'image/jpeg',
        ]);

    // Create the fake file in storage
    Storage::disk('public')->put('attachments/test-file.jpg', 'fake image content');
});

// === ATTACHMENT ACCESS ===

it('allows conversation participant to view attachment', function () {
    $response = $this->actingAs($this->owner)
        ->get(route('attachments.show', $this->attachment));

    $response->assertOk();
    $response->assertHeader('Content-Type', 'image/jpeg');
});

it('allows other participant to view attachment', function () {
    $response = $this->actingAs($this->member)
        ->get(route('attachments.show', $this->attachment));

    $response->assertOk();
});

it('prevents non-participant from viewing attachment', function () {
    $response = $this->actingAs($this->outsider)
        ->get(route('attachments.show', $this->attachment));

    $response->assertForbidden();
});

it('prevents unauthenticated user from viewing attachment', function () {
    $response = $this->get(route('attachments.show', $this->attachment));

    $response->assertRedirect(route('login'));
});

// === ATTACHMENT DOWNLOAD ===

it('allows participant to download attachment', function () {
    $response = $this->actingAs($this->owner)
        ->get(route('attachments.download', $this->attachment));

    $response->assertOk();
    $response->assertHeader('Content-Disposition', 'attachment; filename=test-image.jpg');
});

it('prevents non-participant from downloading attachment', function () {
    $response = $this->actingAs($this->outsider)
        ->get(route('attachments.download', $this->attachment));

    $response->assertForbidden();
});

// === FILE NOT FOUND ===

it('returns 404 when attachment file does not exist', function () {
    // Delete the file from storage
    Storage::disk('public')->delete('attachments/test-file.jpg');

    $response = $this->actingAs($this->owner)
        ->get(route('attachments.show', $this->attachment));

    $response->assertNotFound();
});

// === UPLOADING ATTACHMENTS ===

it('allows participant to upload image attachment', function () {
    $file = UploadedFile::fake()->image('photo.jpg', 800, 600);

    $response = $this->actingAs($this->owner)->post(
        route('conversations.messages.store', $this->conversation),
        [
            'content' => 'Message with image',
            'attachments' => [$file],
        ]
    );

    $response->assertRedirect();

    // Check attachment was created
    $message = Message::where('content', 'Message with image')->first();
    expect($message)->not->toBeNull();
    expect($message->attachments)->toHaveCount(1);
    expect($message->attachments->first()->mime_type)->toBe('image/jpeg');
});

it('allows participant to upload multiple attachments', function () {
    // Use only images because fake PDF won't pass actual MIME content validation
    $files = [
        UploadedFile::fake()->image('photo1.jpg'),
        UploadedFile::fake()->image('photo2.png'),
        UploadedFile::fake()->image('photo3.gif'),
    ];

    $response = $this->actingAs($this->owner)->post(
        route('conversations.messages.store', $this->conversation),
        [
            'content' => 'Multiple attachments',
            'attachments' => $files,
        ]
    );

    $response->assertRedirect();

    $message = Message::where('content', 'Multiple attachments')->first();
    expect($message)->not->toBeNull();
    expect($message->attachments)->toHaveCount(3);
});

it('validates maximum file size', function () {
    // Create a file larger than the limit (10MB)
    $file = UploadedFile::fake()->create('large-file.jpg', 15000); // 15MB

    $response = $this->actingAs($this->owner)->post(
        route('conversations.messages.store', $this->conversation),
        [
            'content' => 'Large file',
            'attachments' => [$file],
        ]
    );

    $response->assertSessionHasErrors('attachments.0');
});

it('validates maximum number of attachments', function () {
    $files = [];
    for ($i = 0; $i < 12; $i++) {
        $files[] = UploadedFile::fake()->image("photo{$i}.jpg");
    }

    $response = $this->actingAs($this->owner)->post(
        route('conversations.messages.store', $this->conversation),
        [
            'content' => 'Too many files',
            'attachments' => $files,
        ]
    );

    $response->assertSessionHasErrors('attachments');
});

// === MESSAGE ATTACHMENT RELATIONSHIPS ===

it('soft deleted messages keep attachments', function () {
    // Note: Messages use soft delete, so attachments are preserved
    // This allows recovery of messages with their attachments
    $message = Message::create([
        'conversation_id' => $this->conversation->id,
        'sender_id' => $this->owner->id,
        'content' => 'To soft delete',
    ]);

    $attachment = MessageAttachment::factory()
        ->for($message)
        ->create([
            'disk' => 'public',
            'path' => 'attachments/soft-delete-test.jpg',
        ]);

    Storage::disk('public')->put('attachments/soft-delete-test.jpg', 'content');

    $attachmentId = $attachment->id;
    $message->delete(); // Soft delete

    // Attachment should still exist since message is only soft deleted
    expect(MessageAttachment::find($attachmentId))->not->toBeNull();
    expect($message->trashed())->toBeTrue();
});

// === ATTACHMENT TYPE DETECTION ===

it('correctly identifies image attachments', function () {
    $imageAttachment = MessageAttachment::factory()
        ->image()
        ->for($this->message)
        ->create();

    expect($imageAttachment->isImage())->toBeTrue();
    expect($imageAttachment->type)->toBe('image');
});

it('correctly identifies document attachments', function () {
    $docAttachment = MessageAttachment::factory()
        ->pdf()
        ->for($this->message)
        ->create();

    expect($docAttachment->isDocument())->toBeTrue();
    expect($docAttachment->type)->toBe('document');
});

// === HUMAN-READABLE SIZE ===

it('formats file size correctly', function (int $bytes, string $expected) {
    $attachment = MessageAttachment::factory()
        ->for($this->message)
        ->create(['size' => $bytes]);

    expect($attachment->human_size)->toBe($expected);
})->with([
    'bytes' => [500, '500 bytes'],
    'kilobytes' => [2048, '2.00 KB'],
    'megabytes' => [5242880, '5.00 MB'],
    'gigabytes' => [1073741824, '1.00 GB'],
]);
