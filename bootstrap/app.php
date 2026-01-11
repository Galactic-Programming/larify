<?php

use App\Http\Middleware\EnsureUserCanUseAI;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
        then: function () {
            Route::middleware('web')
                ->group(base_path('routes/ai.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Trust all proxies (required for Laravel Cloud / load balancers)
        // This ensures HTTPS URLs are generated correctly behind Cloudflare/load balancer
        $middleware->trustProxies(at: '*');

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Exclude Stripe webhook from CSRF verification
        $middleware->validateCsrfTokens(except: [
            'stripe/*',
        ]);

        // Register named middleware aliases
        $middleware->alias([
            'ai' => EnsureUserCanUseAI::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Handle 419 CSRF token mismatch errors gracefully for Inertia
        // When session expires, redirect back with a message instead of showing error page
        $exceptions->respond(function (Response $response, \Throwable $exception, Request $request) {
            // Handle CSRF token mismatch (419)
            if ($response->getStatusCode() === 419) {
                // For JSON/fetch requests, return 419 with message
                // Frontend should handle this by refreshing the page to get new token
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'Your session has expired. Please refresh the page.',
                    ], 419);
                }

                // For regular requests, redirect back
                return back()->with([
                    'message' => 'Your session has expired. Please try again.',
                ]);
            }

            return $response;
        });
    })->create();
