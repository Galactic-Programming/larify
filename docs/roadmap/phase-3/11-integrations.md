# 🔗 Integrations

## Tổng quan

Kết nối với các công cụ bên ngoài: Slack, Google Calendar, GitHub, v.v.

| Attribute        | Value                    |
| ---------------- | ------------------------ |
| **Priority**     | 🟠 Low                   |
| **Effort**       | 🔴 High (2-3 weeks each) |
| **Plan**         | Pro Only                 |
| **Dependencies** | Core features stable     |

---

## 📋 Requirements

### Functional Requirements

1. **Slack Integration**
    - Post task updates to Slack channel
    - Create tasks from Slack commands
    - Receive notifications in Slack

2. **Google Calendar Integration**
    - Sync due dates to Google Calendar
    - Two-way sync (optional)
    - Show calendar events alongside tasks

3. **GitHub Integration**
    - Link tasks to GitHub issues/PRs
    - Auto-update task status based on PR status
    - Show commits/PR activity on task

4. **Webhook System** (Foundation for all integrations)
    - Generic webhook endpoints
    - Event subscriptions
    - Payload customization

---

## 🗃️ Database Schema

```php
// database/migrations/xxxx_create_integrations_table.php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // User integrations (OAuth connections)
        Schema::create('integrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider'); // slack, google, github
            $table->string('provider_user_id')->nullable();
            $table->string('provider_email')->nullable();
            $table->text('access_token')->nullable();
            $table->text('refresh_token')->nullable();
            $table->timestamp('token_expires_at')->nullable();
            $table->json('scopes')->nullable();
            $table->json('settings')->nullable(); // Provider-specific settings
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'provider']);
            $table->index('provider');
        });

        // Project-level integration configs
        Schema::create('project_integrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('integration_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // slack_channel, github_repo, google_calendar
            $table->json('config'); // Channel ID, repo name, calendar ID, etc.
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();

            $table->index(['project_id', 'type']);
        });

        // Webhooks for external systems
        Schema::create('webhooks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('url');
            $table->string('secret')->nullable();
            $table->json('events'); // ['task.created', 'task.completed', etc.]
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_triggered_at')->nullable();
            $table->unsignedInteger('failure_count')->default(0);
            $table->timestamps();

            $table->index(['project_id', 'is_active']);
        });

        // Webhook delivery logs
        Schema::create('webhook_deliveries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('webhook_id')->constrained()->cascadeOnDelete();
            $table->string('event');
            $table->json('payload');
            $table->unsignedSmallInteger('response_code')->nullable();
            $table->text('response_body')->nullable();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->enum('status', ['pending', 'success', 'failed'])->default('pending');
            $table->timestamps();

            $table->index(['webhook_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_deliveries');
        Schema::dropIfExists('webhooks');
        Schema::dropIfExists('project_integrations');
        Schema::dropIfExists('integrations');
    }
};
```

---

## 🏗️ Implementation

### Step 1: Update UserPlan.php

```php
// app/Enums/UserPlan.php

/**
 * Check if this plan can use integrations.
 */
public function canUseIntegrations(): bool
{
    return $this === self::Pro;
}

/**
 * Get maximum webhooks allowed.
 */
public function maxWebhooks(): int
{
    return match ($this) {
        self::Free => 1,
        self::Pro => 20,
    };
}
```

### Step 2: Create Models

```php
// app/Models/Integration.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Integration extends Model
{
    protected $fillable = [
        'user_id',
        'provider',
        'provider_user_id',
        'provider_email',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'scopes',
        'settings',
        'is_active',
    ];

    protected $hidden = [
        'access_token',
        'refresh_token',
    ];

    protected function casts(): array
    {
        return [
            'scopes' => 'array',
            'settings' => 'array',
            'token_expires_at' => 'datetime',
            'is_active' => 'boolean',
            'access_token' => 'encrypted',
            'refresh_token' => 'encrypted',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function projectIntegrations(): HasMany
    {
        return $this->hasMany(ProjectIntegration::class);
    }

    public function isTokenExpired(): bool
    {
        return $this->token_expires_at && now()->gte($this->token_expires_at);
    }
}

// app/Models/Webhook.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Webhook extends Model
{
    protected $fillable = [
        'user_id',
        'project_id',
        'name',
        'url',
        'secret',
        'events',
        'is_active',
        'last_triggered_at',
        'failure_count',
    ];

    protected $hidden = ['secret'];

    protected function casts(): array
    {
        return [
            'events' => 'array',
            'is_active' => 'boolean',
            'last_triggered_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Webhook $webhook) {
            if (!$webhook->secret) {
                $webhook->secret = Str::random(32);
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(WebhookDelivery::class);
    }

    public function shouldTriggerFor(string $event): bool
    {
        return $this->is_active && in_array($event, $this->events);
    }
}

// app/Models/WebhookDelivery.php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WebhookDelivery extends Model
{
    protected $fillable = [
        'webhook_id',
        'event',
        'payload',
        'response_code',
        'response_body',
        'duration_ms',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }

    public function webhook(): BelongsTo
    {
        return $this->belongsTo(Webhook::class);
    }
}
```

