<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Plan>
 */
class PlanFactory extends Factory
{
    protected $model = Plan::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'stripe_id' => 'price_'.fake()->unique()->regexify('[A-Za-z0-9]{24}'),
            'stripe_product' => 'prod_'.fake()->regexify('[A-Za-z0-9]{14}'),
            'name' => 'Pro',
            'description' => 'For teams and professionals',
            'price' => 999,
            'currency' => 'usd',
            'interval' => 'month',
            'interval_count' => 1,
            'features' => [
                'Everything in Free',
                'Team collaboration',
                'Invite unlimited members',
                'Real-time updates',
                'In-app chat (coming soon)',
                'AI assistant (coming soon)',
                'Priority support',
            ],
            'is_active' => true,
            'sort_order' => 1,
        ];
    }

    /**
     * Free plan - Solo user, no team collaboration.
     */
    public function free(): static
    {
        return $this->state(fn (array $attributes) => [
            'stripe_id' => 'price_free',
            'stripe_product' => 'prod_free',
            'name' => 'Free',
            'description' => 'Perfect for personal use',
            'price' => 0,
            'interval' => 'month',
            'features' => [
                'Unlimited projects',
                'Unlimited tasks',
                'Task priorities & due dates',
                'Activity history',
                'Email notifications',
                'Personal use only',
            ],
            'sort_order' => 0,
        ]);
    }

    /**
     * Pro Monthly plan - Team collaboration + Premium features.
     */
    public function proMonthly(): static
    {
        return $this->state(fn (array $attributes) => [
            'stripe_id' => 'price_pro_monthly',
            'stripe_product' => 'prod_pro',
            'name' => 'Pro',
            'description' => 'For teams and professionals',
            'price' => 999,
            'interval' => 'month',
            'features' => [
                'Everything in Free',
                'Team collaboration',
                'Invite unlimited members',
                'Real-time updates',
                'In-app chat (coming soon)',
                'AI assistant (coming soon)',
                'Priority support',
            ],
            'sort_order' => 1,
        ]);
    }

    /**
     * Pro Yearly plan - Same features, better price (~17% savings).
     */
    public function proYearly(): static
    {
        return $this->state(fn (array $attributes) => [
            'stripe_id' => 'price_pro_yearly',
            'stripe_product' => 'prod_pro',
            'name' => 'Pro',
            'description' => 'For teams and professionals',
            'price' => 9990,
            'interval' => 'year',
            'features' => [
                'Everything in Free',
                'Team collaboration',
                'Invite unlimited members',
                'Real-time updates',
                'In-app chat (coming soon)',
                'AI assistant (coming soon)',
                'Priority support',
            ],
            'sort_order' => 1,
        ]);
    }

    /**
     * Indicate that the plan is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
