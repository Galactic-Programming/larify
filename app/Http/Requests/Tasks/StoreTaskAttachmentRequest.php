<?php

namespace App\Http\Requests\Tasks;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\ValidationException;

class StoreTaskAttachmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        $plan = $user->plan;

        // Check if user can upload attachments
        if (! $plan->canUploadAttachments()) {
            return false;
        }

        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();
        $plan = $user->plan;
        $maxSize = $plan->maxAttachmentSize() / 1024; // Convert to KB for validation
        $allowedExtensions = $plan->allowedAttachmentExtensions();

        return [
            'files' => ['required', 'array', 'min:1', 'max:10'],
            'files.*' => [
                'required',
                'file',
                'max:'.$maxSize,
                'mimes:'.implode(',', $allowedExtensions),
            ],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $this->validateStorageLimit($validator);
        });
    }

    /**
     * Validate that uploading these files won't exceed storage limit.
     */
    protected function validateStorageLimit($validator): void
    {
        if (! $this->hasFile('files')) {
            return;
        }

        $user = $this->user();
        $plan = $user->plan;
        $maxStorage = $plan->maxAttachmentStorage();
        $currentUsed = $user->storage_used ?? 0;

        $totalNewSize = 0;
        foreach ($this->file('files') as $file) {
            $totalNewSize += $file->getSize();
        }

        if ($currentUsed + $totalNewSize > $maxStorage) {
            $remainingMB = round(($maxStorage - $currentUsed) / 1024 / 1024, 2);
            $validator->errors()->add(
                'files',
                "Storage limit exceeded. You have {$remainingMB} MB remaining."
            );
        }
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        $plan = $this->user()->plan;
        $maxSizeMB = $plan->maxAttachmentSize() / 1024 / 1024;

        return [
            'files.required' => 'Please select files to upload.',
            'files.array' => 'Invalid file format.',
            'files.max' => 'You can upload a maximum of 10 files at once.',
            'files.*.required' => 'Each file is required.',
            'files.*.file' => 'Invalid file upload.',
            'files.*.max' => "Each file cannot exceed {$maxSizeMB}MB.",
            'files.*.mimes' => 'File type not allowed for your plan. Upgrade to Pro for more file types.',
        ];
    }

    /**
     * Handle a failed authorization attempt.
     */
    protected function failedAuthorization(): void
    {
        throw ValidationException::withMessages([
            'files' => 'Task attachments are a Pro feature. Please upgrade to upload files.',
        ]);
    }
}
