<?php

namespace App\Models;

use App\Enums\ProjectRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'color',
        'icon',
        'is_archived',
    ];

    protected function casts(): array
    {
        return [
            'is_archived' => 'boolean',
        ];
    }

    /**
     * Get the user that owns the project.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the members of the project.
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_members')
            ->withPivot(['role', 'joined_at'])
            ->withTimestamps();
    }

    /**
     * Get the project members records.
     */
    public function projectMembers(): HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }

    /**
     * Get the lists for the project.
     */
    public function lists(): HasMany
    {
        return $this->hasMany(TaskList::class)->orderBy('position');
    }

    /**
     * Get the tasks for the project.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Check if a user is a member of the project.
     */
    public function hasMember(User $user): bool
    {
        return $this->user_id === $user->id
            || $this->members()->where('user_id', $user->id)->exists();
    }

    /**
     * Get the role of a user in the project.
     */
    public function getMemberRole(User $user): ?ProjectRole
    {
        if ($this->user_id === $user->id) {
            return ProjectRole::Owner;
        }

        $member = $this->projectMembers()->where('user_id', $user->id)->first();

        return $member?->role;
    }

    /**
     * Check if a user can edit the project.
     */
    public function canEdit(User $user): bool
    {
        $role = $this->getMemberRole($user);

        return $role?->canEdit() ?? false;
    }

    /**
     * Check if a user can delete content (tasks, lists).
     */
    public function canDelete(User $user): bool
    {
        $role = $this->getMemberRole($user);

        return $role?->canDelete() ?? false;
    }

    /**
     * Check if a user can manage project settings.
     */
    public function canManageSettings(User $user): bool
    {
        $role = $this->getMemberRole($user);

        return $role?->canManageSettings() ?? false;
    }

    /**
     * Check if a user can reopen completed tasks.
     */
    public function canReopen(User $user): bool
    {
        $role = $this->getMemberRole($user);

        return $role?->canReopen() ?? false;
    }

    /**
     * Get user permissions for this project.
     *
     * @return array<string, bool>
     */
    public function getPermissions(User $user): array
    {
        $role = $this->getMemberRole($user);

        return [
            'canView' => $role !== null,
            'canEdit' => $role?->canEdit() ?? false,
            'canDelete' => $role?->canDelete() ?? false,
            'canReopen' => $role?->canReopen() ?? false,
            'canManageSettings' => $role?->canManageSettings() ?? false,
            'canManageMembers' => $role?->canManageMembers() ?? false,
            'isOwner' => $this->user_id === $user->id,
            'role' => $role?->value,
        ];
    }
}
