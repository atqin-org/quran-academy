<?php

namespace App\Http\Controllers;

use App\Models\Club;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClubController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Count users with no clubs (they belong to all clubs)
        $usersWithNoClubs = User::whereDoesntHave('clubs')->count();

        $clubs = Club::withTrashed()
            ->withCount('students')
            ->withCount('users')
            ->latest()
            ->get()
            ->map(function ($club) use ($usersWithNoClubs) {
                // Add users with no clubs to each club's count
                $club->users_count += $usersWithNoClubs;
                return $club;
            });

        return Inertia::render('Dashboard/Clubs/Index', [
            'clubs' => $clubs
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Dashboard/Clubs/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
        ]);

        Club::create($validated);

        activity('club')
            ->causedBy(auth()->user())
            ->withProperties($validated)
            ->log('تم إنشاء نادي جديد');

        return redirect()->route('clubs.index')->with('success', 'تم إنشاء النادي بنجاح');
    }

    /**
     * Display the specified resource.
     */
    public function show(Club $club)
    {
        $club->load(['students', 'users']);

        return Inertia::render('Dashboard/Clubs/Show', [
            'club' => $club
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $club = Club::withTrashed()->findOrFail($id);

        return Inertia::render('Dashboard/Clubs/Edit', [
            'club' => $club
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
        ]);

        $club = Club::withTrashed()->findOrFail($id);
        $club->update($validated);

        activity('club')
            ->performedOn($club)
            ->causedBy(auth()->user())
            ->withProperties($validated)
            ->log('تم تحديث بيانات النادي');

        return redirect()->route('clubs.index')->with('success', 'تم تحديث النادي بنجاح');
    }

    /**
     * Remove the specified resource from storage (soft delete).
     */
    public function destroy(string $id)
    {
        $club = Club::findOrFail($id);

        // Check if club has students
        if ($club->students()->count() > 0) {
            return redirect()->route('clubs.index')->with('error', 'لا يمكن حذف النادي لأنه يحتوي على طلاب');
        }

        $club->delete();

        activity('club')
            ->performedOn($club)
            ->causedBy(auth()->user())
            ->withProperties(['action' => 'deleted'])
            ->log('تم حذف النادي');

        return redirect()->route('clubs.index')->with('success', 'تم حذف النادي بنجاح');
    }

    /**
     * Restore a soft deleted resource.
     */
    public function restore(string $id)
    {
        $club = Club::withTrashed()->findOrFail($id);
        $club->restore();

        activity('club')
            ->performedOn($club)
            ->causedBy(auth()->user())
            ->withProperties(['action' => 'restored'])
            ->log('تم استعادة النادي');

        return redirect()->route('clubs.index')->with('success', 'تم استعادة النادي بنجاح');
    }
}
