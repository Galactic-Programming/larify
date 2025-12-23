<?php

namespace App\Http\Requests\TaskLists;

use App\Models\Project;
use App\Models\TaskList;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateTaskListRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $project = $this->route('project');
        $list = $this->route('list');

        return $project instanceof Project
            && $list instanceof TaskList
            && Gate::allows('update', [$list, $project]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>\
     */
    public function rules(): array
    {
        /** @var Project $project */
        $project = $this->route('project');

        /** @var TaskList $list */
        $list = $this->route('list');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('lists', 'name')
                    ->where('project_id', $project->id)
                    ->whereNull('deleted_at')
                    ->ignore($list->id),
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
