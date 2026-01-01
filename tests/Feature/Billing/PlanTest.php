<?php

use App\Models\Plan;

// === PLAN MODEL TESTS ===

test('plan can be created with factory', function () {
    $plan = Plan::factory()->create();

    expect($plan)->toBeInstanceOf(Plan::class)
        ->and($plan->stripe_id)->toStartWith('price_')
        ->and($plan->stripe_product)->toStartWith('prod_')
        ->and($plan->is_active)->toBeTrue();
});

test('plan factory can create free plan', function () {
    $plan = Plan::factory()->free()->create();

    expect($plan->name)->toBe('Free')
        ->and($plan->price)->toBe(0)
        ->and($plan->sort_order)->toBe(0)
        ->and($plan->stripe_id)->toBe('price_free')
        ->and($plan->stripe_product)->toBe('prod_free');
});

test('plan factory can create pro monthly plan', function () {
    $plan = Plan::factory()->proMonthly()->create();

    expect($plan->name)->toBe('Pro')
        ->and($plan->price)->toBe(999)
        ->and($plan->interval)->toBe('month')
        ->and($plan->stripe_id)->toBe('price_pro_monthly')
        ->and($plan->stripe_product)->toBe('prod_pro');
});

test('plan factory can create pro yearly plan', function () {
    $plan = Plan::factory()->proYearly()->create();

    expect($plan->name)->toBe('Pro')
        ->and($plan->price)->toBe(9990)
        ->and($plan->interval)->toBe('year')
        ->and($plan->stripe_id)->toBe('price_pro_yearly')
        ->and($plan->stripe_product)->toBe('prod_pro');
});

test('plan factory can create inactive plan', function () {
    $plan = Plan::factory()->inactive()->create();

    expect($plan->is_active)->toBeFalse();
});

// === PLAN FORMATTING ===

test('plan formats price correctly', function () {
    $plan = Plan::factory()->proMonthly()->create();

    expect($plan->formattedPrice())->toBe('9.99');
});

test('plan displays price with USD symbol', function () {
    $plan = Plan::factory()->proMonthly()->create(['currency' => 'usd']);

    expect($plan->displayPrice())->toBe('$9.99');
});

test('plan displays price with EUR symbol', function () {
    $plan = Plan::factory()->create(['price' => 1999, 'currency' => 'eur']);

    expect($plan->displayPrice())->toBe('€19.99');
});

test('plan displays price with VND symbol', function () {
    $plan = Plan::factory()->create(['price' => 99000, 'currency' => 'vnd']);

    expect($plan->displayPrice())->toBe('₫990.00');
});

// === PLAN INTERVAL LABELS ===

test('monthly plan has correct interval label', function () {
    $plan = Plan::factory()->proMonthly()->create();

    expect($plan->intervalLabel())->toBe('monthly');
});

test('yearly plan has correct interval label', function () {
    $plan = Plan::factory()->proYearly()->create();

    expect($plan->intervalLabel())->toBe('yearly');
});

test('multi-month interval has correct label', function () {
    $plan = Plan::factory()->create([
        'interval' => 'month',
        'interval_count' => 3,
    ]);

    expect($plan->intervalLabel())->toBe('every 3 months');
});

// === PLAN SCOPES ===

test('active scope only returns active plans', function () {
    Plan::factory()->count(3)->create();
    Plan::factory()->inactive()->count(2)->create();

    expect(Plan::active()->count())->toBe(3);
});

test('ordered scope orders by sort_order', function () {
    Plan::factory()->create(['sort_order' => 3]);
    Plan::factory()->create(['sort_order' => 1]);
    Plan::factory()->create(['sort_order' => 2]);

    $plans = Plan::ordered()->get();

    expect($plans[0]->sort_order)->toBe(1)
        ->and($plans[1]->sort_order)->toBe(2)
        ->and($plans[2]->sort_order)->toBe(3);
});

test('interval scope filters by interval', function () {
    Plan::factory()->create(['interval' => 'month']);
    Plan::factory()->create(['interval' => 'month']);
    Plan::factory()->create(['interval' => 'year']);

    expect(Plan::interval('month')->count())->toBe(2)
        ->and(Plan::interval('year')->count())->toBe(1);
});

// === PLAN STATIC METHODS ===

test('monthly static method returns active monthly plans ordered', function () {
    Plan::factory()->create(['interval' => 'month', 'sort_order' => 0]);
    Plan::factory()->create(['interval' => 'month', 'sort_order' => 1]);
    Plan::factory()->create(['interval' => 'year']);
    Plan::factory()->inactive()->create(['interval' => 'month']);

    $monthlyPlans = Plan::monthly();

    expect($monthlyPlans)->toHaveCount(2);
});

test('yearly static method returns active yearly plans ordered', function () {
    Plan::factory()->create(['interval' => 'month']);
    Plan::factory()->create(['interval' => 'year', 'sort_order' => 0]);
    Plan::factory()->inactive()->create(['interval' => 'year']);

    $yearlyPlans = Plan::yearly();

    expect($yearlyPlans)->toHaveCount(1);
});

test('findByStripeId returns correct plan', function () {
    $plan = Plan::factory()->proMonthly()->create();

    $found = Plan::findByStripeId('price_pro_monthly');

    expect($found->id)->toBe($plan->id);
});

test('findByStripeId returns null for non-existent plan', function () {
    $found = Plan::findByStripeId('price_non_existent');

    expect($found)->toBeNull();
});

// === PLAN FEATURES ===

test('plan features are cast to array', function () {
    $plan = Plan::factory()->proMonthly()->create();

    expect($plan->features)->toBeArray()
        ->and($plan->features)->toContain('Unlimited projects')
        ->and($plan->features)->toContain('Team collaboration');
});

test('free plan has correct features', function () {
    $plan = Plan::factory()->free()->create();

    expect($plan->features)->toContain('Up to 3 projects')
        ->and($plan->features)->toContain('In-app chat');
});
