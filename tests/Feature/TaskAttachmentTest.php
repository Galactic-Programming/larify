<?php

use App\Enums\ProjectRole;
use App\Enums\UserPlan;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskAttachment;
use App\Models\TaskList;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');

    $this->owner = User::factory()->create(['plan' => UserPlan::Pro]);
    $this->member = User::factory()->create(['plan' => UserPlan::Pro]);
    $this->freeUser = User::factory()->create(['plan' => UserPlan::Free]);
    $this->outsider = User::factory()->create();

    $this->project = Project::factory()->create(['user_id' => $this->owner->id]);
    $this->project->members()->attach($this->member->id, [
        'role' => ProjectRole::Editor->value,
        'joined_at' => now(),
    ]);

    $this->list = TaskList::factory()->create(['project_id' => $this->project->id]);
    $this->task = Task::factory()->create([
        'project_id' => $this->project->id,
        'list_id' => $this->list->id,
        'created_by' => $this->owner->id,
    ]);

    // Create a test attachment
    $this->attachment = TaskAttachment::factory()
        ->for($this->task)
        ->create([
            'uploaded_by' => $this->owner->id,
            'disk' => 'public',
            'path' => 'task-attachments/test-file.jpg',
            'original_name' => 'test-image.jpg',
            'mime_type' => 'image/jpeg',
            'size' => 1024,
        ]);

    Storage::disk('public')->put('task-attachments/test-file.jpg', 'fake image content');
});

// === ATTACHMENT LIST ===

it('allows project owner to list task attachments', function () {
    $response = $this->actingAs($this->owner)
        ->getJson("/api/projects/{$this->project->id}/tasks/{$this->task->id}/attachments");

    $response->assertOk()
        ->assertJsonStructure([
            'attachments' => [
                '*' => [
                    'id',
                    'original_name',
                    'mime_type',
                    'size',
                    'human_size',
                    'type',
                    'url',
                    'download_url',
                    'uploaded_by',
                    'created_at',
                ],
            ],
        ]);
});

it('allows project member to list task attachments', function () {
    $response = $this->actingAs($this->member)
        ->getJson("/api/projects/{$this->project->id}/tasks/{$this->task->id}/attachments");

    $response->assertOk();
});

it('prevents outsider from listing task attachments', function () {
    $response = $this->actingAs($this->outsider)
        ->getJson("/api/projects/{$this->project->id}/tasks/{$this->task->id}/attachments");

    $response->assertForbidden();
});

// === ATTACHMENT UPLOAD ===

it('allows pro user to upload attachment', function () {
    $file = UploadedFile::fake()->image('photo.jpg', 800, 600);

    $response = $this->actingAs($this->owner)
        ->postJson("/projects/{$this->project->id}/tasks/{$this->task->id}/attachments", [
            'files' => [$file],
        ]);

    $response->assertCreated()
        ->assertJsonStructure([
            'attachments' => [
                '*' => ['id', 'original_name', 'mime_type', 'size'],
            ],
            'storage_used',
        ]);

    expect($this->task->fresh()->attachments()->count())->toBe(2);
});

it('allows pro member to upload attachment', function () {
    $file = UploadedFile::fake()->image('photo.png');

    $response = $this->actingAs($this->member)
        ->postJson("/projects/{$this->project->id}/tasks/{$this->task->id}/attachments", [
            'files' => [$file],
        ]);

    $response->assertCreated();
});

