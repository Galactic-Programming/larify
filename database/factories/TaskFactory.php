<?php

namespace Database\Factories;

use App\Enums\TaskPriority;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskList;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'list_id' => TaskList::factory(),
            'title' => fake()->sentence(rand(3, 8)),
            'description' => fake()->optional(0.5)->paragraph(),
            'position' => fake()->numberBetween(0, 100),
            'priority' => fake()->randomElement(TaskPriority::cases()),
            'due_date' => fake()->optional(0.6)->dateTimeBetween('now', '+30 days'),
            'due_time' => fake()->optional(0.3)->time('H:i:s'),
            'started_at' => null,
            'completed_at' => null,
        ];
    }

    /**
     * Indicate that the task is in progress.
     */
    public function inProgress(): static
    {
        return $this->state(fn(array $attributes) => [
            'started_at' => fake()->dateTimeBetween('-7 days', 'now'),
            'completed_at' => null,
        ]);
    }

    /**
     * Indicate that the task is completed.
     */
    public function completed(): static
    {
        $startedAt = fake()->dateTimeBetween('-14 days', '-1 day');

        return $this->state(fn(array $attributes) => [
            'started_at' => $startedAt,
            'completed_at' => fake()->dateTimeBetween($startedAt, 'now'),
        ]);
    }

    /**
     * Indicate that the task has high priority.
     */
    public function highPriority(): static
    {
        return $this->state(fn(array $attributes) => [
            'priority' => TaskPriority::High,
        ]);
    }

    /**
     * Indicate that the task is urgent.
     */
    public function urgent(): static
    {
        return $this->state(fn(array $attributes) => [
            'priority' => TaskPriority::Urgent,
            'due_date' => fake()->dateTimeBetween('now', '+3 days'),
        ]);
    }
}
