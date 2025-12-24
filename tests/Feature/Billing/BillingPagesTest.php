<?php

use App\Models\Plan;
use App\Models\User;

beforeEach(function () {
    $this->withoutVite();
    $this->user = User::factory()->withoutTwoFactor()->create();
});

// === BILLING PAGES ACCESS ===

test('guest cannot access billing pages', function () {
    $this->get(route('billing.index'))
        ->assertRedirect(route('login'));

    $this->get(route('billing.plans'))
        ->assertRedirect(route('login'));

    $this->get(route('billing.invoices'))
        ->assertRedirect(route('login'));
});

test('authenticated user can access billing index', function () {
    $this->actingAs($this->user)
        ->get(route('billing.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('billing/index')
            ->has('plans')
            ->has('isSubscribed')
        );
});

test('billing plans route redirects to billing index', function () {
    $this->actingAs($this->user)
        ->get(route('billing.plans'))
        ->assertRedirect(route('billing.index'));
});

test('authenticated user can access invoices page', function () {
    $this->actingAs($this->user)
        ->get(route('billing.invoices'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/invoices')
            ->has('invoices')
        );
});

// === PUBLIC PRICING PAGE ===

test('guest can access public pricing page', function () {
    Plan::factory()->free()->create();
    Plan::factory()->proMonthly()->create();

    $this->get(route('pricing'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('pricing')
            ->has('plans')
        );
});

test('authenticated user can access public pricing page', function () {
    Plan::factory()->free()->create();

    $this->actingAs($this->user)
        ->get(route('pricing'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('pricing')
        );
});

// === SUCCESS AND CANCEL PAGES ===

test('authenticated user can access checkout success page', function () {
    $this->actingAs($this->user)
        ->get(route('billing.success'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('billing/success')
            ->has('message')
        );
});

test('authenticated user can access checkout cancel page', function () {
    $this->actingAs($this->user)
        ->get(route('billing.cancel'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('billing/cancel')
            ->has('message')
        );
});
