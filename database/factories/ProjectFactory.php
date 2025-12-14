<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6'];
        $icons = ['folder-kanban', 'folder', 'briefcase', 'code', 'rocket', 'target', 'lightbulb', 'users', 'globe', 'layers', 'package', 'database'];

        return [
            'user_id' => User::factory(),
            'name' => fake()->words(rand(2, 4), true),
            'description' => fake()->optional(0.7)->sentence(),
            'color' => fake()->randomElement($colors),
            'icon' => fake()->randomElement($icons),
            'is_archived' => false,
        ];
    }

    /**
     * Indicate that the project is archived.
     */
    public function archived(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_archived' => true,
        ]);
    }
}
