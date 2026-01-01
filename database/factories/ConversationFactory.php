<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Conversation>
 */
class ConversationFactory extends Factory
{
    protected $model = Conversation::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'last_message_at' => null,
        ];
    }

    /**
     * Indicate that the conversation has recent activity.
     */
    public function withRecentActivity(): static
    {
        return $this->state(fn (array $attributes) => [
            'last_message_at' => now(),
        ]);
    }
}
