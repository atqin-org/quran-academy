<?php

namespace App\Actions\Group;

use App\Models\Group;
use App\Models\Student;

class CreateGroupAction
{
    /**
     * Create a new group for a club+category.
     * Business rules:
     * - First group creation creates 2 groups and splits students between them
     * - Subsequent group creation requires available students to move
     *
     * @return Group|array Returns single Group or array of Groups when creating first groups
     */
    public function execute(int $clubId, int $categoryId, ?string $name = null): Group|array
    {
        // Check if this will be the first group for this club+category
        $existingGroupCount = Group::where('club_id', $clubId)
            ->where('category_id', $categoryId)
            ->count();

        if ($existingGroupCount === 0) {
            // Creating first groups - must create 2 and split students
            return $this->createInitialGroups($clubId, $categoryId);
        }

        // Creating additional group - just create the group
        // The controller should validate that there are students available to transfer
        $name = $name ?? Group::getNextName($clubId, $categoryId);
        $order = Group::getNextOrder($clubId, $categoryId);

        return Group::create([
            'club_id' => $clubId,
            'category_id' => $categoryId,
            'name' => $name,
            'order' => $order,
            'is_active' => true,
        ]);
    }

    /**
     * Create the initial 2 groups and split students between them
     */
    private function createInitialGroups(int $clubId, int $categoryId): array
    {
        // Get all students for this club+category
        $students = Student::where('club_id', $clubId)
            ->where('category_id', $categoryId)
            ->orderBy('first_name')
            ->get();

        // Create first group (أ)
        $group1 = Group::create([
            'club_id' => $clubId,
            'category_id' => $categoryId,
            'name' => Group::getNextName($clubId, $categoryId),
            'order' => 1,
            'is_active' => true,
        ]);

        // Create second group (ب)
        $group2 = Group::create([
            'club_id' => $clubId,
            'category_id' => $categoryId,
            'name' => Group::getNextName($clubId, $categoryId),
            'order' => 2,
            'is_active' => true,
        ]);

        // Split students between the two groups
        $studentCount = $students->count();
        $halfPoint = (int) ceil($studentCount / 2);

        foreach ($students as $index => $student) {
            // Use query builder to avoid custom update method in Student model
            Student::where('id', $student->id)->update([
                'group_id' => $index < $halfPoint ? $group1->id : $group2->id,
            ]);
        }

        return [$group1, $group2];
    }

    /**
     * Check if a new group can be created (there must be students that can be moved)
     */
    public static function canCreateNewGroup(int $clubId, int $categoryId): bool
    {
        $groupCount = Group::where('club_id', $clubId)
            ->where('category_id', $categoryId)
            ->count();

        // If no groups exist, check if there are at least 2 students to split
        if ($groupCount === 0) {
            return Student::where('club_id', $clubId)
                ->where('category_id', $categoryId)
                ->count() >= 2;
        }

        // If groups exist, check if any group has more than 1 student (can spare some)
        // Use get() + filter to avoid SQLite HAVING issues
        return Group::where('club_id', $clubId)
            ->where('category_id', $categoryId)
            ->withCount('students')
            ->get()
            ->contains(fn ($group) => $group->students_count > 1);
    }
}
