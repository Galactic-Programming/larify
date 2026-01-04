<?php

namespace Database\Factories;

use App\Models\Message;
use App\Models\MessageMention;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MessageMention>
 */
class MessageMentionFactory extends Factory
{
    protected $model = MessageMention::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'message_id' => Message::factory(),
            'user_id' => User::factory(),
        ];
    }

    /**
     * Create a mention for a specific message.
     */
    public function forMessage(Message $message): static
    {
        return $this->state(fn (array $attributes) => [
            'message_id' => $message->id,
        ]);
    }

    /**
     * Create a mention for a specific user.
     */
    public function forUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }
}
