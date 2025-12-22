<?php

use App\Enums\UserPlan;
use App\Http\Controllers\Billing\WebhookController;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create([
        'plan' => UserPlan::Free,
        'stripe_id' => 'cus_test123',
    ]);
});

// === SUBSCRIPTION CREATED ===

test('user plan is upgraded to pro when subscription is created with active status', function () {
    expect($this->user->plan)->toBe(UserPlan::Free);

    $payload = createSubscriptionPayload($this->user->stripe_id, 'active');

    $controller = new WebhookController;
    callProtectedMethod($controller, 'handleCustomerSubscriptionCreated', [$payload]);

    $this->user->refresh();
    expect($this->user->plan)->toBe(UserPlan::Pro);
});

test('user plan is upgraded to pro when subscription is created with trialing status', function () {
    expect($this->user->plan)->toBe(UserPlan::Free);

    $payload = createSubscriptionPayload($this->user->stripe_id, 'trialing');

    $controller = new WebhookController;
    callProtectedMethod($controller, 'handleCustomerSubscriptionCreated', [$payload]);

    $this->user->refresh();
    expect($this->user->plan)->toBe(UserPlan::Pro);
});

test('user plan is not upgraded when subscription is created with incomplete status', function () {
    expect($this->user->plan)->toBe(UserPlan::Free);

    $payload = createSubscriptionPayload($this->user->stripe_id, 'incomplete');

    $controller = new WebhookController;
    callProtectedMethod($controller, 'handleCustomerSubscriptionCreated', [$payload]);

    $this->user->refresh();
    expect($this->user->plan)->toBe(UserPlan::Free);
});

// === SUBSCRIPTION UPDATED ===

test('user plan is upgraded to pro when subscription becomes active', function () {
    expect($this->user->plan)->toBe(UserPlan::Free);

    $payload = createSubscriptionPayload($this->user->stripe_id, 'active');

    $controller = new WebhookController;
    callProtectedMethod($controller, 'handleCustomerSubscriptionUpdated', [$payload]);

    $this->user->refresh();
    expect($this->user->plan)->toBe(UserPlan::Pro);
});

test('user plan is downgraded to free when subscription status becomes past_due', function () {
    $this->user->update(['plan' => UserPlan::Pro]);
    expect($this->user->plan)->toBe(UserPlan::Pro);

    $payload = createSubscriptionPayload($this->user->stripe_id, 'past_due');

    $controller = new WebhookController;
    callProtectedMethod($controller, 'handleCustomerSubscriptionUpdated', [$payload]);

    $this->user->refresh();
    expect($this->user->plan)->toBe(UserPlan::Free);
});

test('user plan is downgraded to free when subscription status becomes canceled', function () {
    $this->user->update(['plan' => UserPlan::Pro]);
    expect($this->user->plan)->toBe(UserPlan::Pro);

    $payload = createSubscriptionPayload($this->user->stripe_id, 'canceled');

    $controller = new WebhookController;
    callProtectedMethod($controller, 'handleCustomerSubscriptionUpdated', [$payload]);

    $this->user->refresh();
    expect($this->user->plan)->toBe(UserPlan::Free);
});

// === SUBSCRIPTION DELETED ===

test('user plan is downgraded to free when subscription is deleted', function () {
    $this->user->update(['plan' => UserPlan::Pro]);
    expect($this->user->plan)->toBe(UserPlan::Pro);

    $payload = createSubscriptionPayload($this->user->stripe_id, 'canceled');

    $controller = new WebhookController;
    callProtectedMethod($controller, 'handleCustomerSubscriptionDeleted', [$payload]);

    $this->user->refresh();
    expect($this->user->plan)->toBe(UserPlan::Free);
});

// === EDGE CASES ===

test('no error occurs when updating plan for non-existent stripe customer', function () {
    $payload = createSubscriptionPayload('cus_nonexistent', 'active');

    $controller = new WebhookController;
    callProtectedMethod($controller, 'handleCustomerSubscriptionCreated', [$payload]);

    // Should not throw exception, user plan should remain unchanged
    $this->user->refresh();
    expect($this->user->plan)->toBe(UserPlan::Free);
});

// === HELPER FUNCTIONS ===

function createSubscriptionPayload(string $customerId, string $status): array
{
    return [
        'data' => [
            'object' => [
                'id' => 'sub_test123',
                'customer' => $customerId,
                'status' => $status,
                'current_period_start' => time(),
                'current_period_end' => time() + 2592000, // 30 days
                'items' => [
                    'data' => [
                        [
                            'id' => 'si_test123',
                            'quantity' => 1,
                            'price' => [
                                'id' => 'price_test123',
                                'product' => 'prod_test123',
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ];
}
