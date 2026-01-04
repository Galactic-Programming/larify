<?php

namespace Database\Factories;

use App\Models\TaskComment;
use App\Models\TaskCommentMention;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TaskCommentMention>
 */
class TaskCommentMentionFactory extends Factory
{
    protected $model = TaskCommentMention::class;

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
        ];
    }

    /**
     * Create a mention for a specific comment.
     */
    public function forComment(TaskComment $comment): static
    {
        return $this->state(fn (array $attributes) => [
            'task_comment_id' => $comment->id,
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
