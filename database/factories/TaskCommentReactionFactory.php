<?php

namespace Database\Factories;

use App\Models\TaskComment;
use App\Models\TaskCommentReaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TaskCommentReaction>
 */
class TaskCommentReactionFactory extends Factory
{
    protected $model = TaskCommentReaction::class;

    /**
     * Common reaction emojis used in project management.
     */
    private const EMOJIS = [
        '👍', '👎', '❤️', '🎉', '😄', '😕', '🚀', '👀',
        '✅', '❌', '🔥', '💯', '👏', '🙌', '💪', '🤔',
    ];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'task_comment_id' => TaskComment::factory(),
            'user_id' => User::factory(),
            'emoji' => fake()->randomElement(self::EMOJIS),
        ];
    }

    /**
     * Set a specific emoji.
     */
    public function emoji(string $emoji): static
    {
        return $this->state(fn (array $attributes) => [
            'emoji' => $emoji,
        ]);
    }

    /**
     * Set a thumbs up reaction.
     */
    public function thumbsUp(): static
    {
        return $this->emoji('👍');
    }

    /**
     * Set a heart reaction.
     */
    public function heart(): static
    {
        return $this->emoji('❤️');
    }

    /**
     * Set a celebration reaction.
     */
    public function celebration(): static
    {
        return $this->emoji('🎉');
    }

    /**
     * Set a check reaction.
     */
    public function check(): static
    {
        return $this->emoji('✅');
    }

    /**
     * Create a reaction for a specific comment.
     */
    public function forComment(TaskComment $comment): static
    {
        return $this->state(fn (array $attributes) => [
            'task_comment_id' => $comment->id,
        ]);
    }

    /**
     * Create a reaction by a specific user.
     */
    public function byUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }
}
