<?php

namespace App\Actions\Group;

use App\Models\Group;
use App\Models\Student;

class MergeGroupsAction
{
    /**
     * Merge two groups.
     * If only 2 groups exist, delete both and ungroup all students (can't have 1 group).
     *
     * @return array{moved: int, deleted_both: bool}
     */
    public function execute(Group $sourceGroup, Group $targetGroup): array
    {
        $clubId = $sourceGroup->club_id;
        $categoryId = $sourceGroup->category_id;

        // Count total groups for this club+category
        $groupCount = Group::where('club_id', $clubId)
            ->where('category_id', $categoryId)
            ->count();

        // Move all students from source to target first
        $movedCount = Student::where('group_id', $sourceGroup->id)
            ->update(['group_id' => $targetGroup->id]);

        // If only 2 groups exist, merging would leave 1 group which is not logical
        // Delete both groups and ungroup all students
        if ($groupCount === 2) {
            // Ungroup all students in this class
            Student::where('club_id', $clubId)
                ->where('category_id', $categoryId)
                ->update(['group_id' => null]);

            // Delete both groups
            $sourceGroup->delete();
            $targetGroup->delete();

            return ['moved' => $movedCount, 'deleted_both' => true];
        }

        // Normal case: just delete the source group
        $sourceGroup->delete();

        return ['moved' => $movedCount, 'deleted_both' => false];
    }
}
