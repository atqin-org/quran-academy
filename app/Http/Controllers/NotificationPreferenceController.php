<?php

namespace App\Http\Controllers;

use App\Models\NotificationPreference;
use App\Notifications\Registry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class NotificationPreferenceController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'preferences' => 'required|array',
            'preferences.*.type' => ['required', 'string', Rule::in(Registry::types())],
            'preferences.*.in_app' => 'required|boolean',
            'preferences.*.email' => 'required|boolean',
        ]);

        foreach ($validated['preferences'] as $row) {
            NotificationPreference::updateOrCreate(
                [
                    'user_id' => $request->user()->id,
                    'type' => $row['type'],
                ],
                [
                    'in_app' => $row['in_app'],
                    'email' => $row['email'],
                    'push' => false, // Push channel deferred until mobile app ships.
                ]
            );
        }

        return redirect()->back()->with('success', 'تم حفظ إعدادات التنبيهات');
    }
}
