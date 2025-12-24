<?php

use App\Enums\UserPlan;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create([
        'email' => 'current@example.com',
        'plan' => UserPlan::Pro,
    ]));
});

it('requires a search query', function () {
    $this->getJson('/api/users/search')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['query']);
});

it('requires minimum 3 characters in search query', function () {
    $this->getJson('/api/users/search?query=ab')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['query']);

    $this->getJson('/api/users/search?query=abc')
        ->assertSuccessful();
});

it('searches users by email', function () {
    User::factory()->create(['email' => 'john.doe@example.com', 'name' => 'John Doe', 'plan' => UserPlan::Pro]);
    User::factory()->create(['email' => 'jane.smith@example.com', 'name' => 'Jane Smith', 'plan' => UserPlan::Pro]);
    User::factory()->create(['email' => 'bob@other.com', 'name' => 'Bob Wilson', 'plan' => UserPlan::Pro]);

    $response = $this->getJson('/api/users/search?query=john.doe@example.com');

    $response->assertSuccessful()
        ->assertJsonCount(1, 'users')
        ->assertJsonPath('users.0.email', 'john.doe@example.com');
});

it('searches users by partial email', function () {
    User::factory()->create(['email' => 'john.doe@example.com', 'name' => 'John Doe', 'plan' => UserPlan::Pro]);
    User::factory()->create(['email' => 'john.smith@example.com', 'name' => 'John Smith', 'plan' => UserPlan::Pro]);
    User::factory()->create(['email' => 'bob@other.com', 'name' => 'Bob Wilson', 'plan' => UserPlan::Pro]);

    $response = $this->getJson('/api/users/search?query=john');

    $response->assertSuccessful()
        ->assertJsonCount(2, 'users');
});

it('prioritizes exact email matches', function () {
    User::factory()->create(['email' => 'test@example.com', 'name' => 'Test User', 'plan' => UserPlan::Pro]);
    User::factory()->create(['email' => 'tester@example.com', 'name' => 'Tester', 'plan' => UserPlan::Pro]);

    $response = $this->getJson('/api/users/search?query=test@example.com');

    $response->assertSuccessful()
        ->assertJsonPath('users.0.email', 'test@example.com');
});

it('excludes current user from search results', function () {
    $response = $this->getJson('/api/users/search?query=current@example.com');

    $response->assertSuccessful()
        ->assertJsonCount(0, 'users');
});

it('only returns Pro users in search results', function () {
    User::factory()->create(['email' => 'prouser@example.com', 'name' => 'Pro User', 'plan' => UserPlan::Pro]);
    User::factory()->create(['email' => 'freeuser@example.com', 'name' => 'Free User', 'plan' => UserPlan::Free]);

    $response = $this->getJson('/api/users/search?query=prouser@example.com');

    $response->assertSuccessful()
        ->assertJsonCount(1, 'users')
        ->assertJsonPath('users.0.email', 'prouser@example.com');
});

it('excludes Free users from search results', function () {
    User::factory()->create(['email' => 'freeonly@example.com', 'name' => 'Free Only', 'plan' => UserPlan::Free]);

    $response = $this->getJson('/api/users/search?query=freeonly@example.com');

    $response->assertSuccessful()
        ->assertJsonCount(0, 'users');
});

it('returns only necessary user fields', function () {
    User::factory()->create(['email' => 'target@example.com', 'plan' => UserPlan::Pro]);

    $response = $this->getJson('/api/users/search?query=target@example.com');

    $response->assertSuccessful();
    $user = $response->json('users.0');

    expect($user)->toHaveKeys(['id', 'name', 'email', 'avatar'])
        ->and($user)->not->toHaveKeys(['password', 'remember_token', 'email_verified_at']);
});

it('limits results to 10 users', function () {
    User::factory()->count(15)->sequence(
        fn ($sequence) => ['email' => "testdomain{$sequence->index}@example.com", 'plan' => UserPlan::Pro]
    )->create();

    $response = $this->getJson('/api/users/search?query=testdomain');

    $response->assertSuccessful()
        ->assertJsonCount(10, 'users');
});

it('requires authentication', function () {
    auth()->logout();

    $this->getJson('/api/users/search?query=test@example.com')
        ->assertUnauthorized();
});