### Step 3: Webhook Service

```php
// app/Services/WebhookService.php
<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Webhook;
use App\Models\WebhookDelivery;
use App\Jobs\DeliverWebhook;
use Illuminate\Support\Facades\Log;

class WebhookService
{
    /**
     * Available webhook events.
     */
    public const EVENTS = [
        'task.created',
        'task.updated',
        'task.completed',
        'task.deleted',
        'task.comment.created',
        'project.created',
        'project.updated',
        'project.member.added',
        'project.member.removed',
    ];

    /**
     * Dispatch webhooks for an event.
     */
    public function dispatch(string $event, array $payload, ?int $projectId = null): void
    {
        $webhooks = Webhook::where('is_active', true)
            ->where(function ($query) use ($projectId) {
                $query->whereNull('project_id');
                if ($projectId) {
                    $query->orWhere('project_id', $projectId);
                }
            })
            ->get()
            ->filter(fn ($webhook) => $webhook->shouldTriggerFor($event));

        foreach ($webhooks as $webhook) {
            DeliverWebhook::dispatch($webhook, $event, $payload);
        }
    }

    /**
     * Deliver a webhook.
     */
    public function deliver(Webhook $webhook, string $event, array $payload): WebhookDelivery
    {
        $delivery = WebhookDelivery::create([
            'webhook_id' => $webhook->id,
            'event' => $event,
            'payload' => $payload,
            'status' => 'pending',
        ]);

        $startTime = microtime(true);

        try {
            $signature = hash_hmac('sha256', json_encode($payload), $webhook->secret);

            $response = Http::timeout(10)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'X-Webhook-Event' => $event,
                    'X-Webhook-Signature' => $signature,
                    'X-Webhook-Delivery' => $delivery->id,
                ])
                ->post($webhook->url, $payload);

            $duration = (int) ((microtime(true) - $startTime) * 1000);

            $delivery->update([
                'response_code' => $response->status(),
                'response_body' => substr($response->body(), 0, 10000),
                'duration_ms' => $duration,
                'status' => $response->successful() ? 'success' : 'failed',
            ]);

            if ($response->successful()) {
                $webhook->update([
                    'last_triggered_at' => now(),
                    'failure_count' => 0,
                ]);
            } else {
                $this->handleFailure($webhook);
            }

        } catch (\Exception $e) {
            $duration = (int) ((microtime(true) - $startTime) * 1000);

            $delivery->update([
                'response_body' => $e->getMessage(),
                'duration_ms' => $duration,
                'status' => 'failed',
            ]);

            $this->handleFailure($webhook);

            Log::error('Webhook delivery failed', [
                'webhook_id' => $webhook->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $delivery;
    }

    private function handleFailure(Webhook $webhook): void
    {
        $webhook->increment('failure_count');

        // Disable webhook after too many failures
        if ($webhook->failure_count >= 10) {
            $webhook->update(['is_active' => false]);
        }
    }
}
```

### Step 4: Webhook Job

```php
// app/Jobs/DeliverWebhook.php
<?php

namespace App\Jobs;

use App\Models\Webhook;
use App\Services\WebhookService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DeliverWebhook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public array $backoff = [10, 60, 300]; // 10s, 1m, 5m

    public function __construct(
        public Webhook $webhook,
        public string $event,
        public array $payload,
    ) {}

    public function handle(WebhookService $service): void
    {
        $service->deliver($this->webhook, $this->event, $this->payload);
    }
}
```

### Step 5: Event Integration Trait

