<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * Project channel - authorize users who are owner or member of the project
 */
Broadcast::channel('project.{projectId}', function ($user, $projectId) {
    $project = \App\Models\Project::find($projectId);

    if (! $project) {
        return false;
    }

    // Owner check
    if ($project->user_id === $user->id) {
        return true;
    }

    // Member check
    return $project->projectMembers()->where('user_id', $user->id)->exists();
});
