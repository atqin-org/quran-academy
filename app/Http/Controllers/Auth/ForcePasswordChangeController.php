<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\ForcePasswordChangeRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ForcePasswordChangeController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Auth/ForcePasswordChange');
    }

    public function update(ForcePasswordChangeRequest $request): RedirectResponse
    {
        $request->user()->forceFill([
            'password' => $request->validated('password'),
            'must_change_password' => false,
            'password_set_at' => now(),
        ])->save();

        return redirect()->route('dashboard')->with('success', 'تم تحديث كلمة المرور بنجاح');
    }
}
