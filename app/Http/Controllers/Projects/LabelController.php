<?php

namespace App\Http\Controllers\Projects;

use App\Enums\UserPlan;
use App\Http\Controllers\Controller;
use App\Models\Label;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class LabelController extends Controller
{
    /**
     * Get all labels for a project.
     */
    public function index(Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        return response()->json([
            'labels' => $project->labels()->orderBy('name')->get(),
        ]);
    }

    /**
     * Create a new label for the project.
     */
    public function store(Request $request, Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50'],
            'color' => ['required', 'string', 'max:50'],
        ]);

        /** @var \App\Models\User $user */
        $user = $request->user();
        $plan = $user->plan ?? UserPlan::Free;
        $maxLabels = $plan->maxLabelsPerProject();

        // Check plan limit
        if ($maxLabels !== null && $project->labels()->count() >= $maxLabels) {
            throw ValidationException::withMessages([
                'name' => "You've reached the limit of {$maxLabels} labels. Upgrade to Pro for unlimited labels.",
            ]);
        }

        // Check color availability for Free plan
        if (! $plan->hasExtendedLabelColors() && ! Label::isColorFree($validated['color'])) {
            throw ValidationException::withMessages([
                'color' => 'This color is only available for Pro users.',
            ]);
        }

        $label = $project->labels()->create($validated);

        return response()->json(['label' => $label], 201);
    }

    /**
     * Update an existing label.
     */
    public function update(Request $request, Project $project, Label $label): JsonResponse
    {
        Gate::authorize('update', $project);

        abort_if($label->project_id !== $project->id, 404);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:50'],
            'color' => ['sometimes', 'string', 'max:50'],
        ]);

        // Check color availability for Free plan
        if (isset($validated['color'])) {
            /** @var \App\Models\User $user */
            $user = $request->user();
            $plan = $user->plan ?? UserPlan::Free;

            if (! $plan->hasExtendedLabelColors() && ! Label::isColorFree($validated['color'])) {
                throw ValidationException::withMessages([
                    'color' => 'This color is only available for Pro users.',
                ]);
            }
        }

        $label->update($validated);

        return response()->json(['label' => $label]);
    }

    /**
     * Delete a label.
     */
    public function destroy(Project $project, Label $label): JsonResponse
    {
        Gate::authorize('update', $project);

        abort_if($label->project_id !== $project->id, 404);

        $label->delete();

        return response()->json(['message' => 'Label deleted']);
    }
}
