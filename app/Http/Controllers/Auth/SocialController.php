<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as ProviderUserContract;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;

class SocialController extends Controller
{
    /**
     * Redirect user to OAuth Provider.
     * Works for both login (guest) and linking (authenticated user).
     */
    public function redirect(Request $request, string $provider): RedirectResponse
    {
        $this->assertAllowedProvider($provider);

        /** @var AbstractProvider $driver */
        $driver = Socialite::driver($provider);

        // Request email scope for GitHub to ensure an email is returned
        if ($provider === 'github') {
            $driver = $driver->scopes(['read:user', 'user:email']);
        }

        // If user is authenticated, store linking intent in cache using a unique state key.
        // We use cache instead of session because session cookies may not survive
        // the cross-site OAuth redirect (SameSite=Lax policy).
        if ($request->user() !== null) {
            $stateKey = 'social_link:'.Str::random(40);
            Cache::put($stateKey, $request->user()->id, now()->addMinutes(10));

            // Pass the state key through OAuth state parameter
            return $driver->with(['state' => $stateKey])->redirect();
        }

        return $driver->redirect();
    }

    /**
     * Handle OAuth callback from provider.
     * Handles both login (guest) and linking (authenticated user).
     */
    public function callback(Request $request, string $provider): RedirectResponse
    {
        $this->assertAllowedProvider($provider);

        // Check for linking intent from state parameter (stored in cache)
        $stateKey = $request->input('state');
        $linkingUserId = null;

        if ($stateKey !== null && str_starts_with($stateKey, 'social_link:')) {
            $linkingUserId = Cache::pull($stateKey);
        }

        try {
            // Use stateless mode to avoid session state verification issues
            // caused by SameSite cookie policy during cross-site OAuth redirect.
            /** @var AbstractProvider $statelessDriver */
            $statelessDriver = Socialite::driver($provider);
            $providerUser = $statelessDriver->stateless()->user();
        } catch (\Throwable $e) {
            Log::warning('Social OAuth failed to retrieve user', [
                'provider' => $provider,
                'error' => $e->getMessage(),
            ]);

            // If this was a linking attempt, redirect to connections page
            if ($linkingUserId !== null) {
                return to_route('connections.show')->withErrors([
                    'oauth' => 'Unable to link '.ucfirst($provider).'. Please try again.',
                ]);
            }

            return redirect()->route('login')->withErrors([
                'oauth' => 'Unable to authenticate with '.ucfirst($provider).'. Please try again.',
            ]);
        }

        // Determine if this is a linking flow
        $authUser = $request->user();
        if ($authUser === null && $linkingUserId !== null) {
            // Restore user from linking intent stored in cache
            $authUser = User::find($linkingUserId);
        }

        // Handle linking flow for authenticated users
        if ($authUser !== null) {
            return $this->handleLinking($authUser, $provider, $providerUser);
        }

        // Handle login/registration flow for guests
        return $this->handleLogin($provider, $providerUser);
    }

    /**
     * Handle linking a social account to an authenticated user.
     */
    protected function handleLinking(User $user, string $provider, ProviderUserContract $providerUser): RedirectResponse
    {
        $providerId = (string) $providerUser->getId();

        // Prevent linking if this provider id is already linked to another user
        $conflict = SocialAccount::query()
            ->where('provider', $provider)
            ->where('provider_id', $providerId)
            ->where('user_id', '!=', $user->id)
            ->exists();

        if ($conflict) {
            return to_route('connections.show')->withErrors([
                'provider' => 'This '.ucfirst($provider).' account is already linked to another user.',
            ]);
        }

        // Upsert for this user + provider
        $account = SocialAccount::query()->firstOrNew([
            'user_id' => $user->id,
            'provider' => $provider,
        ]);

        $account->provider_id = $providerId;
        $this->fillTokens($account, $providerUser);
        $account->avatar = $providerUser->getAvatar();
        $account->save();

        // Adopt avatar from provider if user doesn't have one yet
        $this->maybeUpdateUserAvatar($user, $providerUser->getAvatar());

        // Ensure user is logged in (in case session was lost during OAuth redirect)
        if (Auth::guest()) {
            Auth::login($user);
            request()->session()->regenerate();
        }

        return to_route('connections.show')->with('status', ucfirst($provider).' account linked.');
    }

    /**
     * Handle login or registration via social provider for guests.
     */
    protected function handleLogin(string $provider, ProviderUserContract $providerUser): RedirectResponse
    {
        $email = $providerUser->getEmail();
        $providerId = (string) $providerUser->getId();

        if ($email === null || $email === '') {
            return redirect()->route('login')->withErrors([
                'email' => 'Your '.ucfirst($provider).' account does not have a public email. Please allow email access or use another method.',
            ]);
        }

        // Find existing social account
        $socialAccount = SocialAccount::query()
            ->where('provider', $provider)
            ->where('provider_id', $providerId)
            ->first();

        if ($socialAccount !== null) {
            $this->updateSocialAccountTokens($socialAccount, $providerUser);
            $this->maybeUpdateUserAvatar($socialAccount->user, $providerUser->getAvatar());

            return $this->loginAndRedirect($socialAccount->user);
        }

        // Link to existing user by email or create a new one
        $user = User::query()->where('email', $email)->first();

        if ($user === null) {
            $name = $providerUser->getName() ?: ($providerUser->getNickname() ?: Str::before($email, '@'));

            $user = User::query()->create([
                'name' => $name,
                'email' => $email,
                'password' => Str::password(32),
            ]);

            // Mark email as verified if provider supplied an email
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        $this->maybeUpdateUserAvatar($user, $providerUser->getAvatar());

        // Create the social account link
        $socialAccount = new SocialAccount([
            'provider' => $provider,
            'provider_id' => $providerId,
        ]);
        $this->fillTokens($socialAccount, $providerUser);
        $socialAccount->avatar = $providerUser->getAvatar();
        $user->socialAccounts()->save($socialAccount);

        return $this->loginAndRedirect($user);
    }

    protected function assertAllowedProvider(string $provider): void
    {
        if (! in_array($provider, ['google', 'github'], true)) {
            abort(404);
        }
    }

    protected function loginAndRedirect(Authenticatable $user): RedirectResponse
    {
        Auth::login($user);
        request()->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    protected function updateSocialAccountTokens(SocialAccount $account, ProviderUserContract $providerUser): void
    {
        $this->fillTokens($account, $providerUser);
        $account->avatar = $providerUser->getAvatar();
        $account->save();
    }

    protected function fillTokens(SocialAccount $account, ProviderUserContract $providerUser): void
    {
        $account->token = $providerUser->token ?? null;
        $account->refresh_token = $providerUser->refreshToken ?? null;
        $expiresIn = $providerUser->expiresIn ?? null;
        $account->expires_at = is_numeric($expiresIn) ? now()->addSeconds((int) $expiresIn) : null;
    }

    protected function maybeUpdateUserAvatar(User $user, ?string $providerAvatar): void
    {
        if ((string) ($user->avatar ?? '') === '') {
            if (is_string($providerAvatar) && $providerAvatar !== '') {
                $user->forceFill(['avatar' => $providerAvatar])->save();
            }
        }
    }
}
