<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Services\AI\GeminiService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserCanUseAI
{
    public function __construct(
        protected GeminiService $geminiService
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if AI is enabled globally
        if (! config('ai.enabled')) {
            return $this->respondWithError(
                'AI features are currently disabled.',
                Response::HTTP_SERVICE_UNAVAILABLE
            );
        }

        $user = $request->user();

        if (! $user) {
            return $this->respondWithError(
                'Authentication required to use AI features.',
                Response::HTTP_UNAUTHORIZED
            );
        }

        // Check if user has Pro subscription
        if (! $user->hasActiveSubscription()) {
            return $this->respondWithError(
                'AI features are only available for Pro subscribers. Please upgrade your plan.',
                Response::HTTP_FORBIDDEN,
                [
                    'upgrade_url' => route('billing.plans'),
                    'reason' => 'subscription_required',
                ]
            );
        }

        // Check daily limit
        if ($this->geminiService->hasReachedDailyLimit($user)) {
            $remaining = $this->geminiService->getRemainingRequests($user);

            return $this->respondWithError(
                'You have reached your daily AI request limit. Please try again tomorrow.',
                Response::HTTP_TOO_MANY_REQUESTS,
                [
                    'remaining_requests' => $remaining,
                    'resets_at' => now()->endOfDay()->toIso8601String(),
                    'reason' => 'daily_limit_exceeded',
                ]
            );
        }

        return $next($request);
    }

    /**
     * Create an error response.
     *
     * @param  array<string, mixed>  $extra
     */
    protected function respondWithError(string $message, int $status, array $extra = []): Response
    {
        $data = array_merge(['message' => $message], $extra);

        return response()->json($data, $status);
    }
}
