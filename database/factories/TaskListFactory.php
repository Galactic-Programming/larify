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
            'name' => fake()->randomElement(['To Do', 'In Progress', 'Review', 'Done']),
            'position' => $position++,
        ];
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
