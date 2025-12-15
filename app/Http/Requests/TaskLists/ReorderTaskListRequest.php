<?php

namespace App\Http\Requests\TaskLists;

use App\Models\Project;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class ReorderTaskListRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $project = $this->route('project');

        return $project instanceof Project && Gate::allows('update', $project);
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
            'lists' => ['required', 'array'],
            'lists.*.id' => [
                'required',
                'integer',
                'exists:lists,id',
                function ($attribute, $value, $fail) use ($project) {
                    // Verify the list belongs to this project
                    if ($project && ! $project->lists()->where('id', $value)->exists()) {
                        $fail('The list does not belong to this project.');
                    }
                },
            ],
            'lists.*.position' => ['required', 'integer', 'min:0'],
        ];
    }
}
