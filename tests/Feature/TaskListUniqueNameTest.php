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
