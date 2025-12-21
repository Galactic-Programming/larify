<?php

namespace App\Http\Controllers\Billing;

use App\Models\Plan;
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

        // Add any custom business logic here
        // e.g., send welcome email, update user plan enum, etc.
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

        // Add any custom business logic here
        // e.g., send cancellation email, downgrade user, etc.
    }

    /**
     * Handle invoice payment succeeded.
     */
    protected function handleInvoicePaymentSucceeded(array $payload): void
    {
        parent::handleInvoicePaymentSucceeded($payload);

        $invoice = $payload['data']['object'];

        Log::info('Invoice payment succeeded.', [
            'invoice_id' => $invoice['id'],
            'customer_id' => $invoice['customer'],
            'amount_paid' => $invoice['amount_paid'],
        ]);
    }

    /**
     * Handle invoice payment failed.
     */
    protected function handleInvoicePaymentFailed(array $payload): void
    {
        parent::handleInvoicePaymentFailed($payload);

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
        if (!($price['active'] ?? true)) {
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
