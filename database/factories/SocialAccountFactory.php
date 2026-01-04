<?php

namespace Database\Factories;

use App\Enums\SocialProvider;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SocialAccount>
 */
class SocialAccountFactory extends Factory
{
    protected $model = SocialAccount::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'provider' => fake()->randomElement(SocialProvider::cases()),
            'provider_id' => (string) fake()->unique()->numberBetween(100000000, 999999999),
            'token' => fake()->sha256(),
            'refresh_token' => fake()->optional(0.5)->sha256(),
            'expires_at' => fake()->optional(0.7)->dateTimeBetween('now', '+30 days'),
            'avatar' => fake()->optional(0.8)->imageUrl(200, 200, 'people'),
        ];
    }

    /**
     * Set the provider to Google.
     */
    public function google(): static
    {
        return $this->state(fn (array $attributes) => [
            'provider' => SocialProvider::Google,
            'avatar' => 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        ]);
    }

    /**
     * Set the provider to GitHub.
     */
    public function github(): static
    {
        return $this->state(fn (array $attributes) => [
            'provider' => SocialProvider::Github,
            'avatar' => 'https://avatars.githubusercontent.com/u/'.fake()->numberBetween(1000, 999999),
        ]);
    }

    /**
     * Set an expired token.
     */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => fake()->dateTimeBetween('-30 days', '-1 day'),
        ]);
    }

    /**
     * Set a token that never expires.
     */
    public function neverExpires(): static
    {
        return $this->state(fn (array $attributes) => [
            'expires_at' => null,
        ]);
    }

    /**
     * Create a social account for a specific user.
     */
    public function forUser(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }
}