```php
// app/Traits/DispatchesWebhooks.php
<?php

namespace App\Traits;

use App\Services\WebhookService;

trait DispatchesWebhooks
{
    protected function dispatchWebhook(string $event, array $payload, ?int $projectId = null): void
    {
        app(WebhookService::class)->dispatch($event, $payload, $projectId);
    }
}

// Usage in Task Observer
// app/Observers/TaskObserver.php
<?php

namespace App\Observers;

use App\Models\Task;
use App\Traits\DispatchesWebhooks;

class TaskObserver
{
    use DispatchesWebhooks;

    public function created(Task $task): void
    {
        $this->dispatchWebhook('task.created', [
            'task' => $task->toArray(),
            'project_id' => $task->project_id,
            'created_at' => now()->toIso8601String(),
        ], $task->project_id);
    }

    public function updated(Task $task): void
    {
        $event = $task->wasChanged('completed_at') && $task->completed_at
            ? 'task.completed'
            : 'task.updated';

        $this->dispatchWebhook($event, [
            'task' => $task->toArray(),
            'changes' => $task->getChanges(),
            'project_id' => $task->project_id,
            'updated_at' => now()->toIso8601String(),
        ], $task->project_id);
    }
}
```

### Step 6: Slack Integration Service

```php
// app/Services/Integrations/SlackService.php
<?php

namespace App\Services\Integrations;

use App\Models\Integration;
use App\Models\ProjectIntegration;
use App\Models\Task;
use Illuminate\Support\Facades\Http;

class SlackService
{
    private const API_BASE = 'https://slack.com/api';

    public function __construct(
        private Integration $integration
    ) {}

    /**
     * Send message to a channel.
     */
    public function sendMessage(string $channelId, string $message, array $blocks = []): bool
    {
        $response = Http::withToken($this->integration->access_token)
            ->post(self::API_BASE . '/chat.postMessage', [
                'channel' => $channelId,
                'text' => $message,
                'blocks' => $blocks ?: null,
            ]);

        return $response->successful() && $response->json('ok');
    }

    /**
     * Post task update to configured channel.
     */
    public function postTaskUpdate(Task $task, string $action, ProjectIntegration $config): bool
    {
        $channelId = $config->config['channel_id'] ?? null;
        if (!$channelId) return false;

        $emoji = match ($action) {
            'created' => '✨',
            'completed' => '✅',
            'updated' => '📝',
            default => '📌',
        };

        $blocks = [
            [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "{$emoji} *Task {$action}*: {$task->title}",
                ],
            ],
            [
                'type' => 'context',
                'elements' => [
                    [
                        'type' => 'mrkdwn',
                        'text' => "Project: {$task->project->name}",
                    ],
                ],
            ],
        ];

        if ($task->due_date) {
            $blocks[0]['accessory'] = [
                'type' => 'button',
                'text' => [
                    'type' => 'plain_text',
                    'text' => 'View Task',
                ],
                'url' => route('tasks.show', $task),
            ];
        }

        return $this->sendMessage(
            $channelId,
            "Task {$action}: {$task->title}",
            $blocks
        );
    }

    /**
     * List available channels.
     */
    public function listChannels(): array
    {
        $response = Http::withToken($this->integration->access_token)
            ->get(self::API_BASE . '/conversations.list', [
                'types' => 'public_channel,private_channel',
                'limit' => 100,
            ]);

        if (!$response->successful() || !$response->json('ok')) {
            return [];
        }

        return collect($response->json('channels'))
            ->map(fn ($ch) => [
                'id' => $ch['id'],
                'name' => $ch['name'],
                'is_private' => $ch['is_private'] ?? false,
            ])
            ->toArray();
    }
}
```

### Step 7: OAuth Controller

