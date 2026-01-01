# 💬 Task Comments

## Tổng quan

Cho phép team members thảo luận và trao đổi trực tiếp trên từng task.

| Attribute        | Value                           |
| ---------------- | ------------------------------- |
| **Priority**     | 🟢 High                         |
| **Effort**       | 🟡 Medium (3-5 days)            |
| **Plan**         | Free: Read-only, Pro: Full CRUD |
| **Dependencies** | Real-time system (✅ có sẵn)    |

---

## 📋 Requirements

### Functional Requirements

1. **Comment CRUD**
    - Tạo comment trên task
    - Edit comment (chỉ owner)
    - Delete comment (owner hoặc project owner)
    - Reply to comment (nested/threaded)

2. **Rich Features**
    - @mention team members
    - Reactions (emoji) trên comments
    - Attachments trong comment (Phase 2)

3. **Real-time**
    - Comment mới hiển thị ngay lập tức
    - Typing indicator (optional)

### Plan Limits

| Feature         | Free | Pro |
| --------------- | ---- | --- |
| View comments   | ✅   | ✅  |
| Create comments | ❌   | ✅  |
| Edit/Delete own | ❌   | ✅  |
| @mentions       | ❌   | ✅  |
| Reactions       | ❌   | ✅  |

---

## 🗃️ Database Schema

### Existing Table Check

```sql
-- Kiểm tra bảng comments đã có
DESCRIBE comments;
```

### Migration (if needed or update)

```php
// database/migrations/xxxx_create_comments_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('comments')->nullOnDelete();
            $table->text('content');
            $table->boolean('is_edited')->default(false);
            $table->timestamp('edited_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['task_id', 'created_at']);
            $table->index('parent_id');
        });

        // Comment reactions (reuse pattern from messages)
        Schema::create('comment_reactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('emoji', 50);
            $table->timestamps();

            $table->unique(['comment_id', 'user_id', 'emoji']);
            $table->index(['comment_id', 'emoji']);
        });

        // Comment mentions
        Schema::create('comment_mentions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('comment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['comment_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comment_mentions');
        Schema::dropIfExists('comment_reactions');
        Schema::dropIfExists('comments');
    }
};
```

---

## 🏗️ Implementation

### Step 1: Update UserPlan.php

```php
// app/Enums/UserPlan.php

/**
 * Check if this plan can create task comments.
 */
public function canCreateComments(): bool
{
    return $this === self::Pro;
}

// Update getLimits()
public function getLimits(): array
{
    return [
        // ... existing limits
        'can_create_comments' => $this->canCreateComments(),
    ];
}
```

### Step 2: Create Models

```php
// app/Models/Comment.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Comment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'task_id',
        'user_id',
        'parent_id',
        'content',
        'is_edited',
        'edited_at',
    ];

    protected function casts(): array
    {
        return [
            'is_edited' => 'boolean',
            'edited_at' => 'datetime',
        ];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(Comment::class, 'parent_id');
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(CommentReaction::class);
    }

    public function mentions(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'comment_mentions')
            ->withTimestamps();
    }

    /**
     * Extract mentioned user IDs from content.
     * Format: @[username](user_id)
     */
    public function extractMentions(): array
    {
        preg_match_all('/@\[([^\]]+)\]\((\d+)\)/', $this->content, $matches);
        return array_map('intval', $matches[2] ?? []);
    }

    /**
     * Get content with mentions rendered as HTML.
     */
    public function getRenderedContentAttribute(): string
    {
        return preg_replace(
            '/@\[([^\]]+)\]\((\d+)\)/',
            '<span class="mention" data-user-id="$2">@$1</span>',
            e($this->content)
        );
    }
}
```

```php
// app/Models/CommentReaction.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommentReaction extends Model
{
    protected $fillable = [
        'comment_id',
        'user_id',
        'emoji',
    ];

    public function comment(): BelongsTo
    {
        return $this->belongsTo(Comment::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

### Step 3: Update Task Model

```php
// app/Models/Task.php

public function comments(): HasMany
{
    return $this->hasMany(Comment::class);
}

