<?php

namespace App\Http\Requests\Conversations;

use App\Models\Conversation;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreMessageRequest extends FormRequest
{
    /**
     * Dangerous file extensions that should be blocked for security reasons.
     * These include executables, scripts, and system files that could be malicious.
     *
     * @var array<string>
     */
    private const BLOCKED_EXTENSIONS = [
        // Executables
        'exe', 'msi', 'bat', 'cmd', 'com', 'scr', 'pif', 'application',
        // Scripts
        'php', 'php3', 'php4', 'php5', 'phtml', 'phar',
        'js', 'mjs', 'jsx', 'ts', 'tsx',
        'py', 'pyc', 'pyw',
        'rb', 'erb',
        'pl', 'pm', 'cgi',
        'sh', 'bash', 'zsh', 'fish',
        'ps1', 'psm1', 'psd1',
        'vbs', 'vbe', 'wsf', 'wsh',
        // System/Config
        'dll', 'sys', 'drv', 'ocx',
        'htaccess', 'htpasswd',
        'env', 'ini', 'cfg', 'conf',
        // Java
        'jar', 'class', 'jsp', 'jspx',
        // ASP
        'asp', 'aspx', 'ascx', 'ashx', 'asmx',
        // Other dangerous
        'reg', 'inf', 'lnk', 'url', 'scf',
        'hta', 'cpl', 'msc', 'gadget',
    ];

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
            'attachments.*' => [
                'file',
                'max:10240', // 10MB max per file
                $this->blockedExtensionsRule(),
            ],
        ];
    }

    /**
     * Create a validation rule to block dangerous file extensions.
     */
    private function blockedExtensionsRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            if (! $value instanceof UploadedFile) {
                return;
            }

            $extension = strtolower($value->getClientOriginalExtension());

            if (in_array($extension, self::BLOCKED_EXTENSIONS, true)) {
                $fail("Files with .{$extension} extension are not allowed for security reasons.");
            }
        };
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

    /**
     * Get the list of blocked file extensions.
     * This can be used by the frontend to validate files before upload.
     *
     * @return array<string>
     */
    public static function getBlockedExtensions(): array
    {
        return self::BLOCKED_EXTENSIONS;
    }
}
