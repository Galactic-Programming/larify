<?php

use App\Enums\ProjectRole;
use App\Enums\UserPlan;
use App\Events\TaskCommentCreated;
use App\Events\TaskCommentDeleted;
use App\Events\TaskCommentUpdated;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\TaskCommentReaction;
use App\Models\TaskList;
use App\Models\User;
use Illuminate\Support\Facades\Event;

beforeEach(function () {
    $this->proUser = User::factory()->create(['plan' => UserPlan::Pro]);
    $this->freeUser = User::factory()->create(['plan' => UserPlan::Free]);
    $this->proProject = Project::factory()->create(['user_id' => $this->proUser->id]);
    $this->freeProject = Project::factory()->create(['user_id' => $this->freeUser->id]);

    // Create task lists and tasks
    $this->proList = TaskList::factory()->create(['project_id' => $this->proProject->id]);
    $this->proTask = Task::factory()->create([
        'project_id' => $this->proProject->id,
        'list_id' => $this->proList->id,
    ]);

    $this->freeList = TaskList::factory()->create(['project_id' => $this->freeProject->id]);
    $this->freeTask = Task::factory()->create([
        'project_id' => $this->freeProject->id,
        'list_id' => $this->freeList->id,
    ]);
});

describe('Comment Listing', function () {
    it('can list comments for a task', function () {
        TaskComment::factory()->count(3)->create([
            'task_id' => $this->proTask->id,
            'user_id' => $this->proUser->id,
        ]);

        $this->actingAs($this->proUser)
            ->getJson("/api/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments")
            ->assertOk()
            ->assertJsonCount(3, 'comments')
            ->assertJsonStructure([
                'comments' => [
                    '*' => [
                        'id',
                        'task_id',
                        'content',
                        'is_edited',
                        'created_at',
                        'user' => ['id', 'name', 'avatar'],
                        'is_mine',
                        'can_edit',
                        'can_delete',
                        'reactions',
                    ],
                ],
                'has_more',
                'permissions' => ['can_create', 'can_use_reactions'],
            ]);
    });

    it('returns correct permissions for pro users', function () {
        $this->actingAs($this->proUser)
            ->getJson("/api/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments")
            ->assertOk()
            ->assertJsonPath('permissions.can_create', true)
            ->assertJsonPath('permissions.can_use_reactions', true);
    });

    it('returns correct permissions for free users', function () {
        $this->actingAs($this->freeUser)
            ->getJson("/api/projects/{$this->freeProject->id}/tasks/{$this->freeTask->id}/comments")
            ->assertOk()
            ->assertJsonPath('permissions.can_create', false)
            ->assertJsonPath('permissions.can_use_reactions', false);
    });

    it('paginates comments correctly', function () {
        TaskComment::factory()->count(60)->create([
            'task_id' => $this->proTask->id,
            'user_id' => $this->proUser->id,
        ]);

        $response = $this->actingAs($this->proUser)
            ->getJson("/api/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments?limit=50")
            ->assertOk()
            ->assertJsonPath('has_more', true);

        expect($response->json('comments'))->toHaveCount(50);
    });

    it('prevents non-members from viewing comments', function () {
        $outsider = User::factory()->create();

        $this->actingAs($outsider)
            ->getJson("/api/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments")
            ->assertForbidden();
    });
});

