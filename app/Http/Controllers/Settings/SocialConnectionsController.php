<?php

namespace App\Http\Controllers\Settings;

use App\Enums\SocialProvider;
use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialConnectionsController extends Controller
{
    /**
     * Show the social connections management page.
     */
    public function show(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('settings/connections', [
            'connections' => [
                'google' => $user->hasSocialAccount(SocialProvider::Google),
                'github' => $user->hasSocialAccount(SocialProvider::GitHub),
            ],
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Unlink a provider from the current user.
     */
    public function destroy(Request $request, string $provider): RedirectResponse
    {
        if (!in_array($provider, ['google', 'github'], true)) {
            abort(404);
        }

        $user = $request->user();

        /** @var SocialAccount|null $account */
        $account = $user->socialAccounts()
            ->where('provider', $provider)
            ->first();

        if ($account === null) {
            return to_route('connections.show');
        }

        // Prevent unlinking if this is the only login method (no password set)
        $hasPassword = $user->password !== null;
        $socialAccountCount = $user->socialAccounts()->count();

        if (!$hasPassword && $socialAccountCount <= 1) {
            return to_route('connections.show')->withErrors([
                'provider' => 'Cannot disconnect your only login method. Please set a password first.',
            ]);
        }

        $account->delete();

        return to_route('connections.show')->with('status', ucfirst($provider) . ' account unlinked.');
    }
}
