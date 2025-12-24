<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\TaskList;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TaskList>
 */
class TaskListFactory extends Factory
{
    protected $model = TaskList::class;

    // Common Kanban list names
    private const LIST_NAMES = [
        'Backlog',
        'To Do',
        'In Progress',
        'In Review',
        'Review',
        'Testing',
        'QA',
        'Done',
        'Completed',
        'Blocked',
        'On Hold',
        'Ready for Deploy',
    ];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        static $position = 0;

        return [
            'project_id' => Project::factory(),
            'name' => fake()->randomElement(self::LIST_NAMES),
            'position' => $position++,
            'is_done_list' => false,
        ];
    }

    /**
     * Create a "To Do" list.
     */
    public function toDo(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'To Do',
            'is_done_list' => false,
        ]);
    }

    /**
     * Create an "In Progress" list.
     */
    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'In Progress',
            'is_done_list' => false,
        ]);
    }

    /**
     * Create a "Review" list.
     */
    public function review(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Review',
            'is_done_list' => false,
        ]);
    }

    /**
     * Create a "Done" list.
     */
    public function done(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Done',
            'is_done_list' => true,
        ]);
    }

    /**
     * Reset position counter (useful for seeding multiple projects).
     */
    public function resetPosition(): static
    {
        return $this->afterMaking(function () {
            // Position will be set in sequence
        });
    }
}
