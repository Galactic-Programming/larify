<?php

use App\Models\Plan;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
});

// === SUBSCRIPTION CANCEL ===

test('guest cannot cancel subscription', function () {
    $this->post(route('billing.subscription.cancel'))
        ->assertRedirect(route('login'));
});

test('user without subscription cannot cancel', function () {
    $this->actingAs($this->user)
        ->post(route('billing.subscription.cancel'))
        ->assertRedirect()
        ->assertSessionHas('error', 'No active subscription found.');
});

// === SUBSCRIPTION CANCEL NOW ===

test('guest cannot cancel subscription immediately', function () {
    $this->post(route('billing.subscription.cancel-now'))
        ->assertRedirect(route('login'));
});

test('user without subscription cannot cancel immediately', function () {
    $this->actingAs($this->user)
        ->post(route('billing.subscription.cancel-now'))
        ->assertRedirect()
        ->assertSessionHas('error', 'No active subscription found.');
});

// === SUBSCRIPTION RESUME ===

test('guest cannot resume subscription', function () {
    $this->post(route('billing.subscription.resume'))
        ->assertRedirect(route('login'));
});

test('user without subscription cannot resume', function () {
    $this->actingAs($this->user)
        ->post(route('billing.subscription.resume'))
        ->assertRedirect()
        ->assertSessionHas('error', 'No subscription found.');
});

// === SUBSCRIPTION SWAP ===

test('guest cannot swap plan', function () {
    $plan = Plan::factory()->proMonthly()->create();

    $this->post(route('billing.subscription.swap', $plan->stripe_id))
        ->assertRedirect(route('login'));
});

test('user without subscription is redirected to checkout when swapping', function () {
    $plan = Plan::factory()->proMonthly()->create();

    $this->actingAs($this->user)
        ->post(route('billing.subscription.swap', $plan->stripe_id))
        ->assertRedirect(route('billing.checkout', $plan->stripe_id));
});

test('swap fails for non-existent plan', function () {
    $this->actingAs($this->user)
        ->post(route('billing.subscription.swap', 'non_existent_plan'))
        ->assertSessionHasErrors('plan_id');
});

test('swap fails for inactive plan', function () {
    $plan = Plan::factory()->proMonthly()->inactive()->create();

    $this->actingAs($this->user)
        ->post(route('billing.subscription.swap', $plan->stripe_id))
        ->assertSessionHasErrors('plan_id');
});

// === SUBSCRIPTION QUANTITY ===

test('guest cannot update subscription quantity', function () {
    $this->post(route('billing.subscription.quantity'), ['quantity' => 5])
        ->assertRedirect(route('login'));
});

test('user without subscription is forbidden from updating quantity', function () {
    $this->actingAs($this->user)
        ->post(route('billing.subscription.quantity'), ['quantity' => 5])
        ->assertForbidden();
});

// Note: Testing quantity validation with subscribed user requires mocking Stripe subscription
// These are better tested with integration tests or mocked Stripe API

// === SUBSCRIPTION STATUS API ===

test('guest cannot get subscription status', function () {
    $this->getJson(route('api.billing.subscription.status'))
        ->assertUnauthorized();
});

test('user without subscription gets unsubscribed status', function () {
    $this->actingAs($this->user)
        ->getJson(route('api.billing.subscription.status'))
        ->assertOk()
        ->assertJson([
            'subscribed' => false,
            'subscription' => null,
        ]);
});
