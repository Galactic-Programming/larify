<?php

use App\Enums\ProjectRole;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskList;
use App\Models\User;

beforeEach(function () {
    $this->owner = User::factory()->create();
    $this->editor = User::factory()->create();
    $this->viewer = User::factory()->create();
    $this->otherUser = User::factory()->create();

    $this->project = Project::factory()->for($this->owner, 'user')->create();
    $this->list = TaskList::factory()->for($this->project)->create();
    $this->task = Task::factory()->for($this->project)->for($this->list, 'list')->create();

    // Add members with different roles using attach()
    $this->project->members()->attach($this->editor->id, ['role' => ProjectRole::Editor->value]);
    $this->project->members()->attach($this->viewer->id, ['role' => ProjectRole::Viewer->value]);
});

/*
|--------------------------------------------------------------------------
| Soft Delete Tests
|--------------------------------------------------------------------------
*/

test('deleting a project soft deletes it', function () {
    $this->actingAs($this->owner)
        ->delete(route('projects.destroy', $this->project))
        ->assertRedirect();

    $this->assertSoftDeleted('projects', ['id' => $this->project->id]);
});

test('deleting a project cascade soft deletes lists and tasks', function () {
    $this->actingAs($this->owner)
        ->delete(route('projects.destroy', $this->project))
        ->assertRedirect();

    $this->assertSoftDeleted('projects', ['id' => $this->project->id]);
    $this->assertSoftDeleted('lists', ['id' => $this->list->id]);
    $this->assertSoftDeleted('tasks', ['id' => $this->task->id]);
});

test('deleting a list soft deletes it', function () {
    $newList = TaskList::factory()->for($this->project)->create();

    $this->actingAs($this->owner)
        ->delete(route('projects.lists.destroy', ['project' => $this->project, 'list' => $newList]))
        ->assertRedirect();

    $this->assertSoftDeleted('lists', ['id' => $newList->id]);
});

test('deleting a list cascade soft deletes its tasks', function () {
    $newList = TaskList::factory()->for($this->project)->create();
    $task1 = Task::factory()->for($this->project)->for($newList, 'list')->create();
    $task2 = Task::factory()->for($this->project)->for($newList, 'list')->create();

    $this->actingAs($this->owner)
        ->delete(route('projects.lists.destroy', ['project' => $this->project, 'list' => $newList]))
        ->assertRedirect();

    $this->assertSoftDeleted('lists', ['id' => $newList->id]);
    $this->assertSoftDeleted('tasks', ['id' => $task1->id]);
    $this->assertSoftDeleted('tasks', ['id' => $task2->id]);
});

test('deleting a task soft deletes it', function () {
    $this->actingAs($this->owner)
        ->delete(route('projects.tasks.destroy', ['project' => $this->project, 'task' => $this->task]))
        ->assertRedirect();

    $this->assertSoftDeleted('tasks', ['id' => $this->task->id]);
});

/*
|--------------------------------------------------------------------------
| Global Trash Index Tests
|--------------------------------------------------------------------------
*/