```php
// app/Http/Controllers/Integrations/OAuthController.php
<?php

namespace App\Http\Controllers\Integrations;

use App\Http\Controllers\Controller;
use App\Models\Integration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Socialite\Facades\Socialite;

class OAuthController extends Controller
{
    public function redirect(Request $request, string $provider)
    {
        if (!$request->user()->plan?->canUseIntegrations()) {
            return redirect()->route('settings.integrations')
                ->with('error', 'Integrations require a Pro plan.');
        }

        // Store return URL
        session(['integration_return' => url()->previous()]);

        return match ($provider) {
            'slack' => $this->redirectToSlack(),
            'google' => $this->redirectToGoogle(),
            'github' => Socialite::driver('github')
                ->scopes(['repo', 'read:user'])
                ->redirect(),
            default => abort(404),
        };
    }

    public function callback(Request $request, string $provider)
    {
        $user = match ($provider) {
            'slack' => $this->handleSlackCallback($request),
            'google' => $this->handleGoogleCallback($request),
            'github' => Socialite::driver('github')->user(),
            default => abort(404),
        };

        Integration::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'provider' => $provider,
            ],
            [
                'provider_user_id' => $user->id ?? $user['id'] ?? null,
                'provider_email' => $user->email ?? $user['email'] ?? null,
                'access_token' => $user->token ?? $user['access_token'],
                'refresh_token' => $user->refreshToken ?? $user['refresh_token'] ?? null,
                'token_expires_at' => isset($user->expiresIn)
                    ? now()->addSeconds($user->expiresIn)
                    : null,
                'is_active' => true,
            ]
        );

        return redirect(session('integration_return', route('settings.integrations')))
            ->with('success', ucfirst($provider) . ' connected successfully.');
    }

    public function disconnect(Request $request, string $provider)
    {
        Integration::where('user_id', $request->user()->id)
            ->where('provider', $provider)
            ->delete();

        return back()->with('success', ucfirst($provider) . ' disconnected.');
    }

    private function redirectToSlack()
    {
        $params = http_build_query([
            'client_id' => config('services.slack.client_id'),
            'scope' => 'channels:read,chat:write,commands',
            'redirect_uri' => route('integrations.callback', 'slack'),
        ]);

        return redirect("https://slack.com/oauth/v2/authorize?{$params}");
    }

    private function handleSlackCallback(Request $request): array
    {
        $response = Http::post('https://slack.com/api/oauth.v2.access', [
            'client_id' => config('services.slack.client_id'),
            'client_secret' => config('services.slack.client_secret'),
            'code' => $request->code,
            'redirect_uri' => route('integrations.callback', 'slack'),
        ]);

        $data = $response->json();

        return [
            'id' => $data['authed_user']['id'] ?? null,
            'access_token' => $data['access_token'],
            'team_id' => $data['team']['id'] ?? null,
        ];
    }

    private function redirectToGoogle()
    {
        return Socialite::driver('google')
            ->scopes(['https://www.googleapis.com/auth/calendar'])
            ->redirect();
    }

    private function handleGoogleCallback(Request $request)
    {
        return Socialite::driver('google')->user();
    }
}
```

### Step 8: Webhook Controller

```php
// app/Http/Controllers/Integrations/WebhookController.php
<?php

namespace App\Http\Controllers\Integrations;

use App\Http\Controllers\Controller;
use App\Models\Webhook;
use App\Services\WebhookService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WebhookController extends Controller
{
    public function index(Request $request)
    {
        $webhooks = Webhook::where('user_id', $request->user()->id)
            ->with('project:id,name')
            ->withCount('deliveries')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Settings/Webhooks', [
            'webhooks' => $webhooks,
            'events' => WebhookService::EVENTS,
            'max_webhooks' => $request->user()->plan?->maxWebhooks() ?? 1,
        ]);
    }

    public function store(Request $request)
    {
        $maxWebhooks = $request->user()->plan?->maxWebhooks() ?? 1;
        $currentCount = Webhook::where('user_id', $request->user()->id)->count();

        if ($currentCount >= $maxWebhooks) {
            return back()->with('error', 'Webhook limit reached.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'url' => ['required', 'url', 'max:500'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'events' => ['required', 'array', 'min:1'],
            'events.*' => ['in:' . implode(',', WebhookService::EVENTS)],
        ]);

        Webhook::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        return back()->with('success', 'Webhook created.');
    }

    public function update(Request $request, Webhook $webhook)
    {
        $this->authorize('update', $webhook);

        $validated = $request->validate([
            'name' => ['string', 'max:100'],
            'url' => ['url', 'max:500'],
            'events' => ['array', 'min:1'],
            'events.*' => ['in:' . implode(',', WebhookService::EVENTS)],
            'is_active' => ['boolean'],
        ]);

        $webhook->update($validated);

        return back()->with('success', 'Webhook updated.');
    }

    public function destroy(Webhook $webhook)
    {
        $this->authorize('delete', $webhook);

        $webhook->delete();

        return back()->with('success', 'Webhook deleted.');
    }

    public function test(Webhook $webhook)
    {
        $this->authorize('update', $webhook);

        $service = app(WebhookService::class);
        $delivery = $service->deliver($webhook, 'test', [
            'test' => true,
            'message' => 'This is a test webhook delivery.',
            'timestamp' => now()->toIso8601String(),
        ]);

        return back()->with(
            $delivery->status === 'success' ? 'success' : 'error',
            $delivery->status === 'success'
                ? 'Test webhook delivered successfully.'
                : 'Test webhook failed: ' . ($delivery->response_body ?? 'Unknown error')
        );
    }

    public function deliveries(Webhook $webhook)
    {
        $this->authorize('view', $webhook);

        $deliveries = $webhook->deliveries()
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json(['deliveries' => $deliveries]);
    }
}
```

