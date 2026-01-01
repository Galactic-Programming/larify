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
                'Unlimited projects',
                'Unlimited lists per project',
                'Full activity history',
                'Full color & icon palette',
                'Team collaboration',
                'In-app chat',
                'Real-time updates',
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
            'interval_count' => 1,
            'features' => [
                'Up to 3 projects',
                'Up to 5 lists per project',
                '7 days activity history',
                'Basic color & icon palette',
                'Task priorities & due dates',
                'In-app chat',
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
            'interval_count' => 1,
            'features' => [
                'Unlimited projects',
                'Unlimited lists per project',
                'Full activity history',
                'Full color & icon palette',
                'Team collaboration',
                'In-app chat',
                'Real-time updates',
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
            'interval_count' => 1,
            'features' => [
                'Unlimited projects',
                'Unlimited lists per project',
                'Full activity history',
                'Full color & icon palette',
                'Team collaboration',
                'In-app chat',
                'Real-time updates',
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
