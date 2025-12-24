<?php

namespace App\Http\Requests\TaskLists;

use App\Models\Project;
use App\Models\TaskList;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreTaskListRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Checks both permission to create lists AND list limit based on project owner's plan.
     */
    public function authorize(): bool
    {
        $project = $this->route('project');

        if (! $project instanceof Project) {
            return false;
        }

        // Check permission to create lists in this project
        if (! Gate::allows('create', [TaskList::class, $project])) {
            return false;
        }

        // Check list limit based on project owner's plan
        return $this->user()->canCreateListInProject($project);
    }

    /**
     * Handle a failed authorization attempt.
     *
     * @throws \Illuminate\Auth\Access\AuthorizationException
     */
    protected function failedAuthorization(): void
    {
        $project = $this->route('project');

        // Check if it's a permission issue or limit issue
        if ($project instanceof Project && Gate::allows('create', [TaskList::class, $project])) {
            // User has permission but hit limit
            $owner = $project->user;
            $max = $owner->plan?->maxListsPerProject() ?? 5;

            throw new \Illuminate\Auth\Access\AuthorizationException(
                "This project has reached the maximum of {$max} lists. The project owner needs to upgrade to Pro for unlimited lists."
            );
        }

        // Default permission denied message
        throw new \Illuminate\Auth\Access\AuthorizationException(
            'You do not have permission to create lists in this project.'
        );
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Project $project */
        $project = $this->route('project');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('lists', 'name')
                    ->where('project_id', $project->id)
                    ->whereNull('deleted_at'),
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.unique' => 'A list with this name already exists in this project.',
        ];
    }
}
