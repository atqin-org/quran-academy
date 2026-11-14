<?php

namespace App\Http\Controllers;

use App\Models\PersonnelInviteSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PersonnelInviteSettingsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Dashboard/System/PersonnelInviteSettings', [
            'deliveryChannel' => PersonnelInviteSetting::deliveryChannel(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'delivery_channel' => ['required', 'string', 'in:email,link,both'],
        ]);

        PersonnelInviteSetting::set('delivery_channel', $validated['delivery_channel']);

        return redirect()->back()->with('success', 'تم حفظ إعدادات الدعوات');
    }
}
