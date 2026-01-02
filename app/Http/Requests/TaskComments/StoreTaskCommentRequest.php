<?php

namespace App\Http\Requests\TaskComments;

use App\Enums\UserPlan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreTaskCommentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $task = $this->route('task');
        $project = $this->route('project');

        // Must be a project member
        if (! Gate::allows('view', $project)) {
            return false;
        }

        // Check if user's plan allows creating comments
        $user = $this->user();
        $plan = $user->plan ?? UserPlan::Free;

        return $plan->canCreateComments();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'content' => ['required', 'string', 'max:10000'],
        ];
    }

    /**
     * Get custom messages for validation errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'content.required' => 'Comment content is required.',
            'content.max' => 'Comment cannot exceed 10,000 characters.',
        ];
    }
}
