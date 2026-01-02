<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TaskComment>
 */
class TaskCommentFactory extends Factory
{
    protected $model = TaskComment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'task_id' => Task::factory(),
            'user_id' => User::factory(),
            'parent_id' => null,
            'content' => fake()->paragraph(),
            'is_edited' => false,
            'edited_at' => null,
        ];
    }

    /**
     * Indicate that the comment is edited.
     */
    public function edited(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_edited' => true,
            'edited_at' => now(),
        ]);
    }

    /**
     * Indicate that this is a reply to another comment.
     */
    public function reply(TaskComment $parent): static
    {
        return $this->state(fn (array $attributes) => [
            'task_id' => $parent->task_id,
            'parent_id' => $parent->id,
        ]);
    }

    /**
     * Create a comment for a specific task.
     */
    public function forTask(Task $task): static
    {
        return $this->state(fn (array $attributes) => [
            'task_id' => $task->id,
        ]);
    }

    /**
     * Create a comment by a specific user.
     */
    public function byUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }
}
