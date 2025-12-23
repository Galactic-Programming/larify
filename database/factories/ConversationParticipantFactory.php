<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ConversationParticipant>
 */
class ConversationParticipantFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'conversation_id' => fn () => \App\Models\Conversation::factory(),
            'user_id' => fn () => \App\Models\User::factory(),
            'role' => fake()->randomElement(['owner', 'member']),
            'nickname' => fake()->optional()->firstName(),
            'last_read_at' => fake()->optional()->dateTimeBetween('-1 week', 'now'),
            'notifications_muted' => fake()->boolean(20),
            'joined_at' => fake()->dateTimeBetween('-2 weeks', '-1 day'),
            'left_at' => null,
        ];
    }
}
