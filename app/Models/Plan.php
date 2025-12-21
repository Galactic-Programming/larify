<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'stripe_id',
        'stripe_product',
        'name',
        'description',
        'price',
        'currency',
        'interval',
        'interval_count',
        'features',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'features' => 'array',
            'is_active' => 'boolean',
            'interval_count' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Get the formatted price.
     */
    public function formattedPrice(): string
    {
        return number_format($this->price / 100, 2);
    }

    /**
     * Get the price with currency symbol.
     */
    public function displayPrice(): string
    {
        $symbol = match (strtolower($this->currency)) {
            'usd' => '$',
            'eur' => '€',
            'gbp' => '£',
            'vnd' => '₫',
            default => $this->currency . ' ',
        };

        return $symbol . $this->formattedPrice();
    }

    /**
     * Get the billing interval label.
     */
    public function intervalLabel(): string
    {
        if ($this->interval_count === 1) {
            return match ($this->interval) {
                'month' => 'monthly',
                'year' => 'yearly',
                'week' => 'weekly',
                'day' => 'daily',
                default => $this->interval,
            };
        }

        return "every {$this->interval_count} {$this->interval}s";
    }

    /**
     * Scope to only active plans.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to order by sort order.
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order');
    }

    /**
     * Scope to filter by interval.
     */
    public function scopeInterval(Builder $query, string $interval): Builder
    {
        return $query->where('interval', $interval);
    }

    /**
     * Get monthly plans.
     */
    public static function monthly()
    {
        return static::active()->interval('month')->ordered()->get();
    }

    /**
     * Get yearly plans.
     */
    public static function yearly()
    {
        return static::active()->interval('year')->ordered()->get();
    }

    /**
     * Find a plan by its Stripe Price ID.
     */
    public static function findByStripeId(string $stripeId): ?self
    {
        return static::where('stripe_id', $stripeId)->first();
    }
}