---

## 🛣️ Routes

```php
// routes/web.php

use App\Http\Controllers\Integrations\OAuthController;
use App\Http\Controllers\Integrations\WebhookController;

Route::middleware(['auth', 'verified'])->group(function () {
    // OAuth
    Route::get('/integrations/{provider}/redirect', [OAuthController::class, 'redirect'])
        ->name('integrations.redirect');
    Route::get('/integrations/{provider}/callback', [OAuthController::class, 'callback'])
        ->name('integrations.callback');
    Route::delete('/integrations/{provider}', [OAuthController::class, 'disconnect'])
        ->name('integrations.disconnect');

    // Webhooks
    Route::prefix('webhooks')->group(function () {
        Route::get('/', [WebhookController::class, 'index'])->name('webhooks.index');
        Route::post('/', [WebhookController::class, 'store'])->name('webhooks.store');
        Route::put('/{webhook}', [WebhookController::class, 'update'])->name('webhooks.update');
        Route::delete('/{webhook}', [WebhookController::class, 'destroy'])->name('webhooks.destroy');
        Route::post('/{webhook}/test', [WebhookController::class, 'test'])->name('webhooks.test');
        Route::get('/{webhook}/deliveries', [WebhookController::class, 'deliveries'])->name('webhooks.deliveries');
    });
});
```

---

## 🎨 Frontend Implementation

### Integrations Settings Page

```tsx
// resources/js/pages/Settings/Integrations.tsx
import { Head, router } from '@inertiajs/react';
import { SettingsLayout } from '@/layouts/settings-layout';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircleIcon, XCircleIcon, ExternalLinkIcon } from 'lucide-react';

interface Integration {
    id: number;
    provider: string;
    provider_email: string | null;
    is_active: boolean;
    created_at: string;
}

interface Props {
    integrations: Integration[];
    availableProviders: Array<{
        id: string;
        name: string;
        description: string;
        icon: string;
    }>;
}

const PROVIDER_INFO: Record<
    string,
    { name: string; description: string; logo: string }
> = {
    slack: {
        name: 'Slack',
        description:
            'Get task notifications in Slack and create tasks from Slack commands.',
        logo: '/images/integrations/slack.svg',
    },
    google: {
        name: 'Google Calendar',
        description: 'Sync task due dates with your Google Calendar.',
        logo: '/images/integrations/google.svg',
    },
    github: {
        name: 'GitHub',
        description: 'Link tasks to GitHub issues and pull requests.',
        logo: '/images/integrations/github.svg',
    },
};

export default function IntegrationsSettings({ integrations }: Props) {
    const connectedProviders = new Set(integrations.map((i) => i.provider));

    const handleConnect = (provider: string) => {
        window.location.href = `/integrations/${provider}/redirect`;
    };

    const handleDisconnect = (provider: string) => {
        if (confirm(`Disconnect ${PROVIDER_INFO[provider].name}?`)) {
            router.delete(`/integrations/${provider}`);
        }
    };

    return (
        <SettingsLayout>
            <Head title="Integrations" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-medium">Integrations</h2>
                    <p className="text-muted-foreground text-sm">
                        Connect your favorite tools to streamline your workflow.
                    </p>
                </div>

                <div className="grid gap-4">
                    {Object.entries(PROVIDER_INFO).map(([providerId, info]) => {
                        const integration = integrations.find(
                            (i) => i.provider === providerId,
                        );
                        const isConnected = !!integration;

                        return (
                            <Card key={providerId}>
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <img
                                        src={info.logo}
                                        alt={info.name}
                                        className="size-12 rounded"
                                    />
                                    <div className="flex-1">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            {info.name}
                                            {isConnected && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    <CheckCircleIcon className="mr-1 size-3 text-green-500" />
                                                    Connected
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription>
                                            {info.description}
                                        </CardDescription>
                                    </div>
                                    <div>
                                        {isConnected ? (
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    handleDisconnect(providerId)
                                                }
                                            >
                                                Disconnect
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() =>
                                                    handleConnect(providerId)
                                                }
                                            >
                                                Connect
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                {isConnected && integration.provider_email && (
                                    <CardContent className="pt-0">
                                        <p className="text-muted-foreground text-sm">
                                            Connected as:{' '}
                                            {integration.provider_email}
                                        </p>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </div>
        </SettingsLayout>
    );
}
```

