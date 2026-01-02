<?php

use App\Enums\UserPlan;
use App\Models\Label;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskList;
use App\Models\User;

beforeEach(function () {
    $this->proUser = User::factory()->create(['plan' => UserPlan::Pro]);
    $this->freeUser = User::factory()->create(['plan' => UserPlan::Free]);
    $this->proProject = Project::factory()->create(['user_id' => $this->proUser->id]);
    $this->freeProject = Project::factory()->create(['user_id' => $this->freeUser->id]);
});

describe('Label CRUD', function () {
    it('can list labels for a project', function () {
        Label::factory()->count(3)->create(['project_id' => $this->proProject->id]);

        $this->actingAs($this->proUser)
            ->getJson("/projects/{$this->proProject->id}/labels")
            ->assertOk()
            ->assertJsonCount(3, 'labels');
    });

    it('can create a label for a project', function () {
        $this->actingAs($this->proUser)
            ->postJson("/projects/{$this->proProject->id}/labels", [
                'name' => 'Bug',
                'color' => 'red',
            ])
            ->assertCreated()
            ->assertJsonPath('label.name', 'Bug')
            ->assertJsonPath('label.color', 'red');

        expect($this->proProject->labels()->count())->toBe(1);
    });

    it('can update a label', function () {
        $label = Label::factory()->create(['project_id' => $this->proProject->id]);

        $this->actingAs($this->proUser)
            ->patchJson("/projects/{$this->proProject->id}/labels/{$label->id}", [
                'name' => 'Updated Name',
            ])
            ->assertOk()
            ->assertJsonPath('label.name', 'Updated Name');
    });

    it('can delete a label', function () {
        $label = Label::factory()->create(['project_id' => $this->proProject->id]);

        $this->actingAs($this->proUser)
            ->deleteJson("/projects/{$this->proProject->id}/labels/{$label->id}")
            ->assertOk();

        expect(Label::find($label->id))->toBeNull();
    });

    it('cannot access labels from another project', function () {
        $otherProject = Project::factory()->create();
        $label = Label::factory()->create(['project_id' => $otherProject->id]);

        $this->actingAs($this->proUser)
            ->patchJson("/projects/{$this->proProject->id}/labels/{$label->id}", [
                'name' => 'Hacked',
            ])
            ->assertNotFound();
    });
});

describe('Free Plan Limits', function () {
    it('limits labels to 3 for free users', function () {
        Label::factory()->count(3)->create(['project_id' => $this->freeProject->id]);

        $this->actingAs($this->freeUser)
            ->postJson("/projects/{$this->freeProject->id}/labels", [
                'name' => 'Fourth Label',
                'color' => 'red',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    });

    it('allows unlimited labels for pro users', function () {
        Label::factory()->count(10)->create(['project_id' => $this->proProject->id]);

        $this->actingAs($this->proUser)
            ->postJson("/projects/{$this->proProject->id}/labels", [
                'name' => 'Eleventh Label',
                'color' => 'red',
            ])
            ->assertCreated();
    });

    it('restricts pro colors for free users', function () {
        $this->actingAs($this->freeUser)
            ->postJson("/projects/{$this->freeProject->id}/labels", [
                'name' => 'Pro Color Label',
                'color' => 'pink', // Pro-only color
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['color']);
    });

    it('allows pro colors for pro users', function () {
        $this->actingAs($this->proUser)
            ->postJson("/projects/{$this->proProject->id}/labels", [
                'name' => 'Pro Color Label',
                'color' => 'pink',
            ])
            ->assertCreated();
    });

    it('allows free colors for free users', function () {
        $this->actingAs($this->freeUser)
            ->postJson("/projects/{$this->freeProject->id}/labels", [
                'name' => 'Free Color Label',
                'color' => 'red', // Free color
            ])
            ->assertCreated();
    });
});

describe('Task Label Assignment', function () {
    it('can sync labels to a task', function () {
        $list = TaskList::factory()->create(['project_id' => $this->proProject->id]);
        $task = Task::factory()->create([
            'project_id' => $this->proProject->id,
            'list_id' => $list->id,
        ]);
        $labels = Label::factory()->count(2)->create(['project_id' => $this->proProject->id]);

        $this->actingAs($this->proUser)
            ->putJson("/projects/{$this->proProject->id}/tasks/{$task->id}/labels", [
                'label_ids' => $labels->pluck('id')->toArray(),
            ])
            ->assertOk();

        expect($task->fresh()->labels)->toHaveCount(2);
    });

    it('can attach a single label to a task', function () {
        $list = TaskList::factory()->create(['project_id' => $this->proProject->id]);
        $task = Task::factory()->create([
            'project_id' => $this->proProject->id,
            'list_id' => $list->id,
        ]);
        $label = Label::factory()->create(['project_id' => $this->proProject->id]);

        $this->actingAs($this->proUser)
            ->postJson("/projects/{$this->proProject->id}/tasks/{$task->id}/labels/attach", [
                'label_id' => $label->id,
            ])
            ->assertOk();

        expect($task->fresh()->labels)->toHaveCount(1);
    });

    it('can detach a label from a task', function () {
        $list = TaskList::factory()->create(['project_id' => $this->proProject->id]);
        $task = Task::factory()->create([
            'project_id' => $this->proProject->id,
            'list_id' => $list->id,
        ]);
        $label = Label::factory()->create(['project_id' => $this->proProject->id]);
        $task->labels()->attach($label->id);

        $this->actingAs($this->proUser)
            ->postJson("/projects/{$this->proProject->id}/tasks/{$task->id}/labels/detach", [
                'label_id' => $label->id,
            ])
            ->assertOk();

        expect($task->fresh()->labels)->toHaveCount(0);
    });

    it('ignores labels from other projects when syncing', function () {
        $list = TaskList::factory()->create(['project_id' => $this->proProject->id]);
        $task = Task::factory()->create([
            'project_id' => $this->proProject->id,
            'list_id' => $list->id,
        ]);
        $validLabel = Label::factory()->create(['project_id' => $this->proProject->id]);
        $otherProjectLabel = Label::factory()->create(); // Different project

        $this->actingAs($this->proUser)
            ->putJson("/projects/{$this->proProject->id}/tasks/{$task->id}/labels", [
                'label_ids' => [$validLabel->id, $otherProjectLabel->id],
            ])
            ->assertOk();

        // Only the valid label should be attached
        expect($task->fresh()->labels)->toHaveCount(1);
        expect($task->fresh()->labels->first()->id)->toBe($validLabel->id);
    });

    it('can clear all labels from a task', function () {
        $list = TaskList::factory()->create(['project_id' => $this->proProject->id]);
        $task = Task::factory()->create([
            'project_id' => $this->proProject->id,
            'list_id' => $list->id,
        ]);
        $labels = Label::factory()->count(3)->create(['project_id' => $this->proProject->id]);
        $task->labels()->attach($labels->pluck('id'));

        $this->actingAs($this->proUser)
            ->putJson("/projects/{$this->proProject->id}/tasks/{$task->id}/labels", [
                'label_ids' => [],
            ])
            ->assertOk();

        expect($task->fresh()->labels)->toHaveCount(0);
    });
});
