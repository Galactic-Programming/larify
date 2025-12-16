<?php

namespace App\Http\Requests\Tasks;

use App\Models\Project;
use App\Models\Task;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class MoveTaskRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $project = $this->route('project');
        $task = $this->route('task');

        return $project instanceof Project
            && $task instanceof Task
            && Gate::allows('update', [$task, $project]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $project = $this->route('project');

        return [
            'list_id' => [
                'required',
                'integer',
                'exists:lists,id',
                function ($attribute, $value, $fail) use ($project) {
                    if ($project && ! $project->lists()->where('id', $value)->exists()) {
                        $fail('The selected list does not belong to this project.');
                    }
                },
            ],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
