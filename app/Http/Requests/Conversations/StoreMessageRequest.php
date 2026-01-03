<?php

namespace App\Http\Requests\Conversations;

use App\Models\Conversation;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;

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
     * Allowed MIME types for file uploads.
     * This validates actual file content, not just extension.
     *
     * @var array<string>
     */
    private const ALLOWED_MIME_TYPES = [
        // Images
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/bmp',
        'image/tiff',
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'application/rtf',
        // Archives
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        'application/gzip',
        // Audio
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/ogg',
        'audio/webm',
        'audio/aac',
        'audio/flac',
        // Video
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-matroska',
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
        return [
            'content' => ['required_without:attachments', 'nullable', 'string', 'max:10000'],
            'attachments' => ['nullable', 'array', 'max:10'],
            'attachments.*' => [
                'file',
                'max:10240', // 10MB max per file
                $this->blockedExtensionsRule(),
                $this->allowedMimeTypeRule(),
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
     * Create a validation rule to check actual MIME type of file content.
     * This prevents attackers from renaming malicious files.
     */
    private function allowedMimeTypeRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            if (! $value instanceof UploadedFile) {
                return;
            }

            // Get actual MIME type from file content (not from client)
            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            $actualMime = $finfo->file($value->getPathname());

            if ($actualMime === false) {
                $fail('Could not determine file type.');

                return;
            }

            if (! in_array($actualMime, self::ALLOWED_MIME_TYPES, true)) {
                $fail("File type '{$actualMime}' is not allowed.");
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
