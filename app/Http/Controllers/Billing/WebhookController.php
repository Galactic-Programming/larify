<?php

namespace App\Http\Controllers\Billing;

use App\Enums\UserPlan;
use App\Models\Plan;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Laravel\Cashier\Http\Controllers\WebhookController as CashierWebhookController;
use Stripe\Price;
use Stripe\Product;

class WebhookController extends CashierWebhookController
{
    /**
     * Handle price created event.
     * Automatically sync new Stripe Prices to local plans table.
     */
    protected function handlePriceCreated(array $payload): void
    {
        try {
            $price = $payload['data']['object'];
            $this->syncPriceToLocalPlan($price);

            Log::info('Stripe Price created and synced.', [
                'price_id' => $price['id'],
            ]);
        } catch (\Exception $e) {
            Log::error('Exception while handling price.created webhook from Stripe', [
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle price updated event.
     */
    protected function handlePriceUpdated(array $payload): void
    {
        try {
            $price = $payload['data']['object'];
            $this->syncPriceToLocalPlan($price);

            Log::info('Stripe Price updated and synced.', [
                'price_id' => $price['id'],
            ]);
        } catch (\Exception $e) {
            Log::error('Exception while handling price.updated webhook from Stripe', [
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle price deleted event.
     */
    protected function handlePriceDeleted(array $payload): void
    {
        try {
            $price = $payload['data']['object'];

            Plan::where('stripe_id', $price['id'])->update(['is_active' => false]);

            Log::info('Stripe Price deleted, local plan deactivated.', [
                'price_id' => $price['id'],
            ]);
        } catch (\Exception $e) {
            Log::error('Exception while handling price.deleted webhook from Stripe', [
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle product updated event.
     * Update plan names/descriptions when Stripe Product is updated.
     */
    protected function handleProductUpdated(array $payload): void
    {
        try {
            $product = $payload['data']['object'];

            Plan::where('stripe_product', $product['id'])->update([
                'name' => $product['name'],
                'description' => $product['description'] ?? null,
            ]);

            Log::info('Stripe Product updated, local plans synced.', [
                'product_id' => $product['id'],
            ]);
        } catch (\Exception $e) {
            Log::error('Exception while handling product.updated webhook from Stripe', [
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle customer subscription created.
     */
    protected function handleCustomerSubscriptionCreated(array $payload): void
    {
        parent::handleCustomerSubscriptionCreated($payload);

        $subscription = $payload['data']['object'];

        Log::info('Subscription created.', [
            'subscription_id' => $subscription['id'],
            'customer_id' => $subscription['customer'],
            'status' => $subscription['status'],
        ]);

        // Upgrade user to Pro plan when subscription is active
        if (in_array($subscription['status'], ['active', 'trialing'])) {
            $this->updateUserPlan($subscription['customer'], UserPlan::Pro);
        }
    }

    /**
     * Handle customer subscription updated.
     */
    protected function handleCustomerSubscriptionUpdated(array $payload): void
    {
        parent::handleCustomerSubscriptionUpdated($payload);

        $subscription = $payload['data']['object'];

        Log::info('Subscription updated.', [
            'subscription_id' => $subscription['id'],
            'status' => $subscription['status'],
        ]);

        // Update user plan based on subscription status
        $plan = in_array($subscription['status'], ['active', 'trialing'])
            ? UserPlan::Pro
            : UserPlan::Free;

        $this->updateUserPlan($subscription['customer'], $plan);
    }

    /**
     * Update user plan based on Stripe customer ID.
     */
    protected function updateUserPlan(string $stripeCustomerId, UserPlan $plan): void
    {
        $user = User::where('stripe_id', $stripeCustomerId)->first();

        if (! $user) {
            Log::warning('User not found for Stripe customer.', [
                'stripe_customer_id' => $stripeCustomerId,
            ]);

            return;
        }

        $previousPlan = $user->plan;
        $user->update(['plan' => $plan]);

        Log::info('User plan updated.', [
            'user_id' => $user->id,
            'previous_plan' => $previousPlan?->value ?? 'free',
            'new_plan' => $plan->value,
        ]);
    }

    /**
     * Handle customer subscription deleted (cancelled).
     */
    protected function handleCustomerSubscriptionDeleted(array $payload): void
    {
        parent::handleCustomerSubscriptionDeleted($payload);

        $subscription = $payload['data']['object'];

        Log::info('Subscription cancelled.', [
            'subscription_id' => $subscription['id'],
            'customer_id' => $subscription['customer'],
        ]);

        // Downgrade user to Free plan when subscription is cancelled
        $this->updateUserPlan($subscription['customer'], UserPlan::Free);
    }

    /**
     * Handle invoice payment succeeded.
     * Note: This is a custom handler, not inherited from Cashier.
     */
    protected function handleInvoicePaymentSucceeded(array $payload): void
    {
        $invoice = $payload['data']['object'];

        Log::info('Invoice payment succeeded.', [
            'invoice_id' => $invoice['id'],
            'customer_id' => $invoice['customer'],
            'amount_paid' => $invoice['amount_paid'],
        ]);
    }

    /**
     * Handle invoice payment failed.
     * Note: This is a custom handler, not inherited from Cashier.
     */
    protected function handleInvoicePaymentFailed(array $payload): void
    {
        $invoice = $payload['data']['object'];

        Log::warning('Invoice payment failed.', [
            'invoice_id' => $invoice['id'],
            'customer_id' => $invoice['customer'],
            'attempt_count' => $invoice['attempt_count'] ?? null,
        ]);

        // Add custom logic: send payment failed notification, etc.
    }

    /**
     * Sync a Stripe Price to local plans table.
     */
    protected function syncPriceToLocalPlan(array $price): void
    {
        // Only sync recurring prices (subscriptions)
        if (($price['type'] ?? null) !== 'recurring') {
            return;
        }

        // Only sync active prices
        if (! ($price['active'] ?? true)) {
            Plan::where('stripe_id', $price['id'])->update(['is_active' => false]);

            return;
        }

        $recurring = $price['recurring'] ?? [];
        $interval = $recurring['interval'] ?? 'month';
        $intervalCount = $recurring['interval_count'] ?? 1;

        // Get product info for name/description
        $productId = $price['product'];
        $productName = 'Plan';
        $productDescription = null;

        // Try to get product details from Stripe
        try {
            $product = Product::retrieve($productId);
            $productName = $product->name ?? 'Plan';
            $productDescription = $product->description;
        } catch (\Exception $e) {
            Log::warning('Could not retrieve Stripe product', [
                'product_id' => $productId,
                'error' => $e->getMessage(),
            ]);
        }

        Plan::updateOrCreate(
            ['stripe_id' => $price['id']],
            [
                'stripe_product' => $productId,
                'name' => $productName,
                'description' => $productDescription,
                'price' => $price['unit_amount'] ?? 0,
                'currency' => $price['currency'] ?? 'usd',
                'interval' => $interval,
                'interval_count' => $intervalCount,
                'is_active' => $price['active'] ?? true,
            ]
        );
    }
}
