<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Notifications\Registry;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $preferences = collect(Registry::all())->map(function (array $meta, string $type) use ($user) {
            $pref = $user->preferenceFor($type);

            return [
                'type' => $type,
                'label' => $meta['label'],
                'description' => $meta['description'],
                'allow_email' => $meta['allow_email'],
                'allow_push' => $meta['allow_push'],
                'in_app' => (bool) $pref->in_app,
                'push' => (bool) $pref->push,
                'email' => (bool) $pref->email,
            ];
        })->values()->all();

        return Inertia::render('Dashboard/Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'preferences' => $preferences,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        if ($user->role === 'admin') {
            return Redirect::back()->withErrors(['error' => 'Admin users cannot delete their own profile.']);
        }

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
