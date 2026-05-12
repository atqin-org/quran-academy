<?php

namespace App\Http\Controllers;

use App\Models\NotificationTypeSetting;
use App\Notifications\Registry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminNotificationTypeController extends Controller
{
    public function index(): Response
    {
        $rows = collect(Registry::all())->map(function (array $meta, string $type) {
            $row = NotificationTypeSetting::query()->where('type', $type)->first();
            $dismissable = $row
                ? (bool) $row->dismissable
                : (bool) ($meta['default_dismissable'] ?? false);

            return [
                'type' => $type,
                'label' => $meta['label'],
                'description' => $meta['description'],
                'default_dismissable' => (bool) ($meta['default_dismissable'] ?? false),
                'dismissable' => $dismissable,
            ];
        })->values()->all();

        return Inertia::render('Dashboard/System/NotificationTypes', [
            'types' => $rows,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'types' => 'required|array',
            'types.*.type' => ['required', 'string', Rule::in(Registry::types())],
            'types.*.dismissable' => 'required|boolean',
        ]);

        foreach ($validated['types'] as $row) {
            NotificationTypeSetting::updateOrCreate(
                ['type' => $row['type']],
                ['dismissable' => $row['dismissable']],
            );
        }

        return redirect()->back()->with('success', 'تم حفظ إعدادات أنواع التنبيهات');
    }
}
