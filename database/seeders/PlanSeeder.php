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
            // Free plan (no Stripe integration needed)
            [
                'stripe_id' => 'price_free',
                'stripe_product' => 'prod_free',
                'name' => 'Free',
                'description' => 'Perfect for getting started',
                'price' => 0,
                'currency' => 'usd',
                'interval' => 'month',
                'interval_count' => 1,
                'features' => [
                    'Up to 3 projects',
                    'Basic task management',
                    'Email support',
                ],
                'is_active' => true,
                'sort_order' => 0,
            ],
            // Pro Monthly
            [
                'stripe_id' => 'price_pro_monthly', // Replace with actual Stripe Price ID
                'stripe_product' => 'prod_pro', // Replace with actual Stripe Product ID
                'name' => 'Pro',
                'description' => 'For professionals and small teams',
                'price' => 999, // $9.99 in cents
                'currency' => 'usd',
                'interval' => 'month',
                'interval_count' => 1,
                'features' => [
                    'Unlimited projects',
                    'Advanced task management',
                    'Team collaboration',
                    'Priority support',
                    'Custom integrations',
                ],
                'is_active' => true,
                'sort_order' => 1,
            ],
            // Pro Yearly
            [
                'stripe_id' => 'price_pro_yearly', // Replace with actual Stripe Price ID
                'stripe_product' => 'prod_pro', // Replace with actual Stripe Product ID
                'name' => 'Pro',
                'description' => 'For professionals and small teams',
                'price' => 9990, // $99.90 in cents (save ~17%)
                'currency' => 'usd',
                'interval' => 'year',
                'interval_count' => 1,
                'features' => [
                    'Unlimited projects',
                    'Advanced task management',
                    'Team collaboration',
                    'Priority support',
                    'Custom integrations',
                ],
                'is_active' => true,
                'sort_order' => 1,
            ],
            // Enterprise Monthly
            [
                'stripe_id' => 'price_enterprise_monthly', // Replace with actual Stripe Price ID
                'stripe_product' => 'prod_enterprise', // Replace with actual Stripe Product ID
                'name' => 'Enterprise',
                'description' => 'For large organizations',
                'price' => 2999, // $29.99 in cents
                'currency' => 'usd',
                'interval' => 'month',
                'interval_count' => 1,
                'features' => [
                    'Everything in Pro',
                    'Unlimited team members',
                    'Advanced analytics',
                    'SSO integration',
                    'Dedicated support',
                    'Custom contracts',
                ],
                'is_active' => true,
                'sort_order' => 2,
            ],
            // Enterprise Yearly
            [
                'stripe_id' => 'price_enterprise_yearly', // Replace with actual Stripe Price ID
                'stripe_product' => 'prod_enterprise', // Replace with actual Stripe Product ID
                'name' => 'Enterprise',
                'description' => 'For large organizations',
                'price' => 29990, // $299.90 in cents (save ~17%)
                'currency' => 'usd',
                'interval' => 'year',
                'interval_count' => 1,
                'features' => [
                    'Everything in Pro',
                    'Unlimited team members',
                    'Advanced analytics',
                    'SSO integration',
                    'Dedicated support',
                    'Custom contracts',
                ],
                'is_active' => true,
                'sort_order' => 2,
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
