<?php

namespace App\Http\Controllers\Activities;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityResource;
use App\Models\Activity;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ActivityController extends Controller
{
    /**
     * Display the activity feed page (all activities across user's projects).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get project IDs the user has access to
        $projectIds = $user->allProjects()->pluck('id');

        $activities = Activity::whereIn('project_id', $projectIds)
            ->with(['user:id,name,avatar', 'project:id,name,color,icon'])
            ->latest()
            ->paginate(30);

        return Inertia::render('notifications/index', [
            'activities' => ActivityResource::collection($activities),
            'tab' => 'activities',
        ]);
    }

    /**
     * Get activities for a specific project.
     */
    public function forProject(Request $request, Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $activities = $project->activities()
            ->with(['user:id,name,avatar'])
            ->latest()
            ->paginate(30);

        return response()->json([
            'activities' => ActivityResource::collection($activities),
            'pagination' => [
                'current_page' => $activities->currentPage(),
                'last_page' => $activities->lastPage(),
                'per_page' => $activities->perPage(),
                'total' => $activities->total(),
            ],
        ]);
    }

    /**
     * Get activities list for API/AJAX requests.
     */
    public function list(Request $request): JsonResponse
    {
        $user = $request->user();
        $projectId = $request->query('project_id');

        // Get project IDs the user has access to
        $projectIds = $user->allProjects()->pluck('id');

        $query = Activity::whereIn('project_id', $projectIds)
            ->with(['user:id,name,avatar', 'project:id,name,color,icon'])
            ->latest();

        // Filter by specific project if provided
        if ($projectId && $projectIds->contains($projectId)) {
            $query->where('project_id', $projectId);
        }

        $activities = $query->paginate(30);

        return response()->json([
            'activities' => ActivityResource::collection($activities),
            'pagination' => [
                'current_page' => $activities->currentPage(),
                'last_page' => $activities->lastPage(),
                'per_page' => $activities->perPage(),
                'total' => $activities->total(),
            ],
        ]);
    }
}
