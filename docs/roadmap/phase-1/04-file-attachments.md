# 📎 File Attachments

## Tổng quan

Cho phép users đính kèm files vào tasks để chia sẻ tài liệu, hình ảnh, và các tài nguyên liên quan.

| Attribute        | Value                                                 |
| ---------------- | ----------------------------------------------------- |
| **Priority**     | 🟢 High                                               |
| **Effort**       | 🟡 Medium (3-5 days)                                  |
| **Plan**         | Free: 5MB/file, 50MB total, Pro: 25MB/file, 1GB total |
| **Dependencies** | Storage (local/S3)                                    |

---

## 📋 Requirements

### Functional Requirements

1. **File Upload**
    - Upload files cho tasks
    - Drag & drop support
    - Multiple file upload
    - Progress indicator

2. **File Management**
    - View/Preview files
    - Download files
    - Delete files
    - File thumbnails (images)

3. **Supported File Types**
    - Images: jpg, png, gif, webp, svg
    - Documents: pdf, doc, docx, xls, xlsx, ppt, pptx
    - Text: txt, md, csv, json
    - Archives: zip, rar

### Plan Limits

| Feature          | Free  | Pro   |
| ---------------- | ----- | ----- |
| Max file size    | 5 MB  | 25 MB |
| Storage per user | 50 MB | 1 GB  |
| File types       | Basic | All   |

---

## 🗃️ Database Schema

### Existing Table (Cần verify/update)

```php
// database/migrations/xxxx_create_attachments_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            $table->morphs('attachable'); // task_id/message_id polymorphic
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('disk')->default('local');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type');
            $table->unsignedBigInteger('size'); // bytes
            $table->json('metadata')->nullable(); // width, height for images, etc.
            $table->timestamps();

            $table->index(['attachable_type', 'attachable_id']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attachments');
    }
};
```

### User Storage Tracking

```php
// Add to users table
Schema::table('users', function (Blueprint $table) {
    $table->unsignedBigInteger('storage_used')->default(0)->after('plan');
});
```

---

## 🏗️ Implementation

### Step 1: Update UserPlan.php

```php
// app/Enums/UserPlan.php

/**
 * Get maximum file size in bytes.
 */
public function maxFileSize(): int
{
    return match ($this) {
        self::Free => 5 * 1024 * 1024,   // 5 MB
        self::Pro => 25 * 1024 * 1024,    // 25 MB
    };
}

/**
 * Get maximum storage in bytes.
 */
public function maxStorage(): int
{
    return match ($this) {
        self::Free => 50 * 1024 * 1024,   // 50 MB
        self::Pro => 1024 * 1024 * 1024,  // 1 GB
    };
}

/**
 * Get allowed file extensions.
 */
public function allowedFileExtensions(): array
{
    $basic = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt', 'md'];

    return match ($this) {
        self::Free => $basic,
        self::Pro => array_merge($basic, [
            'svg', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
            'csv', 'json', 'zip', 'rar',
        ]),
    };
}

/**
 * Check if user can upload files.
 */
public function canUploadFiles(): bool
{
    return true; // Both plans can upload, just with different limits
}

// Update getLimits()
public function getLimits(): array
{
    return [
        // ... existing limits
        'max_file_size' => $this->maxFileSize(),
        'max_file_size_mb' => $this->maxFileSize() / 1024 / 1024,
        'max_storage' => $this->maxStorage(),
        'max_storage_mb' => $this->maxStorage() / 1024 / 1024,
        'allowed_extensions' => $this->allowedFileExtensions(),
    ];
}
```

### Step 2: Create Attachment Model

```php
// app/Models/Attachment.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Facades\Storage;

class Attachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'attachable_type',
        'attachable_id',
        'user_id',
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'size' => 'integer',
            'metadata' => 'array',
        ];
    }

    public function attachable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the full URL to the file.
     */
    public function getUrlAttribute(): string
    {
        return Storage::disk($this->disk)->url($this->path);
    }

    /**
     * Get the download URL.
     */
    public function getDownloadUrlAttribute(): string
    {
        return route('attachments.download', $this);
    }

    /**
     * Check if this is an image.
     */
    public function isImage(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    /**
     * Check if this is a PDF.
     */
    public function isPdf(): bool
    {
        return $this->mime_type === 'application/pdf';
    }

    /**
     * Get human-readable file size.
     */
    public function getHumanSizeAttribute(): string
    {
        $bytes = $this->size;
        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Get file extension.
     */
    public function getExtensionAttribute(): string
    {
        return pathinfo($this->original_name, PATHINFO_EXTENSION);
    }

    /**
     * Delete the file from storage when model is deleted.
     */
    protected static function booted(): void
    {
        static::deleting(function (Attachment $attachment) {
            Storage::disk($attachment->disk)->delete($attachment->path);

            // Update user's storage used
            $attachment->user->decrement('storage_used', $attachment->size);
        });
    }
}
```