### Webhooks Management

```tsx
// resources/js/pages/Settings/Webhooks.tsx
import { Head, useForm } from '@inertiajs/react';
import { SettingsLayout } from '@/layouts/settings-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { PlusIcon, PlayIcon, TrashIcon, EyeIcon } from 'lucide-react';
import { useState } from 'react';

interface Webhook {
    id: number;
    name: string;
    url: string;
    events: string[];
    is_active: boolean;
    last_triggered_at: string | null;
    failure_count: number;
    deliveries_count: number;
    project: { id: number; name: string } | null;
}

interface Props {
    webhooks: Webhook[];
    events: string[];
    max_webhooks: number;
}

export default function WebhooksSettings({
    webhooks,
    events,
    max_webhooks,
}: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const canCreateMore = webhooks.length < max_webhooks;

    const { data, setData, post, processing, reset } = useForm({
        name: '',
        url: '',
        events: [] as string[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/webhooks', {
            onSuccess: () => {
                setShowCreate(false);
                reset();
            },
        });
    };

    const toggleEvent = (event: string) => {
        setData(
            'events',
            data.events.includes(event)
                ? data.events.filter((e) => e !== event)
                : [...data.events, event],
        );
    };

    return (
        <SettingsLayout>
            <Head title="Webhooks" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-medium">Webhooks</h2>
                        <p className="text-muted-foreground text-sm">
                            Send event notifications to external services.
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowCreate(true)}
                        disabled={!canCreateMore}
                    >
                        <PlusIcon className="mr-2 size-4" />
                        New Webhook
                    </Button>
                </div>

                {!canCreateMore && (
                    <p className="text-muted-foreground text-sm">
                        You've reached the maximum of {max_webhooks} webhooks.
                        Upgrade to Pro for more.
                    </p>
                )}

                <div className="space-y-4">
                    {webhooks.map((webhook) => (
                        <WebhookCard key={webhook.id} webhook={webhook} />
                    ))}

                    {webhooks.length === 0 && (
                        <Card>
                            <CardContent className="text-muted-foreground py-8 text-center">
                                No webhooks configured. Create one to get
                                started.
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Create Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Create Webhook</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="My Webhook"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="url">URL</Label>
                            <Input
                                id="url"
                                type="url"
                                value={data.url}
                                onChange={(e) => setData('url', e.target.value)}
                                placeholder="https://example.com/webhook"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Events</Label>
                            <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto">
                                {events.map((event) => (
                                    <label
                                        key={event}
                                        className="flex cursor-pointer items-center gap-2 text-sm"
                                    >
                                        <Checkbox
                                            checked={data.events.includes(
                                                event,
                                            )}
                                            onCheckedChange={() =>
                                                toggleEvent(event)
                                            }
                                        />
                                        {event}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCreate(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Create Webhook
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </SettingsLayout>
    );
}

function WebhookCard({ webhook }: { webhook: Webhook }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                        {webhook.name}
                        <Badge
                            variant={
                                webhook.is_active ? 'default' : 'secondary'
                            }
                        >
                            {webhook.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {webhook.failure_count > 0 && (
                            <Badge variant="destructive">
                                {webhook.failure_count} failures
                            </Badge>
                        )}
                    </CardTitle>
                    <p className="text-muted-foreground max-w-md truncate font-mono text-sm">
                        {webhook.url}
                    </p>
                </div>
                <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="size-8">
                        <PlayIcon className="size-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-8">
                        <EyeIcon className="size-3.5" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive size-8"
                    >
                        <TrashIcon className="size-3.5" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                    {webhook.events.map((event) => (
                        <Badge
                            key={event}
                            variant="outline"
                            className="text-xs"
                        >
                            {event}
                        </Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
```

