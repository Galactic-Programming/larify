<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Message>
 */
class MessageFactory extends Factory
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
            'sender_id' => fn () => \App\Models\User::factory(),
            'content' => fake()->realTextBetween(1, 120),
            'parent_id' => null,
            'is_edited' => false,
            'edited_at' => null,
        ];
    }
}
