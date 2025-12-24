<?php

namespace App\Http\Requests\Projects;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Checks if user has reached their project limit based on plan.
     */
    public function authorize(): bool
    {
        return $this->user()->canCreateProject();
    }

    /**
     * Handle a failed authorization attempt.
     *
     * @throws AuthorizationException
     */
    protected function failedAuthorization(): void
    {
        $user = $this->user();
        $max = $user->plan?->maxProjects() ?? 3;

        throw new AuthorizationException(
            "You have reached the maximum of {$max} projects for your plan. Please upgrade to Pro for unlimited projects."
        );
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'color' => ['required', 'string', 'max:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'icon' => ['nullable', 'string', 'max:50'],
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
            'color.regex' => 'The color must be a valid hex color code (e.g., #6366f1).',
        ];
    }
}
