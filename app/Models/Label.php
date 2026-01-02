<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Label extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'color',
    ];

    /**
     * Available colors for labels.
     */
    public const COLORS = [
        // Basic (Free plan)
        'gray' => '#6b7280',
        'red' => '#ef4444',
        'yellow' => '#f59e0b',
        'green' => '#22c55e',
        'blue' => '#3b82f6',
        'purple' => '#8b5cf6',

        // Extended (Pro plan)
        'pink' => '#ec4899',
        'indigo' => '#6366f1',
        'cyan' => '#06b6d4',
        'teal' => '#14b8a6',
        'orange' => '#f97316',
        'lime' => '#84cc16',
    ];

    /**
     * Colors available for Free plan users.
     *
     * @var list<string>
     */
    public const FREE_COLORS = ['gray', 'red', 'yellow', 'green', 'blue', 'purple'];

    /**
     * Get the project that owns this label.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the tasks that have this label.
     */
    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'label_task')
            ->withTimestamps();
    }

    /**
     * Get hex color from color name or return as-is if already hex.
     */
    public function getHexColor(): string
    {
        return self::COLORS[$this->color] ?? $this->color;
    }

    /**
     * Check if this color is available for free plan.
     */
    public static function isColorFree(string $color): bool
    {
        // Check if it's a color name
        if (in_array($color, self::FREE_COLORS, true)) {
            return true;
        }

        // Check if it's a hex value that matches a free color
        $freeHexColors = array_intersect_key(self::COLORS, array_flip(self::FREE_COLORS));

        return in_array($color, $freeHexColors, true);
    }
}
