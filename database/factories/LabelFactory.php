<?php

namespace Database\Factories;

use App\Models\Label;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Label>
 */
class LabelFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $colorKeys = array_keys(Label::COLORS);

        return [
            'project_id' => Project::factory(),
            'name' => fake()->unique()->randomElement([
                'Bug', 'Feature', 'Enhancement', 'Documentation',
                'Help Wanted', 'Question', 'Urgent', 'Low Priority',
                'In Progress', 'Review', 'Blocked', 'Done',
            ]),
            'color' => fake()->randomElement($colorKeys),
        ];
    }

    /**
     * Create a label with a free-tier color.
     */
    public function freeColor(): static
    {
        return $this->state(fn (array $attributes) => [
            'color' => fake()->randomElement(Label::FREE_COLORS),
        ]);
    }

    /**
     * Create a label with a pro-tier color.
     */
    public function proColor(): static
    {
        $proColors = array_diff(array_keys(Label::COLORS), Label::FREE_COLORS);

        return $this->state(fn (array $attributes) => [
            'color' => fake()->randomElement($proColors),
        ]);
    }
}
