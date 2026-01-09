<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Fix plans with placeholder stripe_ids by updating them with real Stripe Price IDs from environment.
     */
    public function up(): void
    {
        // Update Pro Monthly plan
        $proMonthlyStripeId = env('STRIPE_PRICE_PRO_MONTHLY');
        $proYearlyStripeId = env('STRIPE_PRICE_PRO_YEARLY');
        $proProductId = env('STRIPE_PRODUCT_PRO');

        if ($proMonthlyStripeId && $proMonthlyStripeId !== 'price_pro_monthly') {
            DB::table('plans')
                ->where('name', 'Pro')
                ->where('interval', 'month')
                ->update([
                    'stripe_id' => $proMonthlyStripeId,
                    'stripe_product' => $proProductId ?? 'prod_pro',
                ]);
        }

        if ($proYearlyStripeId && $proYearlyStripeId !== 'price_pro_yearly') {
            DB::table('plans')
                ->where('name', 'Pro')
                ->where('interval', 'year')
                ->update([
                    'stripe_id' => $proYearlyStripeId,
                    'stripe_product' => $proProductId ?? 'prod_pro',
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot safely reverse - would need to know original values
    }
};
