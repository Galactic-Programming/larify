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
        $path = $file->storeAs($dir, $filename, 'public');

        $user->forceFill([
            'avatar' => Storage::url($path),
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

        // Only delete files that are on the public disk (URL contains "/storage/...")
        $prefix = '/storage/';
        if (str_contains($avatarUrl, $prefix)) {
            $relative = Str::after($avatarUrl, $prefix); // avatars/...

            if ($relative !== '' && Storage::disk('public')->exists($relative)) {
                Storage::disk('public')->delete($relative);
            }
        }
    }
}
