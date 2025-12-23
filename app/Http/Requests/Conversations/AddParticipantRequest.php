<?php

namespace App\Http\Requests\Conversations;

use App\Models\Conversation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class AddParticipantRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $conversation = $this->route('conversation');

        if (! $conversation instanceof Conversation) {
            return false;
        }

        // Only group owners can add participants
        return Gate::allows('manageParticipants', $conversation);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Conversation $conversation */
        $conversation = $this->route('conversation');

        return [
            'user_id' => [
                'required',
                'integer',
                'exists:users,id',
                // User must not already be an active participant
                Rule::unique('conversation_participants')
                    ->where('conversation_id', $conversation->id)
                    ->whereNull('left_at'),
                // Cannot add yourself
                function ($attribute, $value, $fail) {
                    if ((int) $value === auth()->id()) {
                        $fail('You cannot add yourself to the conversation.');
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
            'user_id.required' => 'Please select a user to add.',
            'user_id.exists' => 'The selected user does not exist.',
            'user_id.unique' => 'This user is already a participant.',
        ];
    }
}
