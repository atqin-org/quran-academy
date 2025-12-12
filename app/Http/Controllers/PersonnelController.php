<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Club;
use App\Models\Category;
use Spatie\Activitylog\Models\Activity;

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
                'personnels' => $personnels
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
                'categories' => Category::all()
            ]
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'firstName' => 'required',
            'lastName' => 'required',
            'clubs' => 'required|array',
            'role' => 'required',
            'phone' => 'required',
            'mail' => 'required|email',
        ]);

        $user = User::create([
            'name' => $request->firstName,
            'last_name' => $request->lastName,
            'role' => $request->role,
            'phone' => $request->phone,
            'email' => $request->mail,
            'password' => bcrypt('password'),
        ]);

        // Attach the clubs to the user
        $user->clubs()->attach($request->clubs);

        return redirect()->route('personnels.index');
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
                'categories' => Category::all()
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
            'clubs' => 'required|array',
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
            ->log("User account deactivated");

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
            ->log("User account restored");

        return redirect()->route('personnels.index')->with('success', 'تم تفعيل الحساب بنجاح');
    }
}