describe('Comment Creation (Pro Plan)', function () {
    it('allows pro users to create comments', function () {
        Event::fake([TaskCommentCreated::class]);

        $this->actingAs($this->proUser)
            ->postJson("/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments", [
                'content' => 'This is a test comment',
            ])
            ->assertCreated()
            ->assertJsonPath('comment.content', 'This is a test comment')
            ->assertJsonPath('comment.is_mine', true);

        expect($this->proTask->comments()->count())->toBe(1);
        Event::assertDispatched(TaskCommentCreated::class);
    });

    it('validates comment content is required', function () {
        $this->actingAs($this->proUser)
            ->postJson("/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments", [
                'content' => '',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['content']);
    });

    it('validates comment content max length', function () {
        $this->actingAs($this->proUser)
            ->postJson("/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments", [
                'content' => str_repeat('a', 10001),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['content']);
    });
});

describe('Comment Creation (Free Plan Restriction)', function () {
    it('prevents free users from creating comments', function () {
        $this->actingAs($this->freeUser)
            ->postJson("/projects/{$this->freeProject->id}/tasks/{$this->freeTask->id}/comments", [
                'content' => 'Free user trying to comment',
            ])
            ->assertForbidden();

        expect($this->freeTask->allComments()->count())->toBe(0);
    });

    it('allows free users to view comments created by others', function () {
        // Add free user as member to pro project
        $this->proProject->members()->attach($this->freeUser->id, [
            'role' => ProjectRole::Viewer->value,
            'joined_at' => now(),
        ]);

        // Pro user creates comment
        TaskComment::factory()->create([
            'task_id' => $this->proTask->id,
            'user_id' => $this->proUser->id,
            'content' => 'Comment from pro user',
        ]);

        // Free user can view
        $this->actingAs($this->freeUser)
            ->getJson("/api/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments")
            ->assertOk()
            ->assertJsonCount(1, 'comments');
    });
});

describe('Comment Update', function () {
    it('allows comment owner to edit within time limit', function () {
        Event::fake([TaskCommentUpdated::class]);

        $comment = TaskComment::factory()->create([
            'task_id' => $this->proTask->id,
            'user_id' => $this->proUser->id,
            'content' => 'Original content',
        ]);

        $this->actingAs($this->proUser)
            ->patchJson("/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments/{$comment->id}", [
                'content' => 'Updated content',
            ])
            ->assertOk()
            ->assertJsonPath('comment.content', 'Updated content')
            ->assertJsonPath('comment.is_edited', true);

        Event::assertDispatched(TaskCommentUpdated::class);
    });

    it('prevents editing after time limit', function () {
        $comment = TaskComment::factory()->create([
            'task_id' => $this->proTask->id,
            'user_id' => $this->proUser->id,
        ]);

        // Manually update created_at using DB query to bypass Eloquent
        \DB::table('task_comments')
            ->where('id', $comment->id)
            ->update(['created_at' => now()->subMinutes(20)]);

        $this->actingAs($this->proUser)
            ->patchJson("/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments/{$comment->id}", [
                'content' => 'Trying to edit old comment',
            ])
            ->assertForbidden();
    });

    it('prevents other users from editing', function () {
        $otherUser = User::factory()->create(['plan' => UserPlan::Pro]);
        $this->proProject->members()->attach($otherUser->id, [
            'role' => ProjectRole::Editor->value,
            'joined_at' => now(),
        ]);

        $comment = TaskComment::factory()->create([
            'task_id' => $this->proTask->id,
            'user_id' => $this->proUser->id,
        ]);

        $this->actingAs($otherUser)
            ->patchJson("/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments/{$comment->id}", [
                'content' => 'Trying to edit someone else comment',
            ])
            ->assertForbidden();
    });
});

describe('Comment Deletion', function () {
    it('allows comment owner to delete', function () {
        Event::fake([TaskCommentDeleted::class]);

        $comment = TaskComment::factory()->create([
            'task_id' => $this->proTask->id,
            'user_id' => $this->proUser->id,
        ]);

        $this->actingAs($this->proUser)
            ->deleteJson("/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments/{$comment->id}")
            ->assertOk();

        expect(TaskComment::find($comment->id))->toBeNull();
        expect(TaskComment::withTrashed()->find($comment->id))->not->toBeNull(); // Soft deleted
        Event::assertDispatched(TaskCommentDeleted::class);
    });

    it('allows project owner to delete any comment', function () {
        $member = User::factory()->create(['plan' => UserPlan::Pro]);
        $this->proProject->members()->attach($member->id, [
            'role' => ProjectRole::Editor->value,
            'joined_at' => now(),
        ]);

        $comment = TaskComment::factory()->create([
            'task_id' => $this->proTask->id,
            'user_id' => $member->id,
        ]);

        // Project owner can delete member's comment
        $this->actingAs($this->proUser)
            ->deleteJson("/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments/{$comment->id}")
            ->assertOk();

        expect(TaskComment::find($comment->id))->toBeNull();
    });

    it('prevents non-owner members from deleting others comments', function () {
        $member = User::factory()->create(['plan' => UserPlan::Pro]);
        $this->proProject->members()->attach($member->id, [
            'role' => ProjectRole::Editor->value,
            'joined_at' => now(),
        ]);

        $comment = TaskComment::factory()->create([
            'task_id' => $this->proTask->id,
            'user_id' => $this->proUser->id, // Owner's comment
        ]);

        // Member cannot delete owner's comment
        $this->actingAs($member)
            ->deleteJson("/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments/{$comment->id}")
            ->assertForbidden();
    });
});

describe('Comment Reactions (Pro Plan)', function () {
    it('allows pro users to toggle reaction', function () {
        $comment = TaskComment::factory()->create([
            'task_id' => $this->proTask->id,
            'user_id' => $this->proUser->id,
        ]);

        // Add reaction
        $this->actingAs($this->proUser)
            ->postJson("/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments/{$comment->id}/reactions", [
                'emoji' => '👍',
            ])
            ->assertOk()
            ->assertJsonPath('action', 'added');

        expect(TaskCommentReaction::where('task_comment_id', $comment->id)->count())->toBe(1);

        // Remove reaction (toggle)
        $this->actingAs($this->proUser)
            ->postJson("/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments/{$comment->id}/reactions", [
                'emoji' => '👍',
            ])
            ->assertOk()
            ->assertJsonPath('action', 'removed');

        expect(TaskCommentReaction::where('task_comment_id', $comment->id)->count())->toBe(0);
    });

    it('can add multiple different reactions', function () {
        $comment = TaskComment::factory()->create([
            'task_id' => $this->proTask->id,
            'user_id' => $this->proUser->id,
        ]);

        $this->actingAs($this->proUser)
            ->postJson("/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments/{$comment->id}/reactions", [
                'emoji' => '👍',
            ])
            ->assertOk();

        $this->actingAs($this->proUser)
            ->postJson("/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments/{$comment->id}/reactions", [
                'emoji' => '❤️',
            ])
            ->assertOk();

        expect(TaskCommentReaction::where('task_comment_id', $comment->id)->count())->toBe(2);
    });

    it('returns grouped reactions', function () {
        $comment = TaskComment::factory()->create([
            'task_id' => $this->proTask->id,
            'user_id' => $this->proUser->id,
        ]);

        $member = User::factory()->create(['plan' => UserPlan::Pro]);
        $this->proProject->members()->attach($member->id, [
            'role' => ProjectRole::Editor->value,
            'joined_at' => now(),
        ]);

        // Both users react with same emoji
        TaskCommentReaction::create([
            'task_comment_id' => $comment->id,
            'user_id' => $this->proUser->id,
            'emoji' => '👍',
        ]);
        TaskCommentReaction::create([
            'task_comment_id' => $comment->id,
            'user_id' => $member->id,
            'emoji' => '👍',
        ]);

        $response = $this->actingAs($this->proUser)
            ->postJson("/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments/{$comment->id}/reactions", [
                'emoji' => '❤️',
            ])
            ->assertOk();

        $reactions = $response->json('reactions');
        $thumbsUp = collect($reactions)->firstWhere('emoji', '👍');

        expect($thumbsUp['count'])->toBe(2);
        expect($thumbsUp['reacted_by_me'])->toBeTrue();
    });
});

describe('Comment Reactions (Free Plan Restriction)', function () {
    it('prevents free users from adding reactions', function () {
        // Add free user as member
        $this->proProject->members()->attach($this->freeUser->id, [
            'role' => ProjectRole::Editor->value,
            'joined_at' => now(),
        ]);

        $comment = TaskComment::factory()->create([
            'task_id' => $this->proTask->id,
            'user_id' => $this->proUser->id,
        ]);

        $this->actingAs($this->freeUser)
            ->postJson("/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments/{$comment->id}/reactions", [
                'emoji' => '👍',
            ])
            ->assertForbidden()
            ->assertJsonPath('upgrade_required', true);

        expect(TaskCommentReaction::where('task_comment_id', $comment->id)->count())->toBe(0);
    });
});

describe('Cross-Project Security', function () {
    it('cannot access comments from task in different project', function () {
        $otherProject = Project::factory()->create(['user_id' => $this->proUser->id]);

        $this->actingAs($this->proUser)
            ->getJson("/api/projects/{$otherProject->id}/tasks/{$this->proTask->id}/comments")
            ->assertNotFound();
    });

    it('cannot create comment on task in different project', function () {
        $otherProject = Project::factory()->create(['user_id' => $this->proUser->id]);

        $this->actingAs($this->proUser)
            ->postJson("/projects/{$otherProject->id}/tasks/{$this->proTask->id}/comments", [
                'content' => 'Sneaky comment',
            ])
            ->assertNotFound();
    });

    it('cannot update comment from different task', function () {
        $otherTask = Task::factory()->create([
            'project_id' => $this->proProject->id,
            'list_id' => $this->proList->id,
        ]);
        $comment = TaskComment::factory()->create([
            'task_id' => $otherTask->id,
            'user_id' => $this->proUser->id,
        ]);

        $this->actingAs($this->proUser)
            ->patchJson("/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments/{$comment->id}", [
                'content' => 'Hacked content',
            ])
            ->assertNotFound();
    });
});

describe('Project Member Access', function () {
    it('allows project members to view comments', function () {
        $member = User::factory()->create(['plan' => UserPlan::Pro]);
        $this->proProject->members()->attach($member->id, [
            'role' => ProjectRole::Viewer->value,
            'joined_at' => now(),
        ]);

        TaskComment::factory()->count(3)->create([
            'task_id' => $this->proTask->id,
            'user_id' => $this->proUser->id,
        ]);

        $this->actingAs($member)
            ->getJson("/api/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments")
            ->assertOk()
            ->assertJsonCount(3, 'comments');
    });

    it('allows project members with pro plan to create comments', function () {
        $member = User::factory()->create(['plan' => UserPlan::Pro]);
        $this->proProject->members()->attach($member->id, [
            'role' => ProjectRole::Editor->value,
            'joined_at' => now(),
        ]);

        $this->actingAs($member)
            ->postJson("/projects/{$this->proProject->id}/tasks/{$this->proTask->id}/comments", [
                'content' => 'Member comment',
            ])
            ->assertCreated();

        expect($this->proTask->allComments()->count())->toBe(1);
    });
});
