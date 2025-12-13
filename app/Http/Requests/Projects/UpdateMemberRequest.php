<?php

namespace App\Http\Requests\Projects;

use App\Enums\ProjectRole;
use App\Models\Project;
use App\Models\ProjectMember;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateMemberRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $project = $this->route('project');
        $member = $this->route('member');

        return $project instanceof Project
            && $member instanceof ProjectMember
            && $member->project_id === $project->id
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

        /** @var ProjectMember $member */
        $member = $this->route('member');

        return [
            'role' => [
                'required',
                Rule::enum(ProjectRole::class)->except([ProjectRole::Owner]),
                // Cannot change role of project owner
                function ($attribute, $value, $fail) use ($project, $member) {
                    if ($member->user_id === $project->user_id) {
                        $fail('Cannot change the role of the project owner.');
                    }
                },
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
            'role.required' => 'Please select a role.',
            'role.enum' => 'Please select a valid role.',
        ];
    }
}
