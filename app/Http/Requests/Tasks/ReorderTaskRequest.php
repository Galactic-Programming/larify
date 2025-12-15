<?php

namespace App\Http\Requests\Tasks;

use App\Models\Project;
use App\Models\TaskList;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class ReorderTaskRequest extends FormRequest
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
            && Gate::allows('update', $project)
            && $list->project_id === $project->id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $list = $this->route('list');

        return [
            'tasks' => ['required', 'array'],
            'tasks.*.id' => [
                'required',
                'integer',
                'exists:tasks,id',
                function ($attribute, $value, $fail) use ($list) {
                    // Verify the task belongs to this list
                    if ($list && ! $list->tasks()->where('id', $value)->exists()) {
                        $fail('The task does not belong to this list.');
                    }
                },
            ],
            'tasks.*.position' => ['required', 'integer', 'min:0'],
        ];
    }
}
