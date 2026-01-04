<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ConversationParticipant>
 */
class ConversationParticipantFactory extends Factory
{
    protected $model = ConversationParticipant::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'conversation_id' => Conversation::factory(),
            'user_id' => User::factory(),
            'last_read_at' => null,
            'notifications_muted' => false,
        ];
    }

    /**
     * Set the participant as having read all messages.
     */
    public function read(): static
    {
        return $this->state(fn (array $attributes) => [
            'last_read_at' => now(),
        ]);
    }

    /**
     * Set the participant as having unread messages.
     */
    public function unread(): static
    {
        return $this->state(fn (array $attributes) => [
            'last_read_at' => fake()->dateTimeBetween('-7 days', '-1 day'),
        ]);
    }

    /**
     * Set notifications as muted.
     */
    public function muted(): static
    {
        return $this->state(fn (array $attributes) => [
            'notifications_muted' => true,
        ]);
    }

    /**
     * Create a participant for a specific conversation.
     */
    public function forConversation(Conversation $conversation): static
    {
        return $this->state(fn (array $attributes) => [
            'conversation_id' => $conversation->id,
        ]);
    }

    /**
     * Create a participant for a specific user.
     */
    public function forUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }
}
