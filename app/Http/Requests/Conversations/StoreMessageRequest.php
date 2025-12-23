<?php

namespace App\Http\Requests\Conversations;

use App\Models\Conversation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreMessageRequest extends FormRequest
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

        return Gate::allows('sendMessage', $conversation);
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
            'content' => ['required_without:attachments', 'nullable', 'string', 'max:10000'],
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('messages', 'id')->where('conversation_id', $conversation->id),
            ],
            'attachments' => ['nullable', 'array', 'max:10'],
            'attachments.*' => ['file', 'max:10240'], // 10MB max per file
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
            'content.required_without' => 'Message content or attachments are required.',
            'content.max' => 'Message cannot exceed 10,000 characters.',
            'parent_id.exists' => 'The message you are replying to does not exist.',
            'attachments.max' => 'You can upload a maximum of 10 files.',
            'attachments.*.max' => 'Each file cannot exceed 10MB.',
        ];
    }
}
