<?php

namespace App\Models;

use App\Enums\ProjectRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasFactory, SoftDeletes;

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
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function booted(): void
    {
        // Cascade soft delete to lists and tasks
        static::deleting(function (Project $project) {
            if (! $project->isForceDeleting()) {
                $deletedAt = now();

                // Soft delete all lists
                $project->lists()->withTrashed()->whereNull('deleted_at')->update(['deleted_at' => $deletedAt]);

                // Soft delete all tasks
                $project->tasks()->withTrashed()->whereNull('deleted_at')->update(['deleted_at' => $deletedAt]);
            }
        });

        // Cascade restore lists and tasks that were deleted at the same time
        static::restoring(function (Project $project) {
            $deletedAt = $project->deleted_at;

            // Restore lists deleted at the same time (within 1 second tolerance)
            $project->lists()
                ->withTrashed()
                ->where('deleted_at', '>=', $deletedAt->subSecond())
                ->where('deleted_at', '<=', $deletedAt->addSecond())
                ->update(['deleted_at' => null]);

            // Restore tasks deleted at the same time
            $project->tasks()
                ->withTrashed()
                ->where('deleted_at', '>=', $deletedAt->subSecond())
                ->where('deleted_at', '<=', $deletedAt->addSecond())
                ->update(['deleted_at' => null]);
        });

        // Cascade force delete
        static::forceDeleting(function (Project $project) {
            // Force delete all lists (will cascade to tasks via DB constraint)
            $project->lists()->withTrashed()->forceDelete();
            // Force delete all tasks
            $project->tasks()->withTrashed()->forceDelete();
        });
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
     * Get the labels for this project.
     */
    public function labels(): HasMany
    {
        return $this->hasMany(Label::class)->orderBy('name');
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
     * Check if a user can assign tasks to other members.
     */
    public function canAssignTask(User $user): bool
    {
        $role = $this->getMemberRole($user);

        return $role?->canAssignTask() ?? false;
    }

    /**
     * Check if a user can set/unset done list.
     */
    public function canSetDoneList(User $user): bool
    {
        $role = $this->getMemberRole($user);

        return $role?->canSetDoneList() ?? false;
    }

    /**
     * Get user permissions for this project.
     *
     * @return array<string, mixed>
     */
    public function getPermissions(User $user): array
    {
        $role = $this->getMemberRole($user);
        $isOwner = $this->user_id === $user->id;

        // canManageMembers requires: owner role + plan that allows inviting members
        $canManageMembers = $isOwner && ($user->plan?->canInviteMembers() ?? false);

        // List limit is based on project owner's plan
        $owner = $this->user;
        $maxLists = $owner->plan?->maxListsPerProject();
        $currentLists = $this->lists()->count();
        $canCreateList = $maxLists === null || $currentLists < $maxLists;

        return [
            'canView' => $role !== null,
            'canEdit' => $role?->canEdit() ?? false,
            'canDelete' => $role?->canDelete() ?? false,
            'canReopen' => $role?->canReopen() ?? false,
            'canManageSettings' => $role?->canManageSettings() ?? false,
            'canManageMembers' => $canManageMembers,
            'canAssignTask' => $role?->canAssignTask() ?? false,
            'canSetDoneList' => $role?->canSetDoneList() ?? false,
            'isOwner' => $isOwner,
            'role' => $role?->value,
            // List limit info
            'canCreateList' => $canCreateList,
            'maxLists' => $maxLists,
            'currentLists' => $currentLists,
        ];
    }

    /**
     * Get the activities for this project.
     */
    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class)->latest();
    }

    /**
     * Get the conversation for this project.
     */
    public function conversation(): HasOne
    {
        return $this->hasOne(Conversation::class);
    }

    /**
     * Get or create conversation for this project.
     * Creates conversation only if project has 2+ members (including owner).
     */
    public function getOrCreateConversation(): ?Conversation
    {
        // Check for existing conversation in database
        $existingConversation = Conversation::where('project_id', $this->id)->first();
        if ($existingConversation) {
            return $existingConversation;
        }

        // Count total members (owner + invited members)
        $totalMembers = 1 + $this->members()->count();

        // Only create conversation if there are 2+ members
        if ($totalMembers < 2) {
            return null;
        }

        // Create new conversation
        $conversation = $this->conversation()->create([
            'last_message_at' => now(),
        ]);

        // Sync participants with project members
        $conversation->syncWithProjectMembers();

        return $conversation;
    }

    /**
     * Sync conversation participants when project members change.
     */
    public function syncConversationParticipants(): void
    {
        $conversation = $this->conversation;

        if (! $conversation) {
            // Try to create conversation if we now have enough members
            $this->getOrCreateConversation();

            return;
        }

        $conversation->syncWithProjectMembers();
    }

    /**
     * Get total member count (including owner).
     */
    public function getTotalMemberCount(): int
    {
        return 1 + $this->members()->count();
    }

    /**
     * Check if project has chat enabled (2+ members).
     */
    public function hasChatEnabled(): bool
    {
        return $this->getTotalMemberCount() >= 2;
    }
}