---

## 🧪 Testing

```php
// tests/Feature/WebhookTest.php
<?php

use App\Enums\UserPlan;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Models\Webhook;
use App\Services\WebhookService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    $this->user = User::factory()->create(['plan' => UserPlan::Pro]);
    $this->project = Project::factory()->create(['user_id' => $this->user->id]);
});

it('creates webhook', function () {
    $this->actingAs($this->user)
        ->post('/webhooks', [
            'name' => 'My Webhook',
            'url' => 'https://example.com/webhook',
            'events' => ['task.created', 'task.completed'],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('webhooks', [
        'name' => 'My Webhook',
        'user_id' => $this->user->id,
    ]);
});

it('dispatches webhook on task creation', function () {
    Queue::fake();

    $webhook = Webhook::factory()->create([
        'user_id' => $this->user->id,
        'project_id' => $this->project->id,
        'events' => ['task.created'],
        'is_active' => true,
    ]);

    $task = Task::factory()->create([
        'project_id' => $this->project->id,
    ]);

    Queue::assertPushed(\App\Jobs\DeliverWebhook::class, function ($job) use ($webhook) {
        return $job->webhook->id === $webhook->id && $job->event === 'task.created';
    });
});

it('delivers webhook successfully', function () {
    Http::fake([
        'example.com/*' => Http::response(['ok' => true], 200),
    ]);

    $webhook = Webhook::factory()->create([
        'user_id' => $this->user->id,
        'url' => 'https://example.com/webhook',
        'is_active' => true,
    ]);

    $service = app(WebhookService::class);
    $delivery = $service->deliver($webhook, 'test', ['test' => true]);

    expect($delivery->status)->toBe('success');
    expect($delivery->response_code)->toBe(200);
});

it('disables webhook after many failures', function () {
    Http::fake([
        '*' => Http::response('Server Error', 500),
    ]);

    $webhook = Webhook::factory()->create([
        'user_id' => $this->user->id,
        'failure_count' => 9,
        'is_active' => true,
    ]);

    $service = app(WebhookService::class);
    $service->deliver($webhook, 'test', []);

    expect($webhook->fresh()->is_active)->toBeFalse();
});

it('respects webhook limit per plan', function () {
    // Create max webhooks
    Webhook::factory()->count(20)->create(['user_id' => $this->user->id]);

    $this->actingAs($this->user)
        ->post('/webhooks', [
            'name' => 'Another Webhook',
            'url' => 'https://example.com/webhook',
            'events' => ['task.created'],
        ])
        ->assertRedirect()
        ->assertSessionHas('error');
});
```

---

## ✅ Checklist

### Core

- [ ] Create `integrations` table migration
- [ ] Create `project_integrations` table migration
- [ ] Create `webhooks` table migration
- [ ] Create `webhook_deliveries` table migration
- [ ] Add `canUseIntegrations()` to `UserPlan`
- [ ] Add `maxWebhooks()` to `UserPlan`
- [ ] Create `Integration` model
- [ ] Create `Webhook` model
- [ ] Create `WebhookDelivery` model
- [ ] Create `WebhookService`
- [ ] Create `DeliverWebhook` job
- [ ] Create `DispatchesWebhooks` trait
- [ ] Create `TaskObserver` for webhook events
- [ ] Create `OAuthController`
- [ ] Create `WebhookController`
- [ ] Add routes

### Integrations

- [ ] Implement Slack OAuth
- [ ] Create `SlackService`
- [ ] Implement Google Calendar OAuth
- [ ] Create `GoogleCalendarService`
- [ ] Implement GitHub OAuth
- [ ] Create `GitHubService`

### Frontend

- [ ] Create Integrations settings page
- [ ] Create Webhooks management page
- [ ] Create integration logos/icons
- [ ] Write tests

---

## 📚 References

- [Slack API](https://api.slack.com/)
- [Google Calendar API](https://developers.google.com/calendar)
- [GitHub REST API](https://docs.github.com/en/rest)
- [Laravel Socialite](https://laravel.com/docs/socialite)
- [Webhook Best Practices](https://hookdeck.com/webhooks/guides/webhook-best-practices)