public function rootComments(): HasMany
{
    return $this->hasMany(Comment::class)->whereNull('parent_id');
}
```

### Step 4: Create Controller

```php
// app/Http/Controllers/Tasks/CommentController.php
<?php

namespace App\Http\Controllers\Tasks;

use App\Events\CommentCreated;
use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use App\Notifications\TaskCommentNotification;
use App\Notifications\MentionedInCommentNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CommentController extends Controller
{
    public function index(Project $project, Task $task)
    {
        $this->authorize('view', $project);
        abort_if($task->project_id !== $project->id, 404);

        $comments = $task->rootComments()
            ->with([
                'user:id,name,avatar',
                'replies' => fn($q) => $q->with('user:id,name,avatar')->latest(),
                'reactions' => fn($q) => $q->select('comment_id', 'emoji', \DB::raw('count(*) as count'))->groupBy('comment_id', 'emoji'),
                'mentions:id,name',
            ])
            ->latest()
            ->paginate(20);

        return response()->json($comments);
    }

    public function store(Request $request, Project $project, Task $task)
    {
        $this->authorize('view', $project);
        abort_if($task->project_id !== $project->id, 404);

        // Check Pro plan
        $user = $request->user();
        if (!$user->plan?->canCreateComments()) {
            return response()->json([
                'message' => 'Creating comments requires a Pro plan.',
            ], 403);
        }

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:5000'],
            'parent_id' => ['nullable', 'exists:comments,id'],
        ]);

        // Verify parent belongs to same task
        if ($validated['parent_id']) {
            $parent = Comment::find($validated['parent_id']);
            abort_if($parent->task_id !== $task->id, 422, 'Invalid parent comment');
        }

        $comment = $task->comments()->create([
            'user_id' => $user->id,
            'content' => $validated['content'],
            'parent_id' => $validated['parent_id'] ?? null,
        ]);

        // Process mentions
        $mentionedIds = $comment->extractMentions();
        if (!empty($mentionedIds)) {
            // Filter to project members only
            $validMentions = $project->members()->whereIn('users.id', $mentionedIds)->pluck('users.id');
            $comment->mentions()->sync($validMentions);

            // Notify mentioned users
            foreach ($validMentions as $mentionedUserId) {
                if ($mentionedUserId !== $user->id) {
                    $mentionedUser = \App\Models\User::find($mentionedUserId);
                    $mentionedUser->notify(new MentionedInCommentNotification($comment));
                }
            }
        }

        // Notify task assignee (if not the commenter)
        if ($task->assigned_to && $task->assigned_to !== $user->id) {
            $task->assignee->notify(new TaskCommentNotification($comment));
        }

        // Broadcast for real-time update
        broadcast(new CommentCreated($comment))->toOthers();

        $comment->load('user:id,name,avatar');

        return response()->json(['comment' => $comment], 201);
    }

    public function update(Request $request, Project $project, Task $task, Comment $comment)
    {
        $this->authorize('view', $project);
        abort_if($task->project_id !== $project->id, 404);
        abort_if($comment->task_id !== $task->id, 404);

        // Only owner can edit
        if ($comment->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:5000'],
        ]);

        $comment->update([
            'content' => $validated['content'],
            'is_edited' => true,
            'edited_at' => now(),
        ]);

        // Re-process mentions
        $mentionedIds = $comment->extractMentions();
        $validMentions = $project->members()->whereIn('users.id', $mentionedIds)->pluck('users.id');
        $comment->mentions()->sync($validMentions);

        return response()->json(['comment' => $comment->fresh()]);
    }

    public function destroy(Request $request, Project $project, Task $task, Comment $comment)
    {
        $this->authorize('view', $project);
        abort_if($task->project_id !== $project->id, 404);
        abort_if($comment->task_id !== $task->id, 404);

        $user = $request->user();

        // Owner or project owner can delete
        $canDelete = $comment->user_id === $user->id || $project->user_id === $user->id;

        if (!$canDelete) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $comment->delete();

        return response()->json(['message' => 'Comment deleted']);
    }
}
```

### Step 5: Reaction Controller

```php
// app/Http/Controllers/Tasks/CommentReactionController.php
<?php

