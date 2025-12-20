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
}