### Step 3: Update Task Model

```php
// app/Models/Task.php

public function attachments(): MorphMany
{
    return $this->morphMany(Attachment::class, 'attachable');
}
```

### Step 4: Create Controller

```php
// app/Http/Controllers/Attachments/AttachmentController.php
<?php

namespace App\Http\Controllers\Attachments;

use App\Http\Controllers\Controller;
use App\Models\Attachment;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Intervention\Image\Facades\Image;

class AttachmentController extends Controller
{
    /**
     * Upload attachments to a task.
     */
    public function store(Request $request, Project $project, Task $task)
    {
        $this->authorize('update', $project);
        abort_if($task->project_id !== $project->id, 404);

        $user = $request->user();
        $plan = $user->plan;

        // Validate files
        $maxSize = $plan->maxFileSize();
        $allowedExtensions = $plan->allowedFileExtensions();

        $request->validate([
            'files' => ['required', 'array', 'max:10'],
            'files.*' => [
                'required',
                'file',
                'max:' . ($maxSize / 1024), // KB for validation
            ],
        ]);

        $attachments = [];
        $totalNewSize = 0;

        foreach ($request->file('files') as $file) {
            // Check extension
            $extension = strtolower($file->getClientOriginalExtension());
            if (!in_array($extension, $allowedExtensions)) {
                throw ValidationException::withMessages([
                    'files' => "File type .{$extension} is not allowed for your plan.",
                ]);
            }

            $totalNewSize += $file->getSize();
        }

        // Check storage limit
        $maxStorage = $plan->maxStorage();
        $currentUsed = $user->storage_used;

        if ($currentUsed + $totalNewSize > $maxStorage) {
            $remaining = round(($maxStorage - $currentUsed) / 1024 / 1024, 2);
            throw ValidationException::withMessages([
                'files' => "Storage limit exceeded. You have {$remaining} MB remaining.",
            ]);
        }

        // Process and store files
        foreach ($request->file('files') as $file) {
            $path = $file->store("attachments/{$project->id}/{$task->id}", 'public');

            $metadata = [];

            // Get image dimensions if applicable
            if (str_starts_with($file->getMimeType(), 'image/')) {
                try {
                    $image = Image::make($file);
                    $metadata['width'] = $image->width();
                    $metadata['height'] = $image->height();
                } catch (\Exception $e) {
                    // Ignore image processing errors
                }
            }

            $attachment = $task->attachments()->create([
                'user_id' => $user->id,
                'disk' => 'public',
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'metadata' => $metadata,
            ]);

            $attachments[] = $attachment;
        }

        // Update user's storage used
        $user->increment('storage_used', $totalNewSize);

        return response()->json([
            'attachments' => $attachments,
            'storage_used' => $user->fresh()->storage_used,
        ], 201);
    }

    /**
     * Show/preview an attachment.
     */
    public function show(Attachment $attachment)
    {
        // Check access via the attachable's project
        $task = $attachment->attachable;
        $this->authorize('view', $task->project);

        return response()->file(
            Storage::disk($attachment->disk)->path($attachment->path)
        );
    }

    /**
     * Download an attachment.
     */
    public function download(Attachment $attachment)
    {
        $task = $attachment->attachable;
        $this->authorize('view', $task->project);

        return Storage::disk($attachment->disk)->download(
            $attachment->path,
            $attachment->original_name
        );
    }

    /**
     * Delete an attachment.
     */
    public function destroy(Request $request, Project $project, Task $task, Attachment $attachment)
    {
        $this->authorize('update', $project);
        abort_if($task->project_id !== $project->id, 404);
        abort_if($attachment->attachable_id !== $task->id, 404);

        $user = $request->user();

        // Only uploader or project owner can delete
        if ($attachment->user_id !== $user->id && $project->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $attachment->delete();

        return response()->json([
            'message' => 'Attachment deleted',
            'storage_used' => $user->fresh()->storage_used,
        ]);
    }
}
```