namespace App\Http\Controllers\Tasks;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\CommentReaction;
use Illuminate\Http\Request;

class CommentReactionController extends Controller
{
    public function toggle(Request $request, Comment $comment)
    {
        $user = $request->user();

        // Check Pro plan
        if (!$user->plan?->canCreateComments()) {
            return response()->json([
                'message' => 'Reactions require a Pro plan.',
            ], 403);
        }

        $validated = $request->validate([
            'emoji' => ['required', 'string', 'max:50'],
        ]);

        $existing = CommentReaction::where([
            'comment_id' => $comment->id,
            'user_id' => $user->id,
            'emoji' => $validated['emoji'],
        ])->first();

        if ($existing) {
            $existing->delete();
            $action = 'removed';
        } else {
            CommentReaction::create([
                'comment_id' => $comment->id,
                'user_id' => $user->id,
                'emoji' => $validated['emoji'],
            ]);
            $action = 'added';
        }

        $reactions = $comment->reactions()
            ->select('emoji', \DB::raw('count(*) as count'))
            ->groupBy('emoji')
            ->get();

        return response()->json([
            'action' => $action,
            'reactions' => $reactions,
        ]);
    }
}
```

### Step 6: Events & Notifications

```php
// app/Events/CommentCreated.php
<?php

namespace App\Events;

use App\Models\Comment;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CommentCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Comment $comment)
    {
        $this->comment->load('user:id,name,avatar');
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("task.{$this->comment->task_id}"),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'comment' => $this->comment->toArray(),
        ];
    }
}
```

```php
// app/Notifications/TaskCommentNotification.php
<?php

namespace App\Notifications;

use App\Models\Comment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class TaskCommentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Comment $comment) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'task_comment',
            'comment_id' => $this->comment->id,
            'task_id' => $this->comment->task_id,
            'task_title' => $this->comment->task?->title,
            'project_id' => $this->comment->task?->project_id,
            'commenter_id' => $this->comment->user_id,
            'commenter_name' => $this->comment->user?->name,
            'content_preview' => \Str::limit($this->comment->content, 100),
            'message' => "{$this->comment->user?->name} commented on \"{$this->comment->task?->title}\"",
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
```

### Step 7: Routes

```php
// routes/web.php

Route::middleware(['auth', 'verified'])->group(function () {
    // Task comments
    Route::get('projects/{project}/tasks/{task}/comments', [CommentController::class, 'index'])
        ->name('projects.tasks.comments.index');
    Route::post('projects/{project}/tasks/{task}/comments', [CommentController::class, 'store'])
        ->name('projects.tasks.comments.store');
    Route::patch('projects/{project}/tasks/{task}/comments/{comment}', [CommentController::class, 'update'])
        ->name('projects.tasks.comments.update');
    Route::delete('projects/{project}/tasks/{task}/comments/{comment}', [CommentController::class, 'destroy'])
        ->name('projects.tasks.comments.destroy');

    // Comment reactions
    Route::post('comments/{comment}/reactions', [CommentReactionController::class, 'toggle'])
        ->name('comments.reactions.toggle');
});
```

---

## 🎨 Frontend Implementation

### Comment List Component

```tsx
// resources/js/components/comments/comment-list.tsx
import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RelativeTime } from '@/components/kibo-ui/relative-time';
import { usePlanFeatures } from '@/hooks/use-plan-limits';
import {
    MessageSquareIcon,
    ReplyIcon,
    EditIcon,
    TrashIcon,
} from 'lucide-react';

interface Comment {
    id: number;
    content: string;
    is_edited: boolean;
    created_at: string;
    user: {
        id: number;
        name: string;
        avatar: string | null;
    };
    replies?: Comment[];
    reactions?: { emoji: string; count: number }[];
}

interface CommentListProps {
    taskId: number;
    projectId: number;
    comments: Comment[];
    onCommentAdded: () => void;
}

