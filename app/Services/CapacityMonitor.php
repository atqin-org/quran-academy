<?php

namespace App\Services;

use App\Models\ClubCategorySession;
use App\Models\Group;
use App\Models\Student;

class CapacityMonitor
{
    /**
     * Return all classes/groups currently exceeding their admin-set capacity.
     *
     * Rule: when a (club, category) has any active group, capacity is enforced
     * per-group; otherwise, capacity is enforced on the club_category_sessions row.
     *
     * @return array<int, array<string, mixed>>
     */
    public function getOverflows(): array
    {
        return [
            ...$this->groupOverflows(),
            ...$this->clubCategoryOverflows(),
        ];
    }

    /**
     * Active groups whose student count exceeds their capacity.
     *
     * @return array<int, array<string, mixed>>
     */
    private function groupOverflows(): array
    {
        $groups = Group::query()
            ->whereNotNull('capacity')
            ->where('is_active', true)
            ->withCount('students')
            ->with(['club:id,name', 'category:id,name'])
            ->get()
            ->filter(fn (Group $group) => $group->students_count > $group->capacity);

        return $groups->map(fn (Group $group) => [
            'kind' => 'group',
            'id' => $group->id,
            'club_id' => $group->club_id,
            'category_id' => $group->category_id,
            'club_name' => $group->club?->name,
            'category_name' => $group->category?->name,
            'group_name' => $group->name,
            'current' => $group->students_count,
            'capacity' => $group->capacity,
            'manage_url' => route('groups.manage', [
                'club' => $group->club_id,
                'category' => $group->category_id,
            ], false),
        ])->values()->all();
    }

    /**
     * Club+category pairs (with no active groups) whose ungrouped-student count
     * exceeds the configured capacity.
     *
     * @return array<int, array<string, mixed>>
     */
    private function clubCategoryOverflows(): array
    {
        $configs = ClubCategorySession::query()
            ->whereNotNull('capacity')
            ->whereDoesntHave('club.groups', function ($query) {
                $query->whereColumn('groups.category_id', 'club_category_sessions.category_id')
                    ->where('groups.is_active', true);
            })
            ->with(['club:id,name', 'category:id,name'])
            ->get();

        $overflows = [];

        foreach ($configs as $config) {
            $count = Student::query()
                ->where('club_id', $config->club_id)
                ->where('category_id', $config->category_id)
                ->whereNull('group_id')
                ->count();

            if ($count <= $config->capacity) {
                continue;
            }

            $overflows[] = [
                'kind' => 'club_category',
                'club_id' => $config->club_id,
                'category_id' => $config->category_id,
                'club_name' => $config->club?->name,
                'category_name' => $config->category?->name,
                'current' => $count,
                'capacity' => $config->capacity,
                'manage_url' => route('clubs.sessions-config.edit', $config->club_id, false),
            ];
        }

        return $overflows;
    }
}
