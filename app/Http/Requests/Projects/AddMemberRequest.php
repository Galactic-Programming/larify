<?php

namespace App\Http\Requests\Projects;

use App\Enums\ProjectRole;
use App\Models\Project;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class AddMemberRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $project = $this->route('project');

        return $project instanceof Project
            && Gate::allows('manageMembers', $project);
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
            'user_id' => [
                'required',
                'exists:users,id',
                // User must not already be a member
                Rule::unique('project_members')->where(function ($query) use ($project) {
                    return $query->where('project_id', $project->id);
                }),
                // Cannot add the project owner as a member
                function ($attribute, $value, $fail) use ($project) {
                    if ((int) $value === $project->user_id) {
                        $fail('The project owner cannot be added as a member.');
                    }
                },
            ],
            'role' => ['sometimes', Rule::enum(ProjectRole::class)->except([ProjectRole::Owner])],
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
            'user_id.required' => 'Please select a user to add.',
            'user_id.exists' => 'The selected user does not exist.',
            'user_id.unique' => 'This user is already a member of the project.',
            'role.enum' => 'Please select a valid role.',
        ];
    }
}
