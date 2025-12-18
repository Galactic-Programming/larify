<?php

namespace App\Models;

use App\Enums\ActivityType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Activity extends Model
{
    protected $fillable = [
        'user_id',
        'project_id',
        'subject_type',
        'subject_id',
        'type',
        'description',
        'properties',
    ];

    protected function casts(): array
    {
        return [
            'type' => ActivityType::class,
            'properties' => 'array',
        ];
    }

    /**
     * Get the user who performed the activity.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the project this activity belongs to.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the subject of the activity (polymorphic).
     */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Create a new activity log entry.
     *
     * @param  array<string, mixed>  $properties
     */
    public static function log(
        ActivityType $type,
        ?Model $subject = null,
        ?Project $project = null,
        ?User $user = null,
        ?string $description = null,
        array $properties = []
    ): self {
        return static::create([
            'user_id' => $user?->id ?? auth()->id(),
            'project_id' => $project?->id ?? $subject?->project_id ?? null,
            'subject_type' => $subject ? $subject->getMorphClass() : null,
            'subject_id' => $subject?->id,
            'type' => $type,
            'description' => $description,
            'properties' => $properties ?: null,
        ]);
    }

    /**
     * Scope to filter activities by project.
     */
    public function scopeForProject($query, Project $project)
    {
        return $query->where('project_id', $project->id);
    }

    /**
     * Scope to filter activities by user.
     */
    public function scopeByUser($query, User $user)
    {
        return $query->where('user_id', $user->id);
    }

    /**
     * Scope to filter activities by type.
     */
    public function scopeOfType($query, ActivityType $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Get the formatted description for display.
     */
    public function getFormattedDescriptionAttribute(): string
    {
        if ($this->description) {
            return $this->description;
        }

        $userName = $this->user?->name ?? 'Someone';
        $action = $this->type->label();
        $subjectName = $this->getSubjectName();

        return trim("{$userName} {$action}".($subjectName ? " \"{$subjectName}\"" : ''));
    }

    /**
     * Get the subject name for display.
     */
    protected function getSubjectName(): ?string
    {
        if (! $this->subject) {
            return $this->properties['subject_name'] ?? null;
        }

        return match ($this->subject_type) {
            Task::class => $this->subject->title,
            Project::class => $this->subject->name,
            TaskList::class => $this->subject->name,
            User::class => $this->subject->name,
            default => null,
        };
    }
}
