<?php

use App\Models\Project;
use App\Models\TaskList;
use App\Models\User;

beforeEach(function () {
    $this->owner = User::factory()->create();
    $this->project = Project::factory()->for($this->owner)->create();
    $this->existingList = TaskList::factory()->for($this->project)->create(['name' => 'Existing List']);
});

test('cannot create list with duplicate name in same project', function () {
    $this->actingAs($this->owner)
        ->post(route('projects.lists.store', ['project' => $this->project]), [
            'name' => 'Existing List',
        ])
        ->assertSessionHasErrors(['name']);

    // Should still only have one list with this name
    expect(\App\Models\TaskList::where('project_id', $this->project->id)->where('name', 'Existing List')->count())->toBe(1);
});

test('can create list with unique name in same project', function () {
    $this->actingAs($this->owner)
        ->post(route('projects.lists.store', ['project' => $this->project]), [
            'name' => 'Different List',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('lists', [
        'project_id' => $this->project->id,
        'name' => 'Different List',
    ]);
});

test('can create list with same name in different project', function () {
    $otherProject = Project::factory()->for($this->owner)->create();

    $this->actingAs($this->owner)
        ->post(route('projects.lists.store', ['project' => $otherProject]), [
            'name' => 'Existing List',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('lists', [
        'project_id' => $otherProject->id,
        'name' => 'Existing List',
    ]);
});

test('cannot update list to duplicate name in same project', function () {
    $anotherList = TaskList::factory()->for($this->project)->create(['name' => 'Another List']);

    $this->actingAs($this->owner)
        ->patch(route('projects.lists.update', ['project' => $this->project, 'list' => $anotherList]), [
            'name' => 'Existing List',
        ])
        ->assertSessionHasErrors(['name']);

    $anotherList->refresh();
    expect($anotherList->name)->toBe('Another List');
});

test('can update list keeping same name', function () {
    $this->actingAs($this->owner)
        ->patch(route('projects.lists.update', ['project' => $this->project, 'list' => $this->existingList]), [
            'name' => 'Existing List',
        ])
        ->assertRedirect();

    $this->existingList->refresh();
    expect($this->existingList->name)->toBe('Existing List');
});

test('can update list to unique name', function () {
    $this->actingAs($this->owner)
        ->patch(route('projects.lists.update', ['project' => $this->project, 'list' => $this->existingList]), [
            'name' => 'Renamed List',
        ])
        ->assertRedirect();

    $this->existingList->refresh();
    expect($this->existingList->name)->toBe('Renamed List');
});

// === SOFT DELETE & REUSE NAME TESTS ===

test('can create list with same name as soft deleted list', function () {
    // Delete the existing list
    $this->existingList->delete();

    // Create a new list with the same name
    $this->actingAs($this->owner)
        ->post(route('projects.lists.store', ['project' => $this->project]), [
            'name' => 'Existing List',
        ])
        ->assertRedirect();

    // Should have 2 lists with this name (1 deleted, 1 active)
    expect(TaskList::withTrashed()
        ->where('project_id', $this->project->id)
        ->where('name', 'Existing List')
        ->count())->toBe(2);

    // But only 1 active
    expect(TaskList::where('project_id', $this->project->id)
        ->where('name', 'Existing List')
        ->count())->toBe(1);
});

test('can update list to same name as soft deleted list', function () {
    $anotherList = TaskList::factory()->for($this->project)->create(['name' => 'Another List']);

    // Delete the existing list
    $this->existingList->delete();

    // Update another list to use the deleted list's name
    $this->actingAs($this->owner)
        ->patch(route('projects.lists.update', ['project' => $this->project, 'list' => $anotherList]), [
            'name' => 'Existing List',
        ])
        ->assertRedirect();

    $anotherList->refresh();
    expect($anotherList->name)->toBe('Existing List');
});

test('restore list with unique name keeps original name', function () {
    // Delete the list
    $this->existingList->delete();

    // Restore it
    $this->actingAs($this->owner)
        ->patch(route('projects.trash.lists.restore', ['project' => $this->project, 'list' => $this->existingList->id]))
        ->assertRedirect();

    $this->existingList->refresh();
    expect($this->existingList->name)->toBe('Existing List');
    expect($this->existingList->deleted_at)->toBeNull();
});

test('restore list with conflicting name gets auto-suffixed', function () {
    $originalListId = $this->existingList->id;

    // Delete the list
    $this->existingList->delete();

    // Create a new list with the same name
    $newList = TaskList::factory()->for($this->project)->create(['name' => 'Existing List']);

    // Restore the original list - should get auto-suffixed
    $this->actingAs($this->owner)
        ->patch(route('projects.trash.lists.restore', ['project' => $this->project, 'list' => $originalListId]))
        ->assertRedirect();

    $this->existingList->refresh();
    expect($this->existingList->name)->toBe('Existing List (1)');
    expect($this->existingList->deleted_at)->toBeNull();
});

test('restore list with multiple conflicting names gets incremented suffix', function () {
    $originalListId = $this->existingList->id;

    // Delete the list
    $this->existingList->delete();

    // Create lists with the original name and suffixed names
    TaskList::factory()->for($this->project)->create(['name' => 'Existing List']);
    TaskList::factory()->for($this->project)->create(['name' => 'Existing List (1)']);
    TaskList::factory()->for($this->project)->create(['name' => 'Existing List (2)']);

    // Restore the original list - should get auto-suffixed to (3)
    $this->actingAs($this->owner)
        ->patch(route('projects.trash.lists.restore', ['project' => $this->project, 'list' => $originalListId]))
        ->assertRedirect();

    $this->existingList->refresh();
    expect($this->existingList->name)->toBe('Existing List (3)');
});

test('can have multiple soft deleted lists with same name', function () {
    // Delete the existing list
    $this->existingList->delete();

    // Create and delete another list with the same name
    $secondList = TaskList::factory()->for($this->project)->create(['name' => 'Existing List']);
    $secondList->delete();

    // Create and delete a third list with the same name
    $thirdList = TaskList::factory()->for($this->project)->create(['name' => 'Existing List']);
    $thirdList->delete();

    // Should have 3 soft deleted lists with the same name
    expect(TaskList::onlyTrashed()
        ->where('project_id', $this->project->id)
        ->where('name', 'Existing List')
        ->count())->toBe(3);

    // Can still create a new active list with the same name
    $this->actingAs($this->owner)
        ->post(route('projects.lists.store', ['project' => $this->project]), [
            'name' => 'Existing List',
        ])
        ->assertRedirect();

    expect(TaskList::where('project_id', $this->project->id)
        ->where('name', 'Existing List')
        ->count())->toBe(1);
});