export function CommentList({
    taskId,
    projectId,
    comments,
    onCommentAdded,
}: CommentListProps) {
    const { canCreateComments } = usePlanFeatures();
    const [replyingTo, setReplyingTo] = useState<number | null>(null);

    const { data, setData, post, processing, reset } = useForm({
        content: '',
        parent_id: null as number | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/projects/${projectId}/tasks/${taskId}/comments`, {
            onSuccess: () => {
                reset();
                setReplyingTo(null);
                onCommentAdded();
            },
        });
    };

    return (
        <div className="space-y-4">
            <h3 className="flex items-center gap-2 font-semibold">
                <MessageSquareIcon className="size-4" />
                Comments ({comments.length})
            </h3>

            {/* Comment form */}
            {canCreateComments ? (
                <form onSubmit={handleSubmit} className="space-y-2">
                    <Textarea
                        placeholder="Write a comment..."
                        value={data.content}
                        onChange={(e) => setData('content', e.target.value)}
                        rows={3}
                    />
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={processing || !data.content.trim()}
                        >
                            Comment
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-sm">
                    <p>Upgrade to Pro to add comments</p>
                </div>
            )}

            {/* Comments list */}
            <div className="space-y-4">
                {comments.map((comment) => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        projectId={projectId}
                        taskId={taskId}
                        canComment={canCreateComments}
                        onReply={() => setReplyingTo(comment.id)}
                    />
                ))}
            </div>
        </div>
    );
}

function CommentItem({ comment, projectId, taskId, canComment, onReply }) {
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="flex gap-3">
            <Avatar className="size-8">
                <AvatarImage src={comment.user.avatar} />
                <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        {comment.user.name}
                    </span>
                    <RelativeTime
                        date={comment.created_at}
                        className="text-muted-foreground text-xs"
                    />
                    {comment.is_edited && (
                        <span className="text-muted-foreground text-xs">
                            (edited)
                        </span>
                    )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                    {comment.content}
                </p>

                {/* Actions */}
                {canComment && (
                    <div className="mt-2 flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={onReply}>
                            <ReplyIcon className="mr-1 size-3" />
                            Reply
                        </Button>
                        {/* Add edit/delete for owner */}
                    </div>
                )}

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 space-y-4 border-l-2 pl-4">
                        {comment.replies.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                projectId={projectId}
                                taskId={taskId}
                                canComment={canComment}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
```

### Mention Input Component

```tsx
// resources/js/components/comments/mention-input.tsx
import { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent } from '@/components/ui/popover';

interface User {
    id: number;
    name: string;
    avatar: string | null;
}

interface MentionInputProps {
    value: string;
    onChange: (value: string) => void;
    members: User[];
    placeholder?: string;
}

export function MentionInput({
    value,
    onChange,
    members,
    placeholder,
}: MentionInputProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const position = e.target.selectionStart;
        setCursorPosition(position);

        // Check if user is typing @mention
        const textBeforeCursor = newValue.slice(0, position);
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

        if (mentionMatch) {
            setSearchQuery(mentionMatch[1]);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }

        onChange(newValue);
    };

    const insertMention = (user: User) => {
        const textBeforeCursor = value.slice(0, cursorPosition);
        const textAfterCursor = value.slice(cursorPosition);
        const mentionStart = textBeforeCursor.lastIndexOf('@');

        const newValue =
            textBeforeCursor.slice(0, mentionStart) +
            `@[${user.name}](${user.id}) ` +
            textAfterCursor;

        onChange(newValue);
        setShowSuggestions(false);
        textareaRef.current?.focus();
    };

    const filteredMembers = members.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <div className="relative">
            <Textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
            />

            {showSuggestions && filteredMembers.length > 0 && (
                <div className="bg-popover absolute z-10 mt-1 w-64 rounded-md border shadow-lg">
                    {filteredMembers.map((user) => (
                        <button
                            key={user.id}
                            onClick={() => insertMention(user)}
                            className="hover:bg-muted flex w-full items-center gap-2 px-3 py-2"
                        >
                            <Avatar className="size-6">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>{user.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{user.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
```

---

## 🧪 Testing

```php
// tests/Feature/CommentTest.php
<?php

use App\Enums\UserPlan;
use App\Models\Comment;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['plan' => UserPlan::Pro]);
    $this->project = Project::factory()->create(['user_id' => $this->user->id]);
    $this->task = Task::factory()->create(['project_id' => $this->project->id]);
});

it('allows Pro users to create comments', function () {
    $this->actingAs($this->user)
        ->postJson("/projects/{$this->project->id}/tasks/{$this->task->id}/comments", [
            'content' => 'This is a test comment',
        ])
        ->assertCreated()
        ->assertJsonPath('comment.content', 'This is a test comment');

    expect($this->task->comments()->count())->toBe(1);
});

it('prevents Free users from creating comments', function () {
    $freeUser = User::factory()->create(['plan' => UserPlan::Free]);
    $this->project->members()->attach($freeUser->id, ['role' => 'editor']);

    $this->actingAs($freeUser)
        ->postJson("/projects/{$this->project->id}/tasks/{$this->task->id}/comments", [
            'content' => 'This is a test comment',
        ])
        ->assertForbidden();
});

it('allows Free users to view comments', function () {
    $freeUser = User::factory()->create(['plan' => UserPlan::Free]);
    $this->project->members()->attach($freeUser->id, ['role' => 'viewer']);

    Comment::factory()->create([
        'task_id' => $this->task->id,
        'user_id' => $this->user->id,
    ]);

    $this->actingAs($freeUser)
        ->getJson("/projects/{$this->project->id}/tasks/{$this->task->id}/comments")
        ->assertOk()
        ->assertJsonCount(1, 'data');
});

it('allows replies to comments', function () {
    $parent = Comment::factory()->create([
        'task_id' => $this->task->id,
        'user_id' => $this->user->id,
    ]);

    $this->actingAs($this->user)
        ->postJson("/projects/{$this->project->id}/tasks/{$this->task->id}/comments", [
            'content' => 'This is a reply',
            'parent_id' => $parent->id,
        ])
        ->assertCreated()
        ->assertJsonPath('comment.parent_id', $parent->id);
});

it('allows owner to edit their comment', function () {
    $comment = Comment::factory()->create([
        'task_id' => $this->task->id,
        'user_id' => $this->user->id,
    ]);

    $this->actingAs($this->user)
        ->patchJson("/projects/{$this->project->id}/tasks/{$this->task->id}/comments/{$comment->id}", [
            'content' => 'Updated content',
        ])
        ->assertOk()
        ->assertJsonPath('comment.content', 'Updated content')
        ->assertJsonPath('comment.is_edited', true);
});

it('prevents non-owner from editing comment', function () {
    $otherUser = User::factory()->create(['plan' => UserPlan::Pro]);
    $this->project->members()->attach($otherUser->id, ['role' => 'editor']);

    $comment = Comment::factory()->create([
        'task_id' => $this->task->id,
        'user_id' => $this->user->id,
    ]);

    $this->actingAs($otherUser)
        ->patchJson("/projects/{$this->project->id}/tasks/{$this->task->id}/comments/{$comment->id}", [
            'content' => 'Hacked content',
        ])
        ->assertForbidden();
});
```

---

## ✅ Checklist

- [ ] Create/update `comments` table migration
- [ ] Create `comment_reactions` table migration
- [ ] Create `comment_mentions` table migration
- [ ] Create `Comment` model
- [ ] Create `CommentReaction` model
- [ ] Update `Task` model with comments relationship
- [ ] Add `canCreateComments()` to `UserPlan` enum
- [ ] Create `CommentController`
- [ ] Create `CommentReactionController`
- [ ] Create `CommentCreated` event
- [ ] Create `TaskCommentNotification`
- [ ] Create `MentionedInCommentNotification`
- [ ] Add broadcast channel for task comments
- [ ] Add routes
- [ ] Create `CommentList` component
- [ ] Create `MentionInput` component
- [ ] Update task detail sheet to show comments
- [ ] Write tests
- [ ] Create `CommentFactory` for testing

---

## 📚 References

- [Laravel Real-time Broadcasting](https://laravel.com/docs/broadcasting)
- [Inertia.js Forms](https://inertiajs.com/forms)
- Trello Comments: [Trello Card Comments](https://support.atlassian.com/trello/docs/commenting-on-cards/)
