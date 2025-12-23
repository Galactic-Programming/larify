<?php

namespace App\Http\Requests\Tasks;

use App\Enums\TaskPriority;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
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
        /** @var Project $project */
        $project = $this->route('project');
        /** @var Task $task */
        $task = $this->route('task');

        // Check if user can update deadline
        $canUpdateDeadline = Gate::allows('updateDeadline', [$task, $project]);

        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'priority' => ['sometimes', 'required', Rule::enum(TaskPriority::class)],
            'due_date' => [
                'sometimes',
                'required',
                'date',
                function ($attribute, $value, $fail) use ($canUpdateDeadline, $task) {
                    if (! $canUpdateDeadline && $value !== $task->due_date->format('Y-m-d')) {
                        $fail('You do not have permission to change the deadline of this task.');
                    }
                },
            ],
            'due_time' => [
                'sometimes',
                'required',
                'regex:/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/',
                function ($attribute, $value, $fail) use ($canUpdateDeadline, $task) {
                    // Normalize time format for comparison (remove seconds if present)
                    $normalizedValue = substr($value, 0, 5);
                    $normalizedTaskTime = substr($task->due_time, 0, 5);

                    if (! $canUpdateDeadline && $normalizedValue !== $normalizedTaskTime) {
                        $fail('You do not have permission to change the deadline of this task.');
                    }
                },
            ],
            'assigned_to' => [
                'nullable',
                'integer',
                'exists:users,id',
                function ($attribute, $value, $fail) use ($project) {
                    if ($value) {
                        // Check if user is project owner or member
                        $isMember = $project->user_id == $value
                            || $project->projectMembers()->where('user_id', $value)->exists();

                        if (! $isMember) {
                            $fail('The assigned user must be a member of the project.');

                            return;
                        }

                        // Only owner can change assignee (editors can't reassign)
                        if (! $project->canAssignTask(auth()->user())) {
                            $fail('You do not have permission to assign tasks.');
                        }
                    }
                },
            ],
        ];
    }
}