### Step 5: Routes

```php
// routes/web.php

Route::middleware(['auth', 'verified'])->group(function () {
    // Task attachments
    Route::post('projects/{project}/tasks/{task}/attachments', [AttachmentController::class, 'store'])
        ->name('projects.tasks.attachments.store');
    Route::delete('projects/{project}/tasks/{task}/attachments/{attachment}', [AttachmentController::class, 'destroy'])
        ->name('projects.tasks.attachments.destroy');
});

// Public routes (with signed URLs or auth check)
Route::get('attachments/{attachment}', [AttachmentController::class, 'show'])
    ->name('attachments.show')
    ->middleware('auth');
Route::get('attachments/{attachment}/download', [AttachmentController::class, 'download'])
    ->name('attachments.download')
    ->middleware('auth');
```

---

## 🎨 Frontend Implementation

### File Upload Component

```tsx
// resources/js/components/attachments/file-upload.tsx
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePlanLimits } from '@/hooks/use-plan-limits';
import { CloudUploadIcon, FileIcon, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
    projectId: number;
    taskId: number;
    onSuccess: () => void;
}

export function FileUpload({ projectId, taskId, onSuccess }: FileUploadProps) {
    const limits = usePlanLimits();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);

    const maxSize = limits?.max_file_size ?? 5 * 1024 * 1024;
    const allowedExtensions = limits?.allowed_extensions ?? [];

    const onDrop = useCallback(
        (acceptedFiles: File[], rejectedFiles: any[]) => {
            setError(null);

            if (rejectedFiles.length > 0) {
                const error = rejectedFiles[0].errors[0];
                if (error.code === 'file-too-large') {
                    setError(
                        `File too large. Max size is ${limits?.max_file_size_mb ?? 5}MB`,
                    );
                } else {
                    setError(error.message);
                }
                return;
            }

            setFiles((prev) => [...prev, ...acceptedFiles]);
        },
        [limits],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxSize,
        accept: allowedExtensions.reduce(
            (acc, ext) => {
                // Map extensions to MIME types (simplified)
                const mimeMap: Record<string, string> = {
                    jpg: 'image/jpeg',
                    jpeg: 'image/jpeg',
                    png: 'image/png',
                    gif: 'image/gif',
                    webp: 'image/webp',
                    pdf: 'application/pdf',
                    // Add more as needed
                };
                if (mimeMap[ext]) {
                    acc[mimeMap[ext]] = [`.${ext}`];
                }
                return acc;
            },
            {} as Record<string, string[]>,
        ),
    });

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files[]', file);
        });

        try {
            await axios.post(
                `/projects/${projectId}/tasks/${taskId}/attachments`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress: (e) => {
                        if (e.total) {
                            setProgress(Math.round((e.loaded / e.total) * 100));
                        }
                    },
                },
            );

            setFiles([]);
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    return (
        <div className="space-y-4">
            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={cn(
                    'cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors',
                    isDragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-primary',
                )}
            >
                <input {...getInputProps()} />
                <CloudUploadIcon className="text-muted-foreground mx-auto mb-2 size-8" />
                <p className="text-muted-foreground text-sm">
                    {isDragActive
                        ? 'Drop files here...'
                        : 'Drag & drop files, or click to browse'}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                    Max {limits?.max_file_size_mb ?? 5}MB per file
                </p>
            </div>

            {/* Error */}
            {error && <p className="text-destructive text-sm">{error}</p>}

            {/* Selected files */}
            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="bg-muted flex items-center gap-2 rounded-lg p-2"
                        >
                            <FileIcon className="text-muted-foreground size-4" />
                            <span className="flex-1 truncate text-sm">
                                {file.name}
                            </span>
                            <span className="text-muted-foreground text-xs">
                                {(file.size / 1024).toFixed(1)} KB
                            </span>
                            <button
                                onClick={() => removeFile(index)}
                                className="hover:bg-background rounded p-1"
                            >
                                <XIcon className="size-3" />
                            </button>
                        </div>
                    ))}

                    {uploading && <Progress value={progress} className="h-2" />}

                    <Button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="w-full"
                    >
                        {uploading
                            ? `Uploading... ${progress}%`
                            : `Upload ${files.length} file(s)`}
                    </Button>
                </div>
            )}
        </div>
    );
}
```

