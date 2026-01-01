<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Message>
 */
class MessageFactory extends Factory
{
    protected $model = Message::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'conversation_id' => Conversation::factory(),
            'sender_id' => User::factory(),
            'content' => fake()->paragraph(),
            'is_edited' => false,
            'edited_at' => null,
        ];
    }

    /**
     * Indicate that the message has been edited.
     */
    public function edited(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_edited' => true,
            'edited_at' => now(),
        ]);
    }

    /**
     * Indicate that the message is a reply to another message.
     */
    public function reply(Message $parent): static
    {
        return $this->state(fn (array $attributes) => [
            'parent_id' => $parent->id,
            'conversation_id' => $parent->conversation_id,
        ]);
    }
}
