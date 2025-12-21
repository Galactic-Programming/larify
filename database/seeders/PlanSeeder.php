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
                    'Unlimited projects',
                    'Unlimited tasks',
                    'Task priorities & due dates',
                    'Activity history',
                    'Email notifications',
                    'Personal use only',
                ],
                'is_active' => true,
                'sort_order' => 0,
            ],
            // Pro Monthly - Team collaboration + Premium features
            [
                'stripe_id' => env('STRIPE_PRICE_PRO_MONTHLY', 'price_pro_monthly'),
                'stripe_product' => env('STRIPE_PRODUCT_PRO', 'prod_pro'),
                'name' => 'Pro',
                'description' => 'For teams and professionals',
                'price' => 999, // $9.99 in cents
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
            ],
            // Pro Yearly - Same features, better price
            [
                'stripe_id' => env('STRIPE_PRICE_PRO_YEARLY', 'price_pro_yearly'),
                'stripe_product' => env('STRIPE_PRODUCT_PRO', 'prod_pro'),
                'name' => 'Pro',
                'description' => 'For teams and professionals',
                'price' => 9990, // $99.90 in cents (save ~17%)
                'currency' => 'usd',
                'interval' => 'year',
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
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(
                ['stripe_id' => $plan['stripe_id']],
                $plan
            );
        }
    }
}