### Attachment List Component

```tsx
// resources/js/components/attachments/attachment-list.tsx
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    FileIcon,
    ImageIcon,
    DownloadIcon,
    TrashIcon,
    MoreVerticalIcon,
    FileTextIcon,
} from 'lucide-react';

interface Attachment {
    id: number;
    original_name: string;
    mime_type: string;
    size: number;
    human_size: string;
    url: string;
    download_url: string;
    metadata?: {
        width?: number;
        height?: number;
    };
}

interface AttachmentListProps {
    attachments: Attachment[];
    projectId: number;
    taskId: number;
    canDelete: boolean;
    onDelete: (id: number) => void;
}

export function AttachmentList({
    attachments,
    canDelete,
    onDelete,
}: AttachmentListProps) {
    const getIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return ImageIcon;
        if (mimeType === 'application/pdf') return FileTextIcon;
        return FileIcon;
    };

    if (attachments.length === 0) {
        return (
            <p className="text-muted-foreground py-4 text-center text-sm">
                No attachments yet
            </p>
        );
    }

    return (
        <div className="space-y-2">
            {attachments.map((attachment) => {
                const Icon = getIcon(attachment.mime_type);
                const isImage = attachment.mime_type.startsWith('image/');

                return (
                    <div
                        key={attachment.id}
                        className="hover:bg-muted group flex items-center gap-3 rounded-lg p-2"
                    >
                        {/* Thumbnail or Icon */}
                        {isImage ? (
                            <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0"
                            >
                                <img
                                    src={attachment.url}
                                    alt={attachment.original_name}
                                    className="size-12 rounded object-cover"
                                />
                            </a>
                        ) : (
                            <div className="bg-muted flex size-12 items-center justify-center rounded">
                                <Icon className="text-muted-foreground size-6" />
                            </div>
                        )}

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                            <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block truncate text-sm font-medium hover:underline"
                            >
                                {attachment.original_name}
                            </a>
                            <p className="text-muted-foreground text-xs">
                                {attachment.human_size}
                                {attachment.metadata?.width && (
                                    <span>
                                        {' '}
                                        • {attachment.metadata.width}×
                                        {attachment.metadata.height}
                                    </span>
                                )}
                            </p>
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="opacity-0 group-hover:opacity-100"
                                >
                                    <MoreVerticalIcon className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <a href={attachment.download_url}>
                                        <DownloadIcon className="mr-2 size-4" />
                                        Download
                                    </a>
                                </DropdownMenuItem>
                                {canDelete && (
                                    <DropdownMenuItem
                                        onClick={() => onDelete(attachment.id)}
                                        className="text-destructive"
                                    >
                                        <TrashIcon className="mr-2 size-4" />
                                        Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            })}
        </div>
    );
}
```

### Storage Usage Component

```tsx
// resources/js/components/attachments/storage-usage.tsx
import { Progress } from '@/components/ui/progress';
import { usePlanLimits } from '@/hooks/use-plan-limits';

export function StorageUsage() {
    const limits = usePlanLimits();

    if (!limits) return null;

    const used = limits.storage_used ?? 0;
    const max = limits.max_storage ?? 50 * 1024 * 1024;
    const percentage = Math.round((used / max) * 100);

    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Storage used</span>
                <span>
                    {formatSize(used)} / {formatSize(max)}
                </span>
            </div>
            <Progress value={percentage} className="h-2" />
            {percentage > 80 && (
                <p className="text-xs text-amber-600">
                    {percentage >= 100
                        ? 'Storage full. Delete files or upgrade to Pro.'
                        : 'Running low on storage. Consider upgrading to Pro.'}
                </p>
            )}
        </div>
    );
}
```

---

## 🧪 Testing

