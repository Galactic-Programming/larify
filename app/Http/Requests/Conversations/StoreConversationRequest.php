<?php

namespace App\Http\Requests\Conversations;

use App\Enums\ConversationType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreConversationRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::enum(ConversationType::class)],
            'name' => [
                'nullable',
                'required_if:type,group',
                'string',
                'max:255',
            ],
            'avatar' => ['nullable', 'string', 'max:255'],
            'participant_ids' => ['required', 'array', 'min:1'],
            'participant_ids.*' => [
                'required',
                'integer',
                'exists:users,id',
                function ($attribute, $value, $fail) {
                    if ((int) $value === auth()->id()) {
                        $fail('You cannot add yourself as a participant.');
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
            'name.required_if' => 'Group conversations must have a name.',
            'participant_ids.required' => 'At least one participant is required.',
            'participant_ids.min' => 'At least one participant is required.',
            'participant_ids.*.exists' => 'One or more selected users do not exist.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // For direct messages, only one participant is allowed
        if ($this->type === 'direct' && is_array($this->participant_ids) && count($this->participant_ids) > 1) {
            $this->merge([
                'participant_ids' => [array_values($this->participant_ids)[0]],
            ]);
        }
    }
}
