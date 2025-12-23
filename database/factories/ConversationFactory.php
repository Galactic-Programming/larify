<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Conversation>
 */
class ConversationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'type' => fake()->randomElement(['direct', 'group']),
            'name' => fn () => fake()->optional()->words(3, true),
            'avatar' => fn () => fake()->optional()->imageUrl(128, 128, 'people'),
            'created_by' => fn () => \App\Models\User::factory(),
            'last_message_at' => fn () => fake()->optional()->dateTimeBetween('-1 week', 'now'),
        ];
    }
}
