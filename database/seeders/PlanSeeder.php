<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Seed example plans. In production, these should match your Stripe Products/Prices.
     */
    public function run(): void
    {
        $plans = [
            // Free plan - Solo user, no team collaboration
            [
                'stripe_id' => 'price_free',
                'stripe_product' => 'prod_free',
                'name' => 'Free',
                'description' => 'Perfect for personal use',
                'price' => 0,
                'currency' => 'usd',
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
                'is_active' => true,
                'sort_order' => 0,
            ],
            // Pro Monthly - Team collaboration + Premium features
            [
                'stripe_id' => config('cashier.plans.pro.monthly', 'price_pro_monthly'),
                'stripe_product' => config('cashier.plans.pro.product', 'prod_pro'),
                'name' => 'Pro',
                'description' => 'For teams and professionals',
                'price' => 999, // $9.99 in cents
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
            ],
            // Pro Yearly - Same features, better price
            [
                'stripe_id' => config('cashier.plans.pro.yearly', 'price_pro_yearly'),
                'stripe_product' => config('cashier.plans.pro.product', 'prod_pro'),
                'name' => 'Pro',
                'description' => 'For teams and professionals',
                'price' => 9990, // $99.90 in cents (save ~17%)
                'currency' => 'usd',
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
                'is_active' => true,
                'sort_order' => 1,
            ],
        ];

        foreach ($plans as $plan) {
            // Use name + interval as unique key to allow stripe_id updates via env vars
            Plan::updateOrCreate(
                [
                    'name' => $plan['name'],
                    'interval' => $plan['interval'],
                ],
                $plan
            );
        }
    }
}
