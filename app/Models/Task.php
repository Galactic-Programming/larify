<?php

namespace App\Models;

use App\Enums\TaskPriority;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'list_id',
        'original_list_id',
        'assigned_to',
        'title',
        'description',
        'position',
        'priority',
        'due_date',
        'due_time',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'priority' => TaskPriority::class,
            'due_date' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * Get the project that owns the task.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the list that owns the task.
     */
    public function list(): BelongsTo
    {
        return $this->belongsTo(TaskList::class, 'list_id');
    }

    /**
     * Get the user assigned to this task.
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Check if the task is completed.
     */
    public function isCompleted(): bool
    {
        return $this->completed_at !== null;
    }

    /**
     * Check if the task is overdue.
     */
    public function isOverdue(): bool
    {
        if ($this->completed_at !== null) {
            return false;
        }

        $deadline = $this->due_date->format('Y-m-d') . ' ' . $this->due_time;

        return now()->gt($deadline);
    }
}
