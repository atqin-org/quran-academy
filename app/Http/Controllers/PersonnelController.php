<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePersonnelRequest;
use App\Models\Category;
use App\Models\Club;
use App\Models\PersonnelInvitation;
use App\Models\PersonnelInviteSetting;
use App\Models\User;
use App\Notifications\Personnel\PersonnelInvited;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;
use Throwable;

class PersonnelController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $personnels = User::withTrashed()->with('clubs')->latest()->get()->map(function ($user) {
            $lastActivity = Activity::where('causer_id', $user->id)
                ->where('causer_type', User::class)
                ->latest()
                ->first();

            $user->last_activity_at = $lastActivity ? $lastActivity->created_at->toISOString() : null;

            return $user;
        });

        return Inertia::render(
            'Dashboard/Personnels/Index',
            [
                'clubs' => Club::all(),
                'personnels' => $personnels,
            ]
        );
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render(
            'Dashboard/Personnels/Create',
            [
                'clubs' => Club::all(),
                'categories' => Category::all(),
            ]
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePersonnelRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'name' => $validated['firstName'],
            'last_name' => $validated['lastName'],
            'role' => $validated['role'],
            'phone' => $validated['phone'],
            'email' => $validated['mail'],
            'password' => null,
            'status' => 'pending',
            'must_change_password' => false,
            'invited_at' => now(),
        ]);

        $user->clubs()->attach($validated['clubs'] ?? []);

        $flash = $this->issueInvitation($user);
        $flash['invite_user'] = trim(($user->name ?? '').' '.($user->last_name ?? ''));

        return redirect()->route('personnels.index')->with($flash);
    }

    /**
     * Re-issue an invitation to a pending personnel.
     */
    public function resendInvite(string $id): RedirectResponse
    {
        $user = User::findOrFail($id);

        if (! $user->isPending()) {
            return redirect()->route('personnels.index')->with('error', 'هذا الحساب مفعّل بالفعل');
        }

        $user->update(['invited_at' => now()]);
        $flash = $this->issueInvitation($user, alwaysShowLink: true);
        $flash['invite_user'] = trim(($user->name ?? '').' '.($user->last_name ?? ''));

        return redirect()->route('personnels.index')->with($flash);
    }

    /**
     * Generate a fresh invitation link without sending email,
     * so the admin can copy and share it manually.
     */
    public function copyInviteLink(string $id): RedirectResponse
    {
        $user = User::findOrFail($id);

        if (! $user->isPending()) {
            return redirect()->route('personnels.index')->with('error', 'هذا الحساب مفعّل بالفعل');
        }

        $invitation = PersonnelInvitation::generateFor($user, 'link');
        $inviteUrl = route('personnel-invite.show', ['token' => $invitation->plainToken]);

        return redirect()->route('personnels.index')->with([
            'success' => 'تم توليد رابط جديد للدعوة',
            'invite_url' => $inviteUrl,
            'invite_channel' => 'link',
            'invite_user' => trim(($user->name ?? '').' '.($user->last_name ?? '')),
        ]);
    }

    /**
     * Generate and deliver an invitation based on configured delivery channel.
     *
     * @return array<string, mixed>
     */
    protected function issueInvitation(User $user, bool $alwaysShowLink = false): array
    {
        $channel = PersonnelInviteSetting::deliveryChannel();
        $invitation = PersonnelInvitation::generateFor($user, $channel);
        $inviteUrl = route('personnel-invite.show', ['token' => $invitation->plainToken]);

        $emailSucceeded = true;
        if (in_array($channel, ['email', 'both'], true)) {
            try {
                $user->notify(new PersonnelInvited($inviteUrl, $invitation->expires_at));
            } catch (Throwable $e) {
                $emailSucceeded = false;
                Log::warning('Personnel invite email could not be dispatched', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $flash = ['success' => 'تم إرسال دعوة لتفعيل الحساب'];

        $shouldShowLink = $alwaysShowLink || in_array($channel, ['link', 'both'], true);

        if ($shouldShowLink) {
            $flash['invite_url'] = $inviteUrl;
            $flash['invite_channel'] = $channel;
        }

        if (! $emailSucceeded) {
            $flash['warning'] = 'تعذّر إرسال بريد الدعوة. شارك الرابط يدوياً.';
            $flash['invite_url'] = $inviteUrl;
            $flash['invite_channel'] = $channel;
        }

        return $flash;
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $personnel = User::withTrashed()->findOrFail($id);

        return Inertia::render(
            'Dashboard/Personnels/Edit',
            [
                'personnel' => $personnel->load('clubs'),
                'clubs' => Club::all(),
                'categories' => Category::all(),
            ]
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'firstName' => 'required',
            'lastName' => 'required',
            'clubs' => 'array|required_unless:role,admin',
            'role' => 'required',
            'phone' => 'required',
            'mail' => 'required|email',
        ]);

        $user = User::withTrashed()->findOrFail($id);

        $user->update([
            'name' => $request->firstName,
            'last_name' => $request->lastName,
            'role' => $request->role,
            'phone' => $request->phone,
            'email' => $request->mail,
        ]);

        $user->clubs()->sync($request->clubs);

        return redirect()->route('personnels.index')->with('success', 'تم تحديث البيانات بنجاح');
    }

    /**
     * Remove the specified resource from storage (soft delete).
     */
    public function destroy(string $id)
    {
        $user = User::findOrFail($id);

        // Prevent self-deactivation
        if ($user->id === auth()->id()) {
            return redirect()->route('personnels.index')->with('error', 'لا يمكنك تعطيل حسابك الخاص');
        }

        $user->delete();

        // Log the deactivation
        activity('user')
            ->performedOn($user)
            ->causedBy(auth()->user())
            ->withProperties(['action' => 'deactivated'])
            ->log('User account deactivated');

        return redirect()->route('personnels.index')->with('success', 'تم تعطيل الحساب بنجاح');
    }

    /**
     * Restore a soft deleted resource.
     */
    public function restore(string $id)
    {
        $user = User::withTrashed()->findOrFail($id);
        $user->restore();

        // Log the restoration
        activity('user')
            ->performedOn($user)
            ->causedBy(auth()->user())
            ->withProperties(['action' => 'restored'])
            ->log('User account restored');

        return redirect()->route('personnels.index')->with('success', 'تم تفعيل الحساب بنجاح');
    }
}
