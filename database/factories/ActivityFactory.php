<?php

namespace Database\Factories;

use App\Enums\ActivityType;
use App\Models\Activity;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskList;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Activity>
 */
class ActivityFactory extends Factory
{
    protected $model = Activity::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = fake()->randomElement(ActivityType::cases());

        return [
            'user_id' => User::factory(),
            'project_id' => Project::factory(),
            'subject_type' => null,
            'subject_id' => null,
            'type' => $type,
            'description' => $type->label(),
            'properties' => null,
        ];
    }

    /**
     * Activity for task creation.
     */
    public function taskCreated(Task $task): static
    {
        return $this->state(fn (array $attributes) => [
            'project_id' => $task->project_id,
            'subject_type' => Task::class,
            'subject_id' => $task->id,
            'type' => ActivityType::TaskCreated,
            'description' => 'created a task',
            'properties' => [
                'task_title' => $task->title,
            ],
        ]);
    }

    /**
     * Activity for task completion.
     */
    public function taskCompleted(Task $task): static
    {
        return $this->state(fn (array $attributes) => [
            'project_id' => $task->project_id,
            'subject_type' => Task::class,
            'subject_id' => $task->id,
            'type' => ActivityType::TaskCompleted,
            'description' => 'completed a task',
            'properties' => [
                'task_title' => $task->title,
            ],
        ]);
    }

    /**
     * Activity for task assignment.
     */
    public function taskAssigned(Task $task, User $assignee): static
    {
        return $this->state(fn (array $attributes) => [
            'project_id' => $task->project_id,
            'subject_type' => Task::class,
            'subject_id' => $task->id,
            'type' => ActivityType::TaskAssigned,
            'description' => 'assigned a task',
            'properties' => [
                'task_title' => $task->title,
                'assignee_id' => $assignee->id,
                'assignee_name' => $assignee->name,
            ],
        ]);
    }

    /**
     * Activity for task move.
     */
    public function taskMoved(Task $task, TaskList $fromList, TaskList $toList): static
    {
        return $this->state(fn (array $attributes) => [
            'project_id' => $task->project_id,
            'subject_type' => Task::class,
            'subject_id' => $task->id,
            'type' => ActivityType::TaskMoved,
            'description' => 'moved a task',
            'properties' => [
                'task_title' => $task->title,
                'from_list' => $fromList->name,
                'to_list' => $toList->name,
            ],
        ]);
    }

    /**
     * Activity for list creation.
     */
    public function listCreated(TaskList $list): static
    {
        return $this->state(fn (array $attributes) => [
            'project_id' => $list->project_id,
            'subject_type' => TaskList::class,
            'subject_id' => $list->id,
            'type' => ActivityType::ListCreated,
            'description' => 'created a list',
            'properties' => [
                'list_name' => $list->name,
            ],
        ]);
    }

    /**
     * Activity for member addition.
     */
    public function memberAdded(Project $project, User $member): static
    {
        return $this->state(fn (array $attributes) => [
            'project_id' => $project->id,
            'subject_type' => User::class,
            'subject_id' => $member->id,
            'type' => ActivityType::MemberAdded,
            'description' => 'added a member',
            'properties' => [
                'member_id' => $member->id,
                'member_name' => $member->name,
            ],
        ]);
    }

    /**
     * Activity for project creation.
     */
    public function projectCreated(Project $project): static
    {
        return $this->state(fn (array $attributes) => [
            'project_id' => $project->id,
            'subject_type' => Project::class,
            'subject_id' => $project->id,
            'type' => ActivityType::ProjectCreated,
            'description' => 'created the project',
            'properties' => [
                'project_name' => $project->name,
            ],
        ]);
    }

    /**
     * Activity performed by a specific user.
     */
    public function byUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }

    /**
     * Activity for a specific project.
     */
    public function forProject(Project $project): static
    {
        return $this->state(fn (array $attributes) => [
            'project_id' => $project->id,
        ]);
    }

    /**
     * Activity with specific timestamp.
     */
    public function at(\DateTimeInterface|string $datetime): static
    {
        return $this->state(fn (array $attributes) => [
            'created_at' => $datetime,
            'updated_at' => $datetime,
        ]);
    }
}
