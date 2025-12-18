<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserSearchController extends Controller
{
    /**
     * Search for users to add to a project.
     * Requires at least 2 characters to search.
     */
    public function search(Request $request, Project $project): JsonResponse
    {
        $request->validate([
            'query' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        $query = $request->input('query');

        // Get IDs of users already in the project (owner + members)
        $existingMemberIds = $project->members()->pluck('users.id')
            ->push($project->user_id)
            ->toArray();

        // Search users by name or email, excluding existing members
        $users = User::whereNotIn('id', $existingMemberIds)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%");
            })
            ->select(['id', 'name', 'email', 'avatar'])
            ->orderBy('name')
            ->limit(10) // Chỉ trả về 10 kết quả để tránh quá nhiều
            ->get();

        return response()->json($users);
    }
}
