<?php

namespace App\Http\Requests\Billing;

use App\Models\Plan;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
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
                    // Validate that the plan ID looks like a real Stripe Price ID
                    if (! str_starts_with($value, 'price_') || strlen($value) < 20) {
                        $fail('Invalid plan identifier format.');

                        return;
                    }

                    $plan = Plan::findByStripeId($value);

                    if (! $plan) {
                        $fail('The selected plan does not exist.');

                        return;
                    }

                    if (! $plan->is_active) {
                        $fail('The selected plan is no longer available.');

                        return;
                    }

                    // Check if user already has this exact subscription
                    $user = $this->user();
                    if ($user->subscribed('default') && $user->subscription('default')->hasPrice($value)) {
                        $fail('You are already subscribed to this plan.');
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
            'plan_id.required' => 'Please select a plan to subscribe.',
        ];
    }
}
