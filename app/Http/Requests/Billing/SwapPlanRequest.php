<?php

namespace App\Http\Requests\Billing;

use App\Models\Plan;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SwapPlanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Merge route parameter into request data for validation
        $this->merge([
            'plan_id' => $this->route('plan'),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'plan_id' => [
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    $plan = Plan::findByStripeId($value);

                    if (! $plan) {
                        $fail('The selected plan does not exist.');

                        return;
                    }

                    if (! $plan->is_active) {
                        $fail('The selected plan is no longer available.');
                    }
                },
            ],
        ];
    }

    /**
     * Get the validated Plan model.
     */
    public function plan(): ?Plan
    {
        return Plan::findByStripeId($this->route('plan'));
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'plan_id.required' => 'Please select a plan.',
        ];
    }
}
