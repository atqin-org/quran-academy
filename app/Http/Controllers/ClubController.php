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
        // Get users with no clubs grouped by role
        $usersWithNoClubs = User::whereDoesntHave('clubs')->get();
        $usersWithNoClubsCount = $usersWithNoClubs->count();
        $usersWithNoClubsByRole = $usersWithNoClubs->groupBy('role')->map->count()->toArray();

        // Get all categories ordered by ID for consistent ordering (used for tooltips)
        $allCategories = \App\Models\Category::orderBy('id')->get()->keyBy('id');

        $clubs = Club::withTrashed()
            ->with([
                'users:id,role',
                'students:id,club_id,category_id',
                'students.category:id,name,gender',
            ])
            ->withCount(['students', 'users'])
            ->latest()
            ->get()
            ->map(function ($club) use ($usersWithNoClubsCount, $usersWithNoClubsByRole, $allCategories) {
                // Calculate role breakdown for club users
                $usersByRole = $club->users->groupBy('role')->map->count()->toArray();

                // Add users with no clubs to each role count
                foreach ($usersWithNoClubsByRole as $role => $count) {
                    $usersByRole[$role] = ($usersByRole[$role] ?? 0) + $count;
                }

                // Calculate category breakdown for students with gender distinction
                $studentsByCategory = [];
                $categoryGroups = $club->students->groupBy('category_id');

                // Use the global category order
                foreach ($allCategories as $categoryId => $category) {
                    if (isset($categoryGroups[$categoryId])) {
                        $count = $categoryGroups[$categoryId]->count();
                        $genderLabel = $category->gender === 'male' ? 'ذكور' : ($category->gender === 'female' ? 'إناث' : '');
                        $label = $genderLabel ? "{$category->name} ({$genderLabel})" : $category->name;
                        $studentsByCategory[$label] = $count;
                    }
                }

                // Handle students with no category
                if (isset($categoryGroups[null]) || isset($categoryGroups[''])) {
                    $nullCount = ($categoryGroups[null] ?? collect())->count() + ($categoryGroups[''] ?? collect())->count();
                    if ($nullCount > 0) {
                        $studentsByCategory['غير محدد'] = $nullCount;
                    }
                }

                // Add users with no clubs to total count
                $club->users_count += $usersWithNoClubsCount;
                $club->users_by_role = $usersByRole;
                $club->students_by_category = $studentsByCategory;

                // Remove the eager loaded relations to keep response clean
                unset($club->users);
                unset($club->students);

                return $club;
            });

        return Inertia::render('Dashboard/Clubs/Index', [
            'clubs' => $clubs,
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
            'club' => $club,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $club = Club::withTrashed()->findOrFail($id);

        return Inertia::render('Dashboard/Clubs/Edit', [
            'club' => $club,
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
