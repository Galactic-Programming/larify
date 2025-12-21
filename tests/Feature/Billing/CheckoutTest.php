<?php

use App\Models\Plan;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->withoutTwoFactor()->create();
});

// === CHECKOUT ACCESS ===

test('guest cannot access checkout', function () {
    $plan = Plan::factory()->proMonthly()->create();

    $this->get(route('billing.checkout', $plan->stripe_id))
        ->assertRedirect(route('login'));
});

test('checkout fails for non-existent plan', function () {
    $this->actingAs($this->user)
        ->get(route('billing.checkout', 'non_existent_plan'))
        ->assertSessionHasErrors('plan_id');
});

test('checkout fails for inactive plan', function () {
    $plan = Plan::factory()->proMonthly()->inactive()->create();

    $this->actingAs($this->user)
        ->get(route('billing.checkout', $plan->stripe_id))
        ->assertSessionHasErrors('plan_id');
});

// === PORTAL ACCESS ===

test('guest cannot access billing portal', function () {
    $this->get(route('billing.portal'))
        ->assertRedirect(route('login'));
});

// Note: Actual Stripe checkout and portal redirection tests require Stripe test keys
// and are better tested with browser/integration tests or mocked Stripe API calls.
