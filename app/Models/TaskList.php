<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaskList extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     */
    protected $table = 'lists';

    protected $fillable = [
        'project_id',
        'name',
        'position',
        'is_done_list',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'is_done_list' => 'boolean',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function booted(): void
    {
        // Cascade soft delete to tasks
        static::deleting(function (TaskList $list) {
            if (! $list->isForceDeleting()) {
                $deletedAt = now();

                // Soft delete all tasks in this list
                $list->tasks()->withTrashed()->whereNull('deleted_at')->update(['deleted_at' => $deletedAt]);
            }
        });

        // Cascade restore tasks that were deleted at the same time
        static::restoring(function (TaskList $list) {
            $deletedAt = $list->deleted_at;

            // Restore tasks deleted at the same time (within 1 second tolerance)
            $list->tasks()
                ->withTrashed()
                ->where('deleted_at', '>=', $deletedAt->subSecond())
                ->where('deleted_at', '<=', $deletedAt->addSecond())
                ->update(['deleted_at' => null]);
        });

        // Cascade force delete
        static::forceDeleting(function (TaskList $list) {
            $list->tasks()->withTrashed()->forceDelete();
        });
    }

    /**
     * Get the project that owns the list.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the project including trashed.
     */
    public function projectWithTrashed(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id')->withTrashed();
    }

    /**
     * Get the tasks for the list.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'list_id')->orderBy('position');
    }

    /**
     * Generate a unique name for restore if the current name conflicts.
     * Returns the original name if no conflict, or "Name (1)", "Name (2)", etc.
     */
    public function getUniqueNameForRestore(): string
    {
        $baseName = $this->name;

        // Check if there's an active list with the same name
        $existingList = static::where('project_id', $this->project_id)
            ->where('name', $baseName)
            ->whereNull('deleted_at')
            ->where('id', '!=', $this->id)
            ->exists();

        if (! $existingList) {
            return $baseName;
        }

        // Find a unique suffix
        $counter = 1;
        do {
            $newName = "{$baseName} ({$counter})";
            $exists = static::where('project_id', $this->project_id)
                ->where('name', $newName)
                ->whereNull('deleted_at')
                ->exists();
            $counter++;
        } while ($exists);

        return $newName;
    }

    /**
     * Restore the list with auto-suffix if name conflicts.
     */
    public function restoreWithUniqueName(): void
    {
        $uniqueName = $this->getUniqueNameForRestore();

        if ($uniqueName !== $this->name) {
            $this->name = $uniqueName;
            $this->saveQuietly(); // Save without triggering events
        }

        $this->restore();
    }
}