it('prevents free user from uploading attachment', function () {
    // Add free user as member
    $this->project->members()->attach($this->freeUser->id, [
        'role' => ProjectRole::Editor->value,
        'joined_at' => now(),
    ]);

    $file = UploadedFile::fake()->image('photo.jpg');

    $response = $this->actingAs($this->freeUser)
        ->postJson("/projects/{$this->project->id}/tasks/{$this->task->id}/attachments", [
            'files' => [$file],
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('files');
});

it('allows multiple file upload', function () {
    $files = [
        UploadedFile::fake()->image('photo1.jpg'),
        UploadedFile::fake()->image('photo2.png'),
        UploadedFile::fake()->image('photo3.gif'),
    ];

    $response = $this->actingAs($this->owner)
        ->postJson("/projects/{$this->project->id}/tasks/{$this->task->id}/attachments", [
            'files' => $files,
        ]);

    $response->assertCreated();
    expect($this->task->fresh()->attachments()->count())->toBe(4); // 1 existing + 3 new
});

it('validates maximum file size', function () {
    // Pro plan max is 25MB, create a file larger than that
    $file = UploadedFile::fake()->create('large-file.jpg', 30000); // 30MB

    $response = $this->actingAs($this->owner)
        ->postJson("/projects/{$this->project->id}/tasks/{$this->task->id}/attachments", [
            'files' => [$file],
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('files.0');
});

it('validates file type against plan', function () {
    // Free plan doesn't allow zip files
    $this->project->members()->attach($this->freeUser->id, [
        'role' => ProjectRole::Editor->value,
        'joined_at' => now(),
    ]);

    // First upgrade free user to pro temporarily to test allowed extensions
    $this->freeUser->update(['plan' => UserPlan::Pro]);

    $file = UploadedFile::fake()->create('archive.zip', 100);

    $response = $this->actingAs($this->freeUser)
        ->postJson("/projects/{$this->project->id}/tasks/{$this->task->id}/attachments", [
            'files' => [$file],
        ]);

    // Pro can upload zip
    $response->assertCreated();
});

it('validates storage limit', function () {
    // Set user storage close to limit (Pro = 1GB)
    $this->owner->forceFill(['storage_used' => 1024 * 1024 * 1024 - 1000])->save(); // Almost at limit

    $file = UploadedFile::fake()->create('large.jpg', 5000); // 5MB - exceeds remaining

    $response = $this->actingAs($this->owner)
        ->postJson("/projects/{$this->project->id}/tasks/{$this->task->id}/attachments", [
            'files' => [$file],
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('files');
});

it('updates user storage_used after upload', function () {
    $file = UploadedFile::fake()->image('photo.jpg', 100, 100);
    $fileSize = $file->getSize();

    $initialStorage = $this->owner->storage_used;

    $this->actingAs($this->owner)
        ->postJson("/projects/{$this->project->id}/tasks/{$this->task->id}/attachments", [
            'files' => [$file],
        ]);

    expect($this->owner->fresh()->storage_used)->toBe($initialStorage + $fileSize);
});

// === ATTACHMENT VIEW ===

it('allows project participant to view attachment', function () {
    $response = $this->actingAs($this->owner)
        ->get(route('task-attachments.show', $this->attachment));

    $response->assertOk()
        ->assertHeader('Content-Type', 'image/jpeg');
});

it('allows project member to view attachment', function () {
    $response = $this->actingAs($this->member)
        ->get(route('task-attachments.show', $this->attachment));

    $response->assertOk();
});

it('prevents outsider from viewing attachment', function () {
    $response = $this->actingAs($this->outsider)
        ->get(route('task-attachments.show', $this->attachment));

    $response->assertForbidden();
});

it('prevents unauthenticated user from viewing attachment', function () {
    $response = $this->get(route('task-attachments.show', $this->attachment));

    $response->assertRedirect(route('login'));
});

// === ATTACHMENT DOWNLOAD ===

it('allows participant to download attachment', function () {
    $response = $this->actingAs($this->owner)
        ->get(route('task-attachments.download', $this->attachment));

    $response->assertOk()
        ->assertHeader('Content-Disposition', 'attachment; filename=test-image.jpg');
});

it('prevents outsider from downloading attachment', function () {
    $response = $this->actingAs($this->outsider)
        ->get(route('task-attachments.download', $this->attachment));

    $response->assertForbidden();
});

// === ATTACHMENT DELETE ===

it('allows uploader to delete their attachment', function () {
    $attachmentId = $this->attachment->id;

    $response = $this->actingAs($this->owner)
        ->deleteJson("/projects/{$this->project->id}/tasks/{$this->task->id}/attachments/{$attachmentId}");

    $response->assertOk()
        ->assertJson(['message' => 'Attachment deleted']);

    expect(TaskAttachment::find($attachmentId))->toBeNull();
});

it('allows project owner to delete any attachment', function () {
    // Create attachment by member
    $memberAttachment = TaskAttachment::factory()
        ->for($this->task)
        ->create([
            'uploaded_by' => $this->member->id,
            'disk' => 'public',
            'path' => 'task-attachments/member-file.jpg',
        ]);

    Storage::disk('public')->put('task-attachments/member-file.jpg', 'content');

    $response = $this->actingAs($this->owner)
        ->deleteJson("/projects/{$this->project->id}/tasks/{$this->task->id}/attachments/{$memberAttachment->id}");

    $response->assertOk();
    expect(TaskAttachment::find($memberAttachment->id))->toBeNull();
});

it('prevents member from deleting others attachment', function () {
    // Attachment was created by owner, member shouldn't delete it
    $response = $this->actingAs($this->member)
        ->deleteJson("/projects/{$this->project->id}/tasks/{$this->task->id}/attachments/{$this->attachment->id}");

    $response->assertForbidden();
});

it('prevents outsider from deleting attachment', function () {
    $response = $this->actingAs($this->outsider)
        ->deleteJson("/projects/{$this->project->id}/tasks/{$this->task->id}/attachments/{$this->attachment->id}");

    $response->assertForbidden();
});

it('decrements storage_used when attachment is deleted', function () {
    $attachmentSize = $this->attachment->size;
    $this->owner->update(['storage_used' => $attachmentSize + 1000]);

    $initialStorage = $this->owner->storage_used;

    $this->actingAs($this->owner)
        ->deleteJson("/projects/{$this->project->id}/tasks/{$this->task->id}/attachments/{$this->attachment->id}");

    expect($this->owner->fresh()->storage_used)->toBe($initialStorage - $attachmentSize);
});

// === FILE NOT FOUND ===

it('returns 404 when attachment file does not exist', function () {
    Storage::disk('public')->delete('task-attachments/test-file.jpg');

    $response = $this->actingAs($this->owner)
        ->get(route('task-attachments.show', $this->attachment));

    $response->assertNotFound();
});

// === ATTACHMENT TYPE DETECTION ===

it('correctly identifies image attachments', function () {
    $imageAttachment = TaskAttachment::factory()
        ->image()
        ->for($this->task)
        ->create(['uploaded_by' => $this->owner->id]);

    expect($imageAttachment->isImage())->toBeTrue();
    expect($imageAttachment->type)->toBe('image');
});

it('correctly identifies document attachments', function () {
    $docAttachment = TaskAttachment::factory()
        ->pdf()
        ->for($this->task)
        ->create(['uploaded_by' => $this->owner->id]);

    expect($docAttachment->isDocument())->toBeTrue();
    expect($docAttachment->type)->toBe('document');
});

// === HUMAN-READABLE SIZE ===

it('formats file size correctly', function (int $bytes, string $expected) {
    $attachment = TaskAttachment::factory()
        ->for($this->task)
        ->create([
            'uploaded_by' => $this->owner->id,
            'size' => $bytes,
        ]);

    expect($attachment->human_size)->toBe($expected);
})->with([
    'bytes' => [500, '500 bytes'],
    'kilobytes' => [2048, '2.00 KB'],
    'megabytes' => [5242880, '5.00 MB'],
    'gigabytes' => [1073741824, '1.00 GB'],
]);

// === PLAN LIMITS ===

it('returns correct attachment limits for free plan', function () {
    $freePlan = UserPlan::Free;

    expect($freePlan->maxAttachmentSize())->toBe(5 * 1024 * 1024);
    expect($freePlan->maxAttachmentStorage())->toBe(50 * 1024 * 1024);
    expect($freePlan->canUploadAttachments())->toBeFalse();
    expect($freePlan->allowedAttachmentExtensions())->toContain('jpg', 'png', 'pdf');
    expect($freePlan->allowedAttachmentExtensions())->not->toContain('zip', 'xlsx');
});

it('returns correct attachment limits for pro plan', function () {
    $proPlan = UserPlan::Pro;

    expect($proPlan->maxAttachmentSize())->toBe(25 * 1024 * 1024);
    expect($proPlan->maxAttachmentStorage())->toBe(1024 * 1024 * 1024);
    expect($proPlan->canUploadAttachments())->toBeTrue();
    expect($proPlan->allowedAttachmentExtensions())->toContain('jpg', 'zip', 'xlsx', 'docx');
});
