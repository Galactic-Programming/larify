<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\AvatarUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AvatarController extends Controller
{
    /**
     * Update the user's avatar image.
     */
    public function update(AvatarUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        $file = $request->file('avatar');

        // Delete existing stored avatar if it was stored locally
        $this->deleteStoredAvatarIfLocal($user->avatar);

        $dir = 'avatars/' . $user->id;
        $filename = Str::uuid()->toString() . '.' . $file->getClientOriginalExtension();
        $disk = config('filesystems.default');
        $path = $file->storeAs($dir, $filename, $disk);

        $user->forceFill([
            'avatar' => Storage::disk($disk)->url($path),
        ])->save();

        return to_route('profile.edit')->with('status', 'Avatar updated.');
    }

    /**
     * Remove the user's avatar.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();

        $this->deleteStoredAvatarIfLocal($user->avatar);

        $user->forceFill(['avatar' => null])->save();

        return to_route('profile.edit')->with('status', 'Avatar removed.');
    }

    protected function deleteStoredAvatarIfLocal(?string $avatarUrl): void
    {
        if (!is_string($avatarUrl) || $avatarUrl === '') {
            return;
        }

        // Skip external URLs (dicebear, Google, GitHub, etc.)
        if (str_starts_with($avatarUrl, 'http://') || str_starts_with($avatarUrl, 'https://')) {
            // Only process if it's from our own domain/storage
            $appUrl = config('app.url');
            if (!str_starts_with($avatarUrl, $appUrl)) {
                return;
            }
        }

        $disk = config('filesystems.default');

        // For local/public disk, check for /storage/ prefix
        if ($disk === 'public') {
            $prefix = '/storage/';
            if (str_contains($avatarUrl, $prefix)) {
                $relative = Str::after($avatarUrl, $prefix);
                if ($relative !== '' && Storage::disk($disk)->exists($relative)) {
                    Storage::disk($disk)->delete($relative);
                }
            }
        } else {
            // For S3/cloud storage, extract path from full URL
            $urlPath = parse_url($avatarUrl, PHP_URL_PATH);
            if ($urlPath) {
                $path = ltrim($urlPath, '/');
                // Check if file actually exists before trying to delete
                try {
                    if (Storage::disk($disk)->exists($path)) {
                        Storage::disk($disk)->delete($path);
                    }
                } catch (\Exception $e) {
                    // Silently ignore errors for external/invalid URLs
                    report($e);
                }
            }
        }
    }
}