```php
// tests/Feature/AttachmentTest.php
<?php

use App\Enums\UserPlan;
use App\Models\Attachment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('public');

    $this->user = User::factory()->create(['plan' => UserPlan::Pro, 'storage_used' => 0]);
    $this->project = Project::factory()->create(['user_id' => $this->user->id]);
    $this->task = Task::factory()->create(['project_id' => $this->project->id]);
});

it('can upload a file to a task', function () {
    $file = UploadedFile::fake()->image('test.jpg', 100, 100)->size(1024); // 1MB

    $this->actingAs($this->user)
        ->postJson("/projects/{$this->project->id}/tasks/{$this->task->id}/attachments", [
            'files' => [$file],
        ])
        ->assertCreated()
        ->assertJsonStructure([
            'attachments' => [['id', 'original_name', 'mime_type', 'size']],
        ]);

    expect($this->task->attachments()->count())->toBe(1);
    expect($this->user->fresh()->storage_used)->toBeGreaterThan(0);
});

it('rejects files exceeding size limit for Free plan', function () {
    $user = User::factory()->create(['plan' => UserPlan::Free]);
    $project = Project::factory()->create(['user_id' => $user->id]);
    $task = Task::factory()->create(['project_id' => $project->id]);

    $file = UploadedFile::fake()->create('large.pdf', 6 * 1024); // 6MB > 5MB limit

    $this->actingAs($user)
        ->postJson("/projects/{$project->id}/tasks/{$task->id}/attachments", [
            'files' => [$file],
        ])
        ->assertUnprocessable();
});

it('rejects unsupported file types for Free plan', function () {
    $user = User::factory()->create(['plan' => UserPlan::Free]);
    $project = Project::factory()->create(['user_id' => $user->id]);
    $task = Task::factory()->create(['project_id' => $project->id]);

    $file = UploadedFile::fake()->create('document.docx', 100);

    $this->actingAs($user)
        ->postJson("/projects/{$project->id}/tasks/{$task->id}/attachments", [
            'files' => [$file],
        ])
        ->assertUnprocessable();
});

it('rejects when storage limit exceeded', function () {
    $this->user->update(['storage_used' => 1024 * 1024 * 1024 - 1000]); // Almost at 1GB limit

    $file = UploadedFile::fake()->image('test.jpg')->size(2 * 1024); // 2MB

    $this->actingAs($this->user)
        ->postJson("/projects/{$this->project->id}/tasks/{$this->task->id}/attachments", [
            'files' => [$file],
        ])
        ->assertUnprocessable();
});

it('allows downloading attachments', function () {
    $file = UploadedFile::fake()->image('test.jpg');

    $attachment = $this->task->attachments()->create([
        'user_id' => $this->user->id,
        'disk' => 'public',
        'path' => $file->store('attachments', 'public'),
        'original_name' => 'test.jpg',
        'mime_type' => 'image/jpeg',
        'size' => $file->getSize(),
    ]);

    $this->actingAs($this->user)
        ->get("/attachments/{$attachment->id}/download")
        ->assertOk()
        ->assertDownload('test.jpg');
});

it('decrements storage when attachment deleted', function () {
    $file = UploadedFile::fake()->image('test.jpg')->size(1024);

    $this->actingAs($this->user)
        ->postJson("/projects/{$this->project->id}/tasks/{$this->task->id}/attachments", [
            'files' => [$file],
        ]);

    $storageBefore = $this->user->fresh()->storage_used;
    $attachment = $this->task->attachments()->first();

    $this->actingAs($this->user)
        ->deleteJson("/projects/{$this->project->id}/tasks/{$this->task->id}/attachments/{$attachment->id}")
        ->assertOk();

    expect($this->user->fresh()->storage_used)->toBeLessThan($storageBefore);
});
```

---

## ✅ Checklist

- [ ] Create/update `attachments` table migration
- [ ] Add `storage_used` column to `users` table
- [ ] Create `Attachment` model
- [ ] Update `Task` model with attachments relationship
- [ ] Add storage/file methods to `UserPlan` enum
- [ ] Create `AttachmentController`
- [ ] Configure storage disk (local or S3)
- [ ] Add routes
- [ ] Install `intervention/image` for image processing (optional)
- [ ] Create `FileUpload` component
- [ ] Create `AttachmentList` component
- [ ] Create `StorageUsage` component
- [ ] Update task detail sheet to show attachments
- [ ] Add storage usage to settings page
- [ ] Write tests
- [ ] Create `AttachmentFactory` for testing

---

## 📚 References

- [Laravel File Storage](https://laravel.com/docs/filesystem)
- [React Dropzone](https://react-dropzone.js.org/)
- [Intervention Image](http://image.intervention.io/)
- Trello Attachments: [Trello Card Attachments](https://support.atlassian.com/trello/docs/adding-attachments-to-cards/)
