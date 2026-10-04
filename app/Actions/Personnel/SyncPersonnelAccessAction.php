<?php

namespace App\Actions\Personnel;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SyncPersonnelAccessAction
{
    /**
     * Sync the clubs a personnel can access and, per club, the categories they are restricted to.
     * A club without categories (or with an empty list) grants every category in that club.
     *
     * @param  array<int, int>  $clubIds
     * @param  array<int|string, array<int, int>>  $clubCategories  club id → category ids
     * @return array{clubs:int, restrictions:int}
     */
    public function execute(User $user, array $clubIds, array $clubCategories = []): array
    {
        $clubIds = array_values(array_unique(array_map('intval', $clubIds)));

        foreach (array_keys($clubCategories) as $clubId) {
            if (! in_array((int) $clubId, $clubIds, true)) {
                throw ValidationException::withMessages([
                    "club_categories.{$clubId}" => 'لا يمكن تحديد أقسام لنادٍ غير مختار',
                ]);
            }
        }

        return DB::transaction(function () use ($user, $clubIds, $clubCategories) {
            $user->clubs()->sync($clubIds);

            $user->categoryRestrictions()->detach();

            $restrictionCount = 0;
            foreach ($clubCategories as $clubId => $categoryIds) {
                $categoryIds = array_values(array_unique(array_map('intval', $categoryIds ?? [])));
                $user->categoryRestrictions()->attach($categoryIds, ['club_id' => (int) $clubId]);
                $restrictionCount += count($categoryIds);
            }

            $user->flushAccessMap();

            activity()
                ->performedOn($user)
                ->withProperties(['clubs' => $clubIds, 'club_categories' => $clubCategories])
                ->log('تحديث صلاحيات الوصول');

            return ['clubs' => count($clubIds), 'restrictions' => $restrictionCount];
        });
    }
}
