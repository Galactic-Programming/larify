<?php

namespace App\Models;

use App\Enums\SocialProvider;
use App\Enums\UserPlan;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Cashier\Billable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use Billable, HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'avatar',
        'password',
        'plan',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'plan' => UserPlan::class,
        ];
    }

    /**
     * Get the social accounts for the user.
     */
    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }

    /**
     * Check if the user has a social account for the given provider.
     */
    public function hasSocialAccount(SocialProvider $provider): bool
    {
        return $this->socialAccounts()->where('provider', $provider)->exists();
    }

    /**
     * Get the social account for the given provider.
     */
    public function getSocialAccount(string $provider): ?SocialAccount
    {
        return $this->socialAccounts()->where('provider', $provider)->first();
    }

    /**
     * Get the projects owned by the user.
     */
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    /**
     * Get the projects where the user is a member (not owner).
     */
    public function memberProjects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_members')
            ->withPivot(['role', 'joined_at'])
            ->withTimestamps();
    }

    /**
     * Get all projects the user has access to (owned + member).
     */
    public function allProjects()
    {
        return Project::where('user_id', $this->id)
            ->orWhereHas('members', fn ($q) => $q->where('user_id', $this->id));
    }

    /**
     * Get the activities performed by the user.
     */
    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    /**
     * Get subscription with plan details.
     */
    public function subscriptionWithPlan(?string $type = 'default'): ?array
    {
        $subscription = $this->subscription($type);

        if (! $subscription) {
            return null;
        }

        $plan = \App\Models\Plan::findByStripeId($subscription->stripe_price);

        return [
            'id' => $subscription->id,
            'stripe_id' => $subscription->stripe_id,
            'stripe_status' => $subscription->stripe_status,
            'stripe_price' => $subscription->stripe_price,
            'quantity' => $subscription->quantity,
            'trial_ends_at' => $subscription->trial_ends_at?->toISOString(),
            'ends_at' => $subscription->ends_at?->toISOString(),
            'on_trial' => $subscription->onTrial(),
            'canceled' => $subscription->canceled(),
            'on_grace_period' => $subscription->onGracePeriod(),
            'active' => $subscription->active(),
            'plan' => $plan ? [
                'id' => $plan->id,
                'name' => $plan->name,
                'description' => $plan->description,
                'price' => $plan->price,
                'display_price' => $plan->displayPrice(),
                'interval' => $plan->interval,
                'interval_label' => $plan->intervalLabel(),
                'features' => $plan->features,
            ] : null,
        ];
    }

    /**
     * Check if user has premium subscription.
     * Returns true if user is subscribed (including grace period).
     */
    public function isPremium(): bool
    {
        // subscribed() already handles grace period - returns true if active OR on grace period
        return $this->subscribed('default');
    }

    /**
     * Get the user's current plan name.
     */
    public function currentPlanName(): string
    {
        if (! $this->subscribed('default')) {
            return 'Free';
        }

        $plan = \App\Models\Plan::findByStripeId($this->subscription('default')->stripe_price);

        return $plan?->name ?? 'Premium';
    }

    /**
     * Get the conversations the user is a participant in.
     */
    public function conversations(): BelongsToMany
    {
        return $this->belongsToMany(Conversation::class, 'conversation_participants')
            ->withPivot(['role', 'nickname', 'last_read_at', 'notifications_muted', 'joined_at', 'left_at'])
            ->withTimestamps();
    }

    /**
     * Get active conversations (not left).
     */
    public function activeConversations(): BelongsToMany
    {
        return $this->conversations()->whereNull('conversation_participants.left_at');
    }

    /**
     * Get the messages sent by the user.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }
}
