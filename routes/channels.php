<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/**
 * User projects channel - authorize user to listen to their own projects
 */
Broadcast::channel('user.{userId}.projects', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
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

/**
 * Task comments channel - authorize project members to listen for comment updates
 */
Broadcast::channel('project.{projectId}.task.{taskId}.comments', function ($user, $projectId, $taskId) {
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

/**
 * Task attachments channel - authorize project members to listen for attachment updates
 */
Broadcast::channel('project.{projectId}.task.{taskId}.attachments', function ($user, $projectId, $taskId) {
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

/**
 * Conversation channel - authorize users who are participants
 */
Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    $conversation = \App\Models\Conversation::find($conversationId);

    if (! $conversation) {
        return false;
    }

    return $conversation->participants()->where('users.id', $user->id)->exists();
});

/**
 * User conversations channel - for receiving new conversation notifications
 */
Broadcast::channel('user.{userId}.conversations', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
