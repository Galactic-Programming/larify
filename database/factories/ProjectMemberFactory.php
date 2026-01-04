<?php

namespace Database\Factories;

use App\Enums\ProjectRole;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProjectMember>
 */
class ProjectMemberFactory extends Factory
{
    protected $model = ProjectMember::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'user_id' => User::factory(),
            'role' => ProjectRole::Editor,
            'joined_at' => now(),
        ];
    }

    /**
     * Set the member as an editor.
     */
    public function editor(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => ProjectRole::Editor,
        ]);
    }

    /**
     * Set the member as a viewer.
     */
    public function viewer(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => ProjectRole::Viewer,
        ]);
    }

    /**
     * Set a specific joined date.
     */
    public function joinedAt(\DateTimeInterface|string $date): static
    {
        return $this->state(fn (array $attributes) => [
            'joined_at' => $date,
        ]);
    }

    /**
     * Set a random joined date within the past month.
     */
    public function recentlyJoined(): static
    {
        return $this->state(fn (array $attributes) => [
            'joined_at' => fake()->dateTimeBetween('-30 days', 'now'),
        ]);
    }

    /**
     * Create a member for a specific project.
     */
    public function forProject(Project $project): static
    {
        return $this->state(fn (array $attributes) => [
            'project_id' => $project->id,
        ]);
    }

    /**
     * Create a member for a specific user.
     */
    public function forUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }
}
