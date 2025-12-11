<?php

namespace App\Http\Controllers;

use App\Models\Club;
use App\Models\Category;
use App\Models\ClubCategorySession;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClubCategorySessionController extends Controller
{
    /**
     * Show configuration page for a club's category sessions
     */
    public function edit(Club $club)
    {
        $categories = Category::all();
        $configs = ClubCategorySession::where('club_id', $club->id)
            ->get()
            ->keyBy('category_id');

        // Build config data with defaults
        $categoryConfigs = $categories->map(function ($category) use ($configs) {
            $config = $configs->get($category->id);
            return [
                'category_id' => $category->id,
                'category_name' => $category->name,
                'category_gender' => $category->gender,
                'sessions_per_month' => $config?->sessions_per_month ?? 12,
                'has_config' => $config !== null,
            ];
        });

        return Inertia::render('Dashboard/Clubs/SessionConfig', [
            'club' => $club,
            'categoryConfigs' => $categoryConfigs,
        ]);
    }

    /**
     * Update configurations for a club
     */
    public function update(Request $request, Club $club)
    {
        $validated = $request->validate([
            'configs' => 'required|array',
            'configs.*.category_id' => 'required|exists:categories,id',
            'configs.*.sessions_per_month' => 'required|integer|min:1|max:31',
        ]);

        foreach ($validated['configs'] as $config) {
            ClubCategorySession::updateOrCreate(
                [
                    'club_id' => $club->id,
                    'category_id' => $config['category_id'],
                ],
                [
                    'sessions_per_month' => $config['sessions_per_month'],
                ]
            );
        }

        activity('club_config')
            ->performedOn($club)
            ->causedBy(auth()->user())
            ->withProperties(['configs' => $validated['configs']])
            ->log('تم تحديث إعدادات الحصص للنادي');

        return redirect()->back()->with('success', 'تم حفظ الإعدادات بنجاح');
    }
}
