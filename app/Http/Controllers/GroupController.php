<?php

namespace App\Http\Controllers;

use App\Actions\Group\CreateGroupAction;
use App\Actions\Group\MergeGroupsAction;
use App\Actions\Group\TransferStudentAction;
use App\Models\Category;
use App\Models\Club;
use App\Models\Group;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GroupController extends Controller
{
    /**
     * Groups management page for a club (with categories sidebar)
     */
    public function clubGroups(Club $club, ?Category $category = null): Response
    {
        // Get all categories that have students in this club
        $categoriesWithStudents = Category::whereHas('students', function ($query) use ($club) {
            $query->where('club_id', $club->id);
        })->orderBy('id')->get();

        // If no category selected, use the first one (if available)
        $selectedCategory = $category ?? $categoriesWithStudents->first();

        $groups = [];
        $ungroupedStudents = [];

        if ($selectedCategory) {
            $groups = Group::where('club_id', $club->id)
                ->where('category_id', $selectedCategory->id)
                ->where('is_active', true)
                ->withCount('students')
                ->with(['students' => function ($query) {
                    $query->orderBy('first_name')->select('id', 'first_name', 'last_name', 'group_id');
                }])
                ->orderBy('order')
                ->get();

            $ungroupedStudents = Student::where('club_id', $club->id)
                ->where('category_id', $selectedCategory->id)
                ->whereNull('group_id')
                ->orderBy('first_name')
                ->select('id', 'first_name', 'last_name', 'group_id')
                ->get();
        }

        // Check if new group can be created
        $canCreateGroup = false;
        $totalStudents = 0;
        if ($selectedCategory) {
            $totalStudents = Student::where('club_id', $club->id)
                ->where('category_id', $selectedCategory->id)
                ->count();
            $canCreateGroup = CreateGroupAction::canCreateNewGroup($club->id, $selectedCategory->id);
        }

        return Inertia::render('Dashboard/Groups/Index', [
            'club' => $club->only('id', 'name'),
            'categories' => $categoriesWithStudents->map(fn ($cat) => [
                'id' => $cat->id,
                'name' => $cat->name,
                'display_name' => $cat->display_name,
                'students_count' => Student::where('club_id', $club->id)
                    ->where('category_id', $cat->id)
                    ->count(),
                'groups_count' => Group::where('club_id', $club->id)
                    ->where('category_id', $cat->id)
                    ->count(),
            ]),
            'selectedCategory' => $selectedCategory?->only('id', 'name', 'display_name'),
            'groups' => $groups,
            'ungroupedStudents' => $ungroupedStudents,
            'canCreateGroup' => $canCreateGroup,
            'totalStudents' => $totalStudents,
        ]);
    }

    /**
     * Get groups for a club+category (AJAX endpoint)
     */
    public function getGroups(Request $request): JsonResponse
    {
        $request->validate([
            'club_id' => 'required|exists:clubs,id',
            'category_id' => 'required|exists:categories,id',
        ]);

        $groups = Group::where('club_id', $request->club_id)
            ->where('category_id', $request->category_id)
            ->where('is_active', true)
            ->withCount('students')
            ->orderBy('order')
            ->get();

        return response()->json(['groups' => $groups]);
    }

    /**
     * Group management page for a club+category class
     */
    public function manage(Club $club, Category $category): Response
    {
        $groups = Group::where('club_id', $club->id)
            ->where('category_id', $category->id)
            ->where('is_active', true)
            ->withCount('students')
            ->with(['students' => function ($query) {
                $query->orderBy('first_name')->select('id', 'first_name', 'last_name', 'group_id');
            }])
            ->orderBy('order')
            ->get();

        $ungroupedStudents = Student::where('club_id', $club->id)
            ->where('category_id', $category->id)
            ->whereNull('group_id')
            ->orderBy('first_name')
            ->select('id', 'first_name', 'last_name', 'group_id')
            ->get();

        return Inertia::render('Dashboard/Groups/Manage', [
            'club' => $club->only('id', 'name'),
            'category' => $category->only('id', 'name', 'display_name'),
            'groups' => $groups,
            'ungroupedStudents' => $ungroupedStudents,
        ]);
    }

    /**
     * Create a new group
     * Optionally accepts student_ids to transfer to the new group
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'club_id' => 'required|exists:clubs,id',
            'category_id' => 'required|exists:categories,id',
            'student_ids' => 'nullable|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        // Check if group creation is allowed
        if (! CreateGroupAction::canCreateNewGroup($request->club_id, $request->category_id)) {
            return redirect()->back()->with('error', 'لا يمكن إنشاء فوج جديد - يجب أن يكون هناك طلاب يمكن نقلهم');
        }

        $result = (new CreateGroupAction)->execute(
            $request->club_id,
            $request->category_id
        );

        // Handle array return (first groups creation)
        if (is_array($result)) {
            activity('group')
                ->causedBy(auth()->user())
                ->withProperties([
                    'group1' => $result[0]->name,
                    'group2' => $result[1]->name,
                ])
                ->log('تم إنشاء الأفواج الأولى: '.$result[0]->name.' و '.$result[1]->name);

            return redirect()->back()->with('success', 'تم إنشاء فوجين وتقسيم الطلاب بينهما');
        }

        // If student_ids provided, transfer them to the new group
        $transferredCount = 0;
        if ($request->filled('student_ids')) {
            // Validate that transferring won't empty any source group
            $studentsToTransfer = Student::whereIn('id', $request->student_ids)->get();
            $sourceGroups = $studentsToTransfer->groupBy('group_id');

            foreach ($sourceGroups as $sourceGroupId => $students) {
                if ($sourceGroupId === null) {
                    continue;
                }

                $sourceGroup = Group::find($sourceGroupId);
                if ($sourceGroup) {
                    $remainingStudents = $sourceGroup->students()->count() - $students->count();
                    if ($remainingStudents === 0) {
                        // Rollback by deleting the newly created group
                        $result->delete();

                        return redirect()->back()->with('error', "لا يمكن نقل جميع طلاب فوج {$sourceGroup->name} - يجب أن يبقى طالب واحد على الأقل");
                    }
                }
            }

            // Transfer students to the new group
            $transferredCount = Student::whereIn('id', $request->student_ids)
                ->update(['group_id' => $result->id]);
        }

        activity('group')
            ->performedOn($result)
            ->causedBy(auth()->user())
            ->withProperties(['students_transferred' => $transferredCount])
            ->log("تم إنشاء فوج جديد: {$result->name}".($transferredCount > 0 ? " ونقل {$transferredCount} طالب إليه" : ''));

        $message = $transferredCount > 0
            ? "تم إنشاء الفوج ونقل {$transferredCount} طالب إليه"
            : 'تم إنشاء الفوج بنجاح';

        return redirect()->back()->with('success', $message);
    }

    /**
     * Delete a group (only if empty)
     * If only 2 groups exist, delete both and ungroup all students
     */
    public function destroy(Group $group): RedirectResponse
    {
        if ($group->students()->count() > 0) {
            return redirect()->back()->with('error', 'لا يمكن حذف الفوج لأنه يحتوي على طلاب');
        }

        $clubId = $group->club_id;
        $categoryId = $group->category_id;

        // Count remaining groups
        $groupCount = Group::where('club_id', $clubId)
            ->where('category_id', $categoryId)
            ->count();

        // If only 2 groups exist, delete both and ungroup all students
        if ($groupCount === 2) {
            // Get both groups
            $allGroups = Group::where('club_id', $clubId)
                ->where('category_id', $categoryId)
                ->get();

            // Ungroup all students
            Student::where('club_id', $clubId)
                ->where('category_id', $categoryId)
                ->update(['group_id' => null]);

            // Delete both groups
            $groupNames = $allGroups->pluck('name')->join(' و ');
            foreach ($allGroups as $g) {
                $g->delete();
            }

            activity('group')
                ->causedBy(auth()->user())
                ->withProperties(['group_names' => $groupNames])
                ->log("تم حذف جميع الأفواج: {$groupNames}");

            return redirect()->back()->with('success', 'تم حذف جميع الأفواج وإلغاء تصنيف الطلاب');
        }

        $groupName = $group->name;
        $group->delete();

        activity('group')
            ->causedBy(auth()->user())
            ->withProperties(['group_name' => $groupName])
            ->log("تم حذف الفوج: {$groupName}");

        return redirect()->back()->with('success', 'تم حذف الفوج بنجاح');
    }

    /**
     * Merge two groups
     * If only 2 groups exist, both are deleted and students become ungrouped
     */
    public function merge(Request $request): RedirectResponse
    {
        $request->validate([
            'source_group_id' => 'required|exists:groups,id',
            'target_group_id' => 'required|exists:groups,id|different:source_group_id',
        ]);

        $sourceGroup = Group::findOrFail($request->source_group_id);
        $targetGroup = Group::findOrFail($request->target_group_id);

        // Verify both groups belong to same club+category
        if ($sourceGroup->club_id !== $targetGroup->club_id ||
            $sourceGroup->category_id !== $targetGroup->category_id) {
            return redirect()->back()->with('error', 'لا يمكن دمج أفواج من فصول مختلفة');
        }

        $result = (new MergeGroupsAction)->execute($sourceGroup, $targetGroup);

        // If both groups were deleted (only 2 existed)
        if ($result['deleted_both']) {
            activity('group')
                ->causedBy(auth()->user())
                ->withProperties([
                    'source_group' => $sourceGroup->name,
                    'target_group' => $targetGroup->name,
                    'students_count' => $result['moved'],
                ])
                ->log("تم حذف جميع الأفواج بعد الدمج: {$sourceGroup->name} و {$targetGroup->name}");

            return redirect()->back()->with('success', 'تم حذف جميع الأفواج - لا يمكن وجود فوج واحد فقط');
        }

        activity('group')
            ->performedOn($targetGroup)
            ->causedBy(auth()->user())
            ->withProperties([
                'source_group' => $sourceGroup->name,
                'target_group' => $targetGroup->name,
                'students_moved' => $result['moved'],
            ])
            ->log("تم دمج فوج {$sourceGroup->name} في فوج {$targetGroup->name}");

        return redirect()->back()->with('success', "تم دمج الأفواج بنجاح ({$result['moved']} طالب)");
    }

    /**
     * Transfer a single student to another group
     * Business rules:
     * - Cannot transfer to "ungrouped" if groups exist
     * - Cannot transfer if it would make source group empty
     */
    public function transferStudent(Request $request): RedirectResponse
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'group_id' => 'nullable|exists:groups,id',
        ]);

        $student = Student::findOrFail($request->student_id);
        $targetGroup = $request->group_id ? Group::find($request->group_id) : null;

        // Check if groups exist for this club+category
        $groupCount = Group::where('club_id', $student->club_id)
            ->where('category_id', $student->category_id)
            ->count();

        // Prevent transferring to "ungrouped" if groups exist
        if (! $targetGroup && $groupCount > 0) {
            return redirect()->back()->with('error', 'لا يمكن إلغاء تصنيف الطالب عند وجود أفواج');
        }

        // Verify target group belongs to same club+category as student
        if ($targetGroup && ($targetGroup->club_id !== $student->club_id ||
            $targetGroup->category_id !== $student->category_id)) {
            return redirect()->back()->with('error', 'لا يمكن نقل الطالب إلى فوج من فصل مختلف');
        }

        // Check if this would empty the source group
        if ($student->group_id && (! $targetGroup || $targetGroup->id !== $student->group_id)) {
            $sourceGroup = Group::find($student->group_id);
            if ($sourceGroup && $sourceGroup->students()->count() === 1) {
                return redirect()->back()->with('error', "لا يمكن نقل آخر طالب من فوج {$sourceGroup->name}");
            }
        }

        (new TransferStudentAction)->execute($student, $targetGroup);

        $groupName = $targetGroup ? "فوج {$targetGroup->name}" : 'بدون فوج';

        activity('student')
            ->performedOn($student)
            ->causedBy(auth()->user())
            ->withProperties(['target_group' => $groupName])
            ->log("تم نقل الطالب {$student->first_name} {$student->last_name} إلى {$groupName}");

        return redirect()->back()->with('success', 'تم نقل الطالب بنجاح');
    }

    /**
     * Bulk transfer students to another group
     * Business rules:
     * - Cannot transfer to "ungrouped" if groups exist
     * - Cannot transfer all students out of a group (would make it empty)
     */
    public function bulkTransfer(Request $request): RedirectResponse
    {
        $request->validate([
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'exists:students,id',
            'group_id' => 'nullable|exists:groups,id',
        ]);

        $targetGroup = $request->group_id ? Group::find($request->group_id) : null;
        $firstStudent = Student::find($request->student_ids[0]);
        $clubId = $firstStudent->club_id;
        $categoryId = $firstStudent->category_id;

        // Check if groups exist for this club+category
        $groupCount = Group::where('club_id', $clubId)
            ->where('category_id', $categoryId)
            ->count();

        // Prevent transferring to "ungrouped" if groups exist
        if (! $targetGroup && $groupCount > 0) {
            return redirect()->back()->with('error', 'لا يمكن إلغاء تصنيف الطلاب عند وجود أفواج - يجب نقلهم إلى فوج آخر');
        }

        // Verify target group belongs to same club+category
        if ($targetGroup && ($targetGroup->club_id !== $clubId ||
            $targetGroup->category_id !== $categoryId)) {
            return redirect()->back()->with('error', 'لا يمكن نقل الطلاب إلى فوج من فصل مختلف');
        }

        // Check if this would empty any source group
        $studentsToTransfer = Student::whereIn('id', $request->student_ids)->get();
        $sourceGroups = $studentsToTransfer->groupBy('group_id');

        foreach ($sourceGroups as $sourceGroupId => $students) {
            if ($sourceGroupId === null) {
                continue; // Ungrouped students can be moved freely
            }

            // Skip if transferring to same group
            if ($targetGroup && $sourceGroupId == $targetGroup->id) {
                continue;
            }

            $sourceGroup = Group::find($sourceGroupId);
            if ($sourceGroup) {
                $remainingStudents = $sourceGroup->students()->count() - $students->count();
                if ($remainingStudents === 0) {
                    return redirect()->back()->with('error', "لا يمكن نقل جميع طلاب فوج {$sourceGroup->name} - يجب أن يبقى طالب واحد على الأقل");
                }
            }
        }

        Student::whereIn('id', $request->student_ids)
            ->update(['group_id' => $targetGroup?->id]);

        $count = count($request->student_ids);
        $groupName = $targetGroup ? "فوج {$targetGroup->name}" : 'بدون فوج';

        activity('group')
            ->causedBy(auth()->user())
            ->withProperties([
                'students_count' => $count,
                'target_group' => $groupName,
            ])
            ->log("تم نقل {$count} طالب إلى {$groupName}");

        return redirect()->back()->with('success', "تم نقل {$count} طالب بنجاح");
    }
}
