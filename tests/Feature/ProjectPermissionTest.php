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

    $this->project = Project::factory()
        ->for($this->owner)
        ->create();

    // Create a list with a task
    $this->list = TaskList::factory()->for($this->project)->create();
    $this->task = Task::factory()
        ->for($this->project)
        ->for($this->list, 'list')
        ->create();

    // Add editor and viewer as members
    $this->project->members()->attach($this->editor->id, ['role' => ProjectRole::Editor->value]);
    $this->project->members()->attach($this->viewer->id, ['role' => ProjectRole::Viewer->value]);
});

// === OWNER PERMISSIONS ===

test('owner can create tasks', function () {
    $this->actingAs($this->owner)
        ->post(route('projects.tasks.store', ['project' => $this->project, 'list' => $this->list]), [
            'title' => 'New Task',
            'priority' => 'medium',
            'due_date' => now()->addDays(1)->format('Y-m-d'),
            'due_time' => '12:00',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('tasks', ['title' => 'New Task']);
});

test('owner can update tasks', function () {
    $this->actingAs($this->owner)
        ->patch(route('projects.tasks.update', ['project' => $this->project, 'task' => $this->task]), [
            'title' => 'Updated Task',
            'due_date' => $this->task->due_date,
            'due_time' => $this->task->due_time,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('tasks', ['id' => $this->task->id, 'title' => 'Updated Task']);
});

test('owner can delete tasks', function () {
    $taskId = $this->task->id;

    $this->actingAs($this->owner)
        ->delete(route('projects.tasks.destroy', ['project' => $this->project, 'task' => $this->task]))
        ->assertRedirect();

    $this->assertDatabaseMissing('tasks', ['id' => $taskId]);
});

test('owner can create lists', function () {
    $this->actingAs($this->owner)
        ->post(route('projects.lists.store', ['project' => $this->project]), [
            'name' => 'New List',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('lists', ['name' => 'New List']);
});

test('owner can delete lists', function () {
    $newList = TaskList::factory()->for($this->project)->create();

    $this->actingAs($this->owner)
        ->delete(route('projects.lists.destroy', ['project' => $this->project, 'list' => $newList]))
        ->assertRedirect();

    $this->assertDatabaseMissing('lists', ['id' => $newList->id]);
});

test('owner can complete tasks', function () {
    $this->actingAs($this->owner)
        ->patch(route('projects.tasks.complete', ['project' => $this->project, 'task' => $this->task]))
        ->assertRedirect();

    $this->task->refresh();
    expect($this->task->completed_at)->not->toBeNull();
});

test('owner can reopen completed tasks', function () {
    $this->task->update(['completed_at' => now()]);

    $this->actingAs($this->owner)
        ->patch(route('projects.tasks.complete', ['project' => $this->project, 'task' => $this->task]))
        ->assertRedirect();

    $this->task->refresh();
    expect($this->task->completed_at)->toBeNull();
});

test('owner can set done list', function () {
    $this->actingAs($this->owner)
        ->patch(route('projects.lists.done', ['project' => $this->project, 'list' => $this->list]))
        ->assertRedirect();

    $this->list->refresh();
    expect($this->list->is_done_list)->toBeTrue();
});

test('owner can unset done list', function () {
    $this->list->update(['is_done_list' => true]);

    $this->actingAs($this->owner)
        ->patch(route('projects.lists.done', ['project' => $this->project, 'list' => $this->list]))
        ->assertRedirect();

    $this->list->refresh();
    expect($this->list->is_done_list)->toBeFalse();
});

// === EDITOR PERMISSIONS ===

test('editor can create tasks', function () {
    $this->actingAs($this->editor)
        ->post(route('projects.tasks.store', ['project' => $this->project, 'list' => $this->list]), [
            'title' => 'Editor Task',
            'priority' => 'medium',
            'due_date' => now()->addDays(1)->format('Y-m-d'),
            'due_time' => '12:00',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('tasks', ['title' => 'Editor Task']);
});

test('editor can update tasks', function () {
    $this->actingAs($this->editor)
        ->patch(route('projects.tasks.update', ['project' => $this->project, 'task' => $this->task]), [
            'title' => 'Editor Updated',
            'due_date' => $this->task->due_date,
            'due_time' => $this->task->due_time,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('tasks', ['id' => $this->task->id, 'title' => 'Editor Updated']);
});

test('editor cannot delete tasks', function () {
    $this->actingAs($this->editor)
        ->delete(route('projects.tasks.destroy', ['project' => $this->project, 'task' => $this->task]))
        ->assertForbidden();
});

test('editor can create lists', function () {
    $this->actingAs($this->editor)
        ->post(route('projects.lists.store', ['project' => $this->project]), [
            'name' => 'Editor List',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('lists', ['name' => 'Editor List']);
});

test('editor cannot delete lists', function () {
    $newList = TaskList::factory()->for($this->project)->create();

    $this->actingAs($this->editor)
        ->delete(route('projects.lists.destroy', ['project' => $this->project, 'list' => $newList]))
        ->assertForbidden();
});

test('editor cannot set done list', function () {
    $this->actingAs($this->editor)
        ->patch(route('projects.lists.done', ['project' => $this->project, 'list' => $this->list]))
        ->assertForbidden();

    $this->list->refresh();
    expect($this->list->is_done_list)->toBeFalse();
});

test('editor cannot unset done list', function () {
    $this->list->update(['is_done_list' => true]);

    $this->actingAs($this->editor)
        ->patch(route('projects.lists.done', ['project' => $this->project, 'list' => $this->list]))
        ->assertForbidden();

    $this->list->refresh();
    expect($this->list->is_done_list)->toBeTrue();
});

test('editor can complete tasks', function () {
    $this->actingAs($this->editor)
        ->patch(route('projects.tasks.complete', ['project' => $this->project, 'task' => $this->task]))
        ->assertRedirect();

    $this->task->refresh();
    expect($this->task->completed_at)->not->toBeNull();
});

test('editor cannot reopen completed tasks', function () {
    $this->task->update(['completed_at' => now()]);

    $this->actingAs($this->editor)
        ->patch(route('projects.tasks.complete', ['project' => $this->project, 'task' => $this->task]))
        ->assertForbidden();
});

// === VIEWER PERMISSIONS ===

test('viewer can view project lists', function () {
    $this->actingAs($this->viewer)
        ->get(route('projects.lists.index', ['project' => $this->project]))
        ->assertOk();
});

test('viewer cannot create tasks', function () {
    $this->actingAs($this->viewer)
        ->post(route('projects.tasks.store', ['project' => $this->project, 'list' => $this->list]), [
            'title' => 'Viewer Task',
            'priority' => 'medium',
            'due_date' => now()->addDays(1)->format('Y-m-d'),
            'due_time' => '12:00',
        ])
        ->assertForbidden();
});

test('viewer cannot update tasks', function () {
    $this->actingAs($this->viewer)
        ->patch(route('projects.tasks.update', ['project' => $this->project, 'task' => $this->task]), [
            'title' => 'Viewer Updated',
            'due_date' => $this->task->due_date,
            'due_time' => $this->task->due_time,
        ])
        ->assertForbidden();
});

test('viewer cannot delete tasks', function () {
    $this->actingAs($this->viewer)
        ->delete(route('projects.tasks.destroy', ['project' => $this->project, 'task' => $this->task]))
        ->assertForbidden();
});

test('viewer cannot create lists', function () {
    $this->actingAs($this->viewer)
        ->post(route('projects.lists.store', ['project' => $this->project]), [
            'name' => 'Viewer List',
        ])
        ->assertForbidden();
});

test('viewer cannot delete lists', function () {
    $newList = TaskList::factory()->for($this->project)->create();

    $this->actingAs($this->viewer)
        ->delete(route('projects.lists.destroy', ['project' => $this->project, 'list' => $newList]))
        ->assertForbidden();
});

test('viewer cannot complete tasks', function () {
    $this->actingAs($this->viewer)
        ->patch(route('projects.tasks.complete', ['project' => $this->project, 'task' => $this->task]))
        ->assertForbidden();
});

// === PERMISSION HELPER TESTS ===

test('getPermissions returns correct permissions for owner', function () {
    $permissions = $this->project->getPermissions($this->owner);

    expect($permissions)->toMatchArray([
        'canEdit' => true,
        'canDelete' => true,
        'canManageSettings' => true,
        'canManageMembers' => true,
        'canAssignTask' => true,
        'canReopen' => true,
        'role' => 'owner',
    ]);
});

test('getPermissions returns correct permissions for editor', function () {
    $permissions = $this->project->getPermissions($this->editor);

    expect($permissions)->toMatchArray([
        'canEdit' => true,
        'canDelete' => false,
        'canManageSettings' => false,
        'canManageMembers' => false,
        'canAssignTask' => false,
        'canReopen' => false,
        'role' => 'editor',
    ]);
});

test('getPermissions returns correct permissions for viewer', function () {
    $permissions = $this->project->getPermissions($this->viewer);

    expect($permissions)->toMatchArray([
        'canEdit' => false,
        'canDelete' => false,
        'canManageSettings' => false,
        'canManageMembers' => false,
        'canAssignTask' => false,
        'canReopen' => false,
        'role' => 'viewer',
    ]);
});

// === TASK ASSIGNMENT TESTS ===

test('owner can assign tasks to members', function () {
    $this->actingAs($this->owner)
        ->patch(route('projects.tasks.update', ['project' => $this->project, 'task' => $this->task]), [
            'title' => $this->task->title,
            'due_date' => $this->task->due_date,
            'due_time' => $this->task->due_time,
            'assigned_to' => $this->editor->id,
        ])
        ->assertRedirect();

    $this->task->refresh();
    expect($this->task->assigned_to)->toBe($this->editor->id);
});

test('editor cannot assign tasks to others', function () {
    $this->actingAs($this->editor)
        ->patch(route('projects.tasks.update', ['project' => $this->project, 'task' => $this->task]), [
            'title' => $this->task->title,
            'due_date' => $this->task->due_date,
            'due_time' => $this->task->due_time,
            'assigned_to' => $this->viewer->id,
        ])
        ->assertSessionHasErrors('assigned_to');
});

test('editor can create tasks assigned to themselves', function () {
    $this->actingAs($this->editor)
        ->post(route('projects.tasks.store', ['project' => $this->project, 'list' => $this->list]), [
            'title' => 'Task assigned to self',
            'priority' => 'medium',
            'due_date' => now()->addDays(1)->format('Y-m-d'),
            'due_time' => '12:00',
            'assigned_to' => $this->editor->id,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('tasks', [
        'title' => 'Task assigned to self',
        'assigned_to' => $this->editor->id,
    ]);
});

test('editor cannot assign tasks to others when creating', function () {
    $this->actingAs($this->editor)
        ->post(route('projects.tasks.store', ['project' => $this->project, 'list' => $this->list]), [
            'title' => 'Task with assignment',
            'priority' => 'medium',
            'due_date' => now()->addDays(1)->format('Y-m-d'),
            'due_time' => '12:00',
            'assigned_to' => $this->owner->id,
        ])
        ->assertSessionHasErrors('assigned_to');
});
