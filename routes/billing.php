<?php

use App\Http\Controllers\Billing\BillingController;
use App\Http\Controllers\Billing\CheckoutController;
use App\Http\Controllers\Billing\SubscriptionController;
use App\Http\Controllers\Billing\WebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Billing Routes
|--------------------------------------------------------------------------
|
| Routes for handling Stripe billing, subscriptions, and invoices.
|
*/

// Stripe Webhook (must be outside auth middleware)
Route::post('stripe/webhook', [WebhookController::class, 'handleWebhook'])
    ->name('cashier.webhook');

// Public pricing page
Route::get('pricing', [BillingController::class, 'pricing'])
    ->name('pricing');

// Authenticated billing routes
Route::middleware(['auth', 'verified'])->prefix('billing')->name('billing.')->group(function () {
    // Billing dashboard
    Route::get('/', [BillingController::class, 'index'])
        ->name('index');

    // Plans page
    Route::get('/plans', [BillingController::class, 'plans'])
        ->name('plans');

    // Checkout
    Route::get('/checkout/{plan}', [CheckoutController::class, 'checkout'])
        ->name('checkout');

    Route::get('/success', [CheckoutController::class, 'success'])
        ->name('success');

    Route::get('/cancel', [CheckoutController::class, 'cancel'])
        ->name('cancel');

    // Payment method
    Route::get('/payment-method', [CheckoutController::class, 'updatePaymentMethod'])
        ->name('payment-method');

    // Subscription management
    Route::post('/subscription/cancel', [SubscriptionController::class, 'cancel'])
        ->name('subscription.cancel');

    Route::post('/subscription/cancel-now', [SubscriptionController::class, 'cancelNow'])
        ->name('subscription.cancel-now');

    Route::post('/subscription/resume', [SubscriptionController::class, 'resume'])
        ->name('subscription.resume');

    Route::post('/subscription/swap', [SubscriptionController::class, 'swap'])
        ->name('subscription.swap');

    Route::post('/subscription/quantity', [SubscriptionController::class, 'updateQuantity'])
        ->name('subscription.quantity');

    // Invoices
    Route::get('/invoices', [BillingController::class, 'invoices'])
        ->name('invoices');

    Route::get('/invoices/{invoice}/download', [BillingController::class, 'downloadInvoice'])
        ->name('invoices.download');
});

// API routes for subscription status
Route::middleware(['auth'])->prefix('api/billing')->name('api.billing.')->group(function () {
    Route::get('/subscription/status', [SubscriptionController::class, 'status'])
        ->name('subscription.status');
});
