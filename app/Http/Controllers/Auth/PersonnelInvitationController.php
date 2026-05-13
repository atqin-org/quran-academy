<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\PersonnelSetPasswordRequest;
use App\Models\PersonnelInvitation;
use App\Models\User;
use App\Notifications\Personnel\PersonnelInviteAccepted;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class PersonnelInvitationController extends Controller
{
    public function show(string $token): Response
    {
        $invitation = PersonnelInvitation::findByToken($token);

        if (! $invitation) {
            abort(404);
        }

        if ($invitation->isAccepted() || $invitation->isExpired()) {
            abort(410, 'انتهت صلاحية رابط الدعوة');
        }

        $user = $invitation->user;

        return Inertia::render('Auth/PersonnelInvite', [
            'token' => $token,
            'name' => trim(($user->name ?? '').' '.($user->last_name ?? '')),
            'email' => $user->email,
            'expires_at' => $invitation->expires_at->toIso8601String(),
        ]);
    }

    public function store(string $token, PersonnelSetPasswordRequest $request): RedirectResponse
    {
        $invitation = PersonnelInvitation::findByToken($token);

        if (! $invitation) {
            abort(404);
        }

        if ($invitation->isAccepted() || $invitation->isExpired()) {
            abort(410, 'انتهت صلاحية رابط الدعوة');
        }

        $user = $invitation->user;

        $user->forceFill([
            'password' => $request->validated('password'),
            'status' => 'active',
            'must_change_password' => false,
            'password_set_at' => now(),
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();

        $invitation->forceFill(['accepted_at' => now()])->save();

        try {
            Notification::send(
                User::query()->where('role', 'admin')->get(),
                new PersonnelInviteAccepted([
                    'personnel_id' => $user->id,
                    'personnel_name' => trim(($user->name ?? '').' '.($user->last_name ?? '')),
                    'personnel_email' => $user->email,
                ])
            );
        } catch (Throwable $e) {
            Log::warning('PersonnelInviteAccepted notification dispatch failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        Auth::login($user);
        request()->session()->regenerate();

        return redirect()->route('dashboard');
    }
}