test('owner can view global trash page', function () {
    // Soft delete some items
    $this->task->delete();
    $this->list->delete();

    $this->actingAs($this->owner)
        ->get(route('trash.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('trash/index', false) // false = don't check file exists (frontend not yet created)
            ->has('trashedLists')
            ->has('trashedTasks')
            ->has('trashedProjects')
            ->has('retentionDays')
        );
});

test('trashed items appear in global trash', function () {
    $this->task->delete();

    $response = $this->actingAs($this->owner)
        ->get(route('trash.index'));

    $response->assertOk();
    $trashedTasks = $response->original->getData()['page']['props']['trashedTasks'];
    expect($trashedTasks)->toHaveCount(1);
    expect($trashedTasks[0]['id'])->toBe($this->task->id);
});

/*
|--------------------------------------------------------------------------
| Restore Tests - Project
|--------------------------------------------------------------------------
*/

test('owner can restore a trashed project', function () {
    $this->project->delete();

    $this->actingAs($this->owner)
        ->patch(route('trash.projects.restore', $this->project->id))
        ->assertRedirect();

    $this->assertDatabaseHas('projects', [
        'id' => $this->project->id,
        'deleted_at' => null,
    ]);
});

test('restoring a project also restores cascade-deleted lists and tasks', function () {
    // Delete project (cascades to lists and tasks)
    $this->project->delete();

    $this->assertSoftDeleted('projects', ['id' => $this->project->id]);
    $this->assertSoftDeleted('lists', ['id' => $this->list->id]);
    $this->assertSoftDeleted('tasks', ['id' => $this->task->id]);

    // Restore project
    $this->actingAs($this->owner)
        ->patch(route('trash.projects.restore', $this->project->id))
        ->assertRedirect();

    // All should be restored
    $this->assertDatabaseHas('projects', ['id' => $this->project->id, 'deleted_at' => null]);
    $this->assertDatabaseHas('lists', ['id' => $this->list->id, 'deleted_at' => null]);
    $this->assertDatabaseHas('tasks', ['id' => $this->task->id, 'deleted_at' => null]);
});

test('non-owner cannot restore a trashed project', function () {
    $this->project->delete();

    $this->actingAs($this->editor)
        ->patch(route('trash.projects.restore', $this->project->id))
        ->assertForbidden();

    $this->assertSoftDeleted('projects', ['id' => $this->project->id]);
});

/*
|--------------------------------------------------------------------------
| Restore Tests - List
|--------------------------------------------------------------------------
*/

test('owner can restore a trashed list', function () {
    $this->list->delete();

    $this->actingAs($this->owner)
        ->patch(route('trash.lists.restore', $this->list->id))
        ->assertRedirect();

    $this->assertDatabaseHas('lists', [
        'id' => $this->list->id,
        'deleted_at' => null,
    ]);
});

test('restoring a list also restores cascade-deleted tasks', function () {
    // Delete list (cascades to tasks)
    $this->list->delete();

    $this->assertSoftDeleted('lists', ['id' => $this->list->id]);
    $this->assertSoftDeleted('tasks', ['id' => $this->task->id]);

    // Restore list
    $this->actingAs($this->owner)
        ->patch(route('trash.lists.restore', $this->list->id))
        ->assertRedirect();

    // Both should be restored
    $this->assertDatabaseHas('lists', ['id' => $this->list->id, 'deleted_at' => null]);
    $this->assertDatabaseHas('tasks', ['id' => $this->task->id, 'deleted_at' => null]);
});

test('editor cannot restore a trashed list', function () {
    $this->list->delete();

    $this->actingAs($this->editor)
        ->patch(route('trash.lists.restore', $this->list->id))
        ->assertForbidden();

    $this->assertSoftDeleted('lists', ['id' => $this->list->id]);
});

/*
|--------------------------------------------------------------------------
| Restore Tests - Task
|--------------------------------------------------------------------------
*/

test('owner can restore a trashed task', function () {
    $this->task->delete();

    $this->actingAs($this->owner)
        ->patch(route('trash.tasks.restore', $this->task->id))
        ->assertRedirect();

    $this->assertDatabaseHas('tasks', [
        'id' => $this->task->id,
        'deleted_at' => null,
    ]);
});

test('editor cannot restore a trashed task', function () {
    $this->task->delete();

    $this->actingAs($this->editor)
        ->patch(route('trash.tasks.restore', $this->task->id))
        ->assertForbidden();

    $this->assertSoftDeleted('tasks', ['id' => $this->task->id]);
});

/*
|--------------------------------------------------------------------------
| Force Delete Tests - Project
|--------------------------------------------------------------------------
*/

test('owner can force delete a trashed project', function () {
    $this->project->delete();

    $this->actingAs($this->owner)
        ->delete(route('trash.projects.force-delete', $this->project->id))
        ->assertRedirect();

    $this->assertDatabaseMissing('projects', ['id' => $this->project->id]);
});

test('force deleting a project also force deletes lists and tasks', function () {
    $this->project->delete();

    $this->actingAs($this->owner)
        ->delete(route('trash.projects.force-delete', $this->project->id))
        ->assertRedirect();

    $this->assertDatabaseMissing('projects', ['id' => $this->project->id]);
    $this->assertDatabaseMissing('lists', ['id' => $this->list->id]);
    $this->assertDatabaseMissing('tasks', ['id' => $this->task->id]);
});

test('non-owner cannot force delete a trashed project', function () {
    $this->project->delete();

    $this->actingAs($this->editor)
        ->delete(route('trash.projects.force-delete', $this->project->id))
        ->assertForbidden();

    // Project should still exist (soft deleted)
    expect(Project::withTrashed()->find($this->project->id))->not->toBeNull();
});

/*
|--------------------------------------------------------------------------
| Force Delete Tests - List
|--------------------------------------------------------------------------
*/

test('owner can force delete a trashed list', function () {
    $this->list->delete();

    $this->actingAs($this->owner)
        ->delete(route('trash.lists.force-delete', $this->list->id))
        ->assertRedirect();

    $this->assertDatabaseMissing('lists', ['id' => $this->list->id]);
});

test('editor cannot force delete a trashed list', function () {
    $this->list->delete();

    $this->actingAs($this->editor)
        ->delete(route('trash.lists.force-delete', $this->list->id))
        ->assertForbidden();

    expect(TaskList::withTrashed()->find($this->list->id))->not->toBeNull();
});

/*
|--------------------------------------------------------------------------
| Force Delete Tests - Task
|--------------------------------------------------------------------------
*/

test('owner can force delete a trashed task', function () {
    $this->task->delete();

    $this->actingAs($this->owner)
        ->delete(route('trash.tasks.force-delete', $this->task->id))
        ->assertRedirect();

    $this->assertDatabaseMissing('tasks', ['id' => $this->task->id]);
});

test('editor cannot force delete a trashed task', function () {
    $this->task->delete();

    $this->actingAs($this->editor)
        ->delete(route('trash.tasks.force-delete', $this->task->id))
        ->assertForbidden();

    expect(Task::withTrashed()->find($this->task->id))->not->toBeNull();
});

/*
|--------------------------------------------------------------------------
| Empty Trash Tests
|--------------------------------------------------------------------------
*/

test('owner can empty all trash', function () {
    // Create and delete multiple items
    $project2 = Project::factory()->for($this->owner, 'user')->create();
    $this->task->delete();
    $this->list->delete();
    $project2->delete();

    $this->actingAs($this->owner)
        ->delete(route('trash.empty'))
        ->assertRedirect();

    // All should be permanently deleted
    $this->assertDatabaseMissing('tasks', ['id' => $this->task->id]);
    $this->assertDatabaseMissing('lists', ['id' => $this->list->id]);
    $this->assertDatabaseMissing('projects', ['id' => $project2->id]);
});

test('empty trash only affects current user items', function () {
    // Other user's project
    $otherProject = Project::factory()->for($this->otherUser, 'user')->create();
    $otherProject->delete();

    // Current user's items
    $this->task->delete();

    $this->actingAs($this->owner)
        ->delete(route('trash.empty'))
        ->assertRedirect();

    // Owner's task should be deleted
    $this->assertDatabaseMissing('tasks', ['id' => $this->task->id]);

    // Other user's project should still exist
    expect(Project::withTrashed()->find($otherProject->id))->not->toBeNull();
});

/*
|--------------------------------------------------------------------------
| Project Trash Tests
|--------------------------------------------------------------------------
*/

test('member can view project trash', function () {
    $this->task->delete();

    $this->actingAs($this->viewer)
        ->get(route('api.projects.trash.index', $this->project))
        ->assertOk()
        ->assertJsonStructure([
            'trashedLists',
            'trashedTasks',
            'retentionDays',
        ]);
});

test('owner can restore task from project trash', function () {
    $this->task->delete();

    $this->actingAs($this->owner)
        ->patch(route('projects.trash.tasks.restore', ['project' => $this->project, 'task' => $this->task->id]))
        ->assertRedirect();

    $this->assertDatabaseHas('tasks', ['id' => $this->task->id, 'deleted_at' => null]);
});

test('owner can empty project trash', function () {
    $this->task->delete();
    $newList = TaskList::factory()->for($this->project)->create();
    $newList->delete();

    $this->actingAs($this->owner)
        ->delete(route('projects.trash.empty', $this->project))
        ->assertRedirect();

    $this->assertDatabaseMissing('tasks', ['id' => $this->task->id]);
    $this->assertDatabaseMissing('lists', ['id' => $newList->id]);
});

test('editor cannot empty project trash', function () {
    $this->task->delete();

    $this->actingAs($this->editor)
        ->delete(route('projects.trash.empty', $this->project))
        ->assertForbidden();

    expect(Task::withTrashed()->find($this->task->id))->not->toBeNull();
});

/*
|--------------------------------------------------------------------------
| Edge Cases
|--------------------------------------------------------------------------
*/

test('cannot restore task if list is deleted', function () {
    // Delete list first (cascades to task)
    $this->list->delete();

    // Try to restore just the task (should fail because list is deleted)
    $this->actingAs($this->owner)
        ->patch(route('projects.trash.tasks.restore', ['project' => $this->project, 'task' => $this->task->id]))
        ->assertSessionHasErrors('task');

    $this->assertSoftDeleted('tasks', ['id' => $this->task->id]);
});

test('soft deleted items are not visible in normal queries', function () {
    $this->task->delete();

    // Task should not appear in project's tasks
    $tasks = $this->project->tasks()->get();
    expect($tasks)->toHaveCount(0);

    // But should appear with withTrashed
    $tasksWithTrashed = $this->project->tasks()->withTrashed()->get();
    expect($tasksWithTrashed)->toHaveCount(1);
});

test('unauthorized user cannot access trash', function () {
    $this->task->delete();

    $this->actingAs($this->otherUser)
        ->patch(route('trash.tasks.restore', $this->task->id))
        ->assertForbidden();
});
