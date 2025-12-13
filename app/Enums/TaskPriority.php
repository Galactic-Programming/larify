<?php

namespace App\Enums;

enum TaskPriority: string
{
    case None = 'none';
    case Low = 'low';
    case Medium = 'medium';
    case High = 'high';
    case Urgent = 'urgent';

    public function label(): string
    {
        return match ($this) {
            self::None => 'None',
            self::Low => 'Low',
            self::Medium => 'Medium',
            self::High => 'High',
            self::Urgent => 'Urgent',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::None => '#6b7280',   // Gray
            self::Low => '#22c55e',    // Green
            self::Medium => '#eab308', // Yellow
            self::High => '#f97316',   // Orange
            self::Urgent => '#ef4444', // Red
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::None => 'minus',
            self::Low => 'arrow-down',
            self::Medium => 'arrow-right',
            self::High => 'arrow-up',
            self::Urgent => 'alert-triangle',
        };
    }
}
