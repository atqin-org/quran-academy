<?php

use App\Actions\Attendance\RecordAttendanceAction;
use App\Actions\Group\CreateGroupAction;
use App\Actions\Group\MergeGroupsAction;
use App\Actions\Group\TransferStudentAction;
use App\Models\Category;
use App\Models\Club;
use App\Models\Group;
use App\Models\Program;
use App\Models\ProgramSession;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates 2 groups and splits students when creating first groups', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    // Create 4 students without a group
    $students = Student::factory()->count(4)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => null,
    ]);

    // Create the first groups (should return array of 2 groups)
    $result = (new CreateGroupAction)->execute($club->id, $category->id);

    expect($result)->toBeArray()
        ->and($result)->toHaveCount(2)
        ->and($result[0])->toBeInstanceOf(Group::class)
        ->and($result[1])->toBeInstanceOf(Group::class)
        ->and($result[0]->name)->toBe('أ')
        ->and($result[1]->name)->toBe('ب')
        ->and($result[0]->club_id)->toBe($club->id)
        ->and($result[0]->category_id)->toBe($category->id);

    // Students should be split between the 2 groups (2 each)
    $group1Students = Student::where('group_id', $result[0]->id)->count();
    $group2Students = Student::where('group_id', $result[1]->id)->count();

    expect($group1Students)->toBe(2)
        ->and($group2Students)->toBe(2);

    // No ungrouped students should remain
    $ungroupedCount = Student::where('club_id', $club->id)
        ->where('category_id', $category->id)
        ->whereNull('group_id')
        ->count();

    expect($ungroupedCount)->toBe(0);
});

it('creates subsequent groups as single group', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    // Create students and initial 2 groups
    Student::factory()->count(6)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => null,
    ]);

    $initialGroups = (new CreateGroupAction)->execute($club->id, $category->id);
    expect($initialGroups)->toBeArray()->toHaveCount(2);

    // Create third group (should return single Group)
    $group3 = (new CreateGroupAction)->execute($club->id, $category->id);

    expect($group3)->toBeInstanceOf(Group::class)
        ->and($group3->name)->toBe('ج');
});

it('cannot create first groups without at least 2 students', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    // Create only 1 student
    Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => null,
    ]);

    $canCreate = CreateGroupAction::canCreateNewGroup($club->id, $category->id);

    expect($canCreate)->toBeFalse();
});

it('cannot create new group when no group has spare students', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    // Create 2 groups with exactly 1 student each (no spare students)
    $group1 = Group::factory()->forClubCategory($club, $category)->create();
    $group2 = Group::factory()->forClubCategory($club, $category)->create();

    Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group1->id,
    ]);

    Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group2->id,
    ]);

    $canCreate = CreateGroupAction::canCreateNewGroup($club->id, $category->id);

    expect($canCreate)->toBeFalse();
});

it('can create new group when a group has spare students', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    // Create 2 groups, one with 2 students (has spare)
    $group1 = Group::factory()->forClubCategory($club, $category)->create();
    $group2 = Group::factory()->forClubCategory($club, $category)->create();

    Student::factory()->count(2)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group1->id,
    ]);

    Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group2->id,
    ]);

    $canCreate = CreateGroupAction::canCreateNewGroup($club->id, $category->id);

    expect($canCreate)->toBeTrue();
});

it('allows custom group name for subsequent groups', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    // Create initial groups first
    Student::factory()->count(4)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => null,
    ]);

    (new CreateGroupAction)->execute($club->id, $category->id);

    // Create third group with custom name
    $group = (new CreateGroupAction)->execute($club->id, $category->id, 'مخصص');

    expect($group)->toBeInstanceOf(Group::class)
        ->and($group->name)->toBe('مخصص');
});

it('merging 2 groups deletes both and ungroups all students', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $sourceGroup = Group::factory()->forClubCategory($club, $category)->create();
    $targetGroup = Group::factory()->forClubCategory($club, $category)->create();

    // Create students in both groups
    $studentsInSource = Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $sourceGroup->id,
    ]);

    $studentsInTarget = Student::factory()->count(2)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $targetGroup->id,
    ]);

    $result = (new MergeGroupsAction)->execute($sourceGroup, $targetGroup);

    expect($result['moved'])->toBe(3)
        ->and($result['deleted_both'])->toBeTrue();

    // All students should now be ungrouped
    foreach ($studentsInSource as $student) {
        $student->refresh();
        expect($student->group_id)->toBeNull();
    }
    foreach ($studentsInTarget as $student) {
        $student->refresh();
        expect($student->group_id)->toBeNull();
    }

    // Both groups should be soft-deleted
    $sourceGroup->refresh();
    $targetGroup->refresh();
    expect($sourceGroup->trashed())->toBeTrue()
        ->and($targetGroup->trashed())->toBeTrue();
});

it('merging groups with 3+ groups keeps target group', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $group1 = Group::factory()->forClubCategory($club, $category)->create();
    $group2 = Group::factory()->forClubCategory($club, $category)->create();
    $group3 = Group::factory()->forClubCategory($club, $category)->create();

    // Create students in group1
    $students = Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group1->id,
    ]);

    $result = (new MergeGroupsAction)->execute($group1, $group2);

    expect($result['moved'])->toBe(3)
        ->and($result['deleted_both'])->toBeFalse();

    // All students should now be in group2
    foreach ($students as $student) {
        $student->refresh();
        expect($student->group_id)->toBe($group2->id);
    }

    // Only source group should be soft-deleted
    $group1->refresh();
    $group2->refresh();
    expect($group1->trashed())->toBeTrue()
        ->and($group2->trashed())->toBeFalse();
});

it('cannot delete group with students', function () {
    $user = User::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    // Need at least 3 groups to avoid the "delete both when 2 remain" rule
    $group1 = Group::factory()->forClubCategory($club, $category)->create();
    $group2 = Group::factory()->forClubCategory($club, $category)->create();
    $group3 = Group::factory()->forClubCategory($club, $category)->create();

    Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group1->id,
    ]);

    $response = $this->actingAs($user)->delete(route('groups.destroy', $group1));

    $response->assertRedirect();
    $response->assertSessionHas('error');

    $this->assertDatabaseHas('groups', ['id' => $group1->id, 'deleted_at' => null]);
});

it('can delete empty group when more than 2 groups exist', function () {
    $user = User::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    // Create 3 groups
    $group1 = Group::factory()->forClubCategory($club, $category)->create();
    $group2 = Group::factory()->forClubCategory($club, $category)->create();
    $group3 = Group::factory()->forClubCategory($club, $category)->create();

    // All groups are empty, delete one
    $response = $this->actingAs($user)->delete(route('groups.destroy', $group1));

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertSoftDeleted('groups', ['id' => $group1->id]);
    // Other groups should still exist
    $this->assertDatabaseHas('groups', ['id' => $group2->id, 'deleted_at' => null]);
    $this->assertDatabaseHas('groups', ['id' => $group3->id, 'deleted_at' => null]);
});

it('deletes both groups when only 2 groups exist and one is deleted', function () {
    $user = User::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    // Create 2 groups
    $group1 = Group::factory()->forClubCategory($club, $category)->create();
    $group2 = Group::factory()->forClubCategory($club, $category)->create();

    // Put students in them
    $student1 = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group1->id,
    ]);
    $student2 = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group2->id,
    ]);

    // To delete, group must be empty, so first move students using query builder
    Student::where('id', $student1->id)->update(['group_id' => $group2->id]);

    // Now delete empty group1 - should delete both
    $response = $this->actingAs($user)->delete(route('groups.destroy', $group1));

    $response->assertRedirect();
    $response->assertSessionHas('success');

    // Both groups should be deleted
    $this->assertSoftDeleted('groups', ['id' => $group1->id]);
    $this->assertSoftDeleted('groups', ['id' => $group2->id]);

    // Students should be ungrouped
    $student1->refresh();
    $student2->refresh();
    expect($student1->group_id)->toBeNull()
        ->and($student2->group_id)->toBeNull();
});

it('can transfer student between groups', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $sourceGroup = Group::factory()->forClubCategory($club, $category)->create();
    $targetGroup = Group::factory()->forClubCategory($club, $category)->create();

    // Create 2 students in source group (so transferring 1 doesn't empty it)
    Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $sourceGroup->id,
    ]);

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $sourceGroup->id,
    ]);

    (new TransferStudentAction)->execute($student, $targetGroup);

    $student->refresh();
    expect($student->group_id)->toBe($targetGroup->id);
});

it('can transfer student to ungrouped via action when no groups constraint', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $group = Group::factory()->forClubCategory($club, $category)->create();

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    // The action itself allows ungrouping - the controller enforces the rule
    (new TransferStudentAction)->execute($student, null);

    $student->refresh();
    expect($student->group_id)->toBeNull();
});

it('cannot transfer student to ungrouped via controller when groups exist', function () {
    $user = User::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $group1 = Group::factory()->forClubCategory($club, $category)->create();
    $group2 = Group::factory()->forClubCategory($club, $category)->create();

    // Create 2 students in group1 so we can try to transfer one
    Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group1->id,
    ]);

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group1->id,
    ]);

    // Try to ungroup student via controller
    $response = $this->actingAs($user)->post(route('groups.transferStudent'), [
        'student_id' => $student->id,
        'group_id' => null,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('error');

    // Student should still be in original group
    $student->refresh();
    expect($student->group_id)->toBe($group1->id);
});

it('cannot transfer last student from a group', function () {
    $user = User::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $sourceGroup = Group::factory()->forClubCategory($club, $category)->create();
    $targetGroup = Group::factory()->forClubCategory($club, $category)->create();

    // Only 1 student in source group
    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $sourceGroup->id,
    ]);

    $response = $this->actingAs($user)->post(route('groups.transferStudent'), [
        'student_id' => $student->id,
        'group_id' => $targetGroup->id,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('error');

    // Student should still be in source group
    $student->refresh();
    expect($student->group_id)->toBe($sourceGroup->id);
});

it('captures historical group_id on attendance', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $group = Group::factory()->forClubCategory($club, $category)->create();

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    $program = Program::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $session = ProgramSession::factory()->create([
        'program_id' => $program->id,
    ]);

    $attendance = (new RecordAttendanceAction)->execute($session, $student, 'present');

    expect($attendance->group_id)->toBe($group->id);

    $this->assertDatabaseHas('attendances', [
        'id' => $attendance->id,
        'group_id' => $group->id,
    ]);
});

it('preserves attendance group_id when student changes groups', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $groupA = Group::factory()->forClubCategory($club, $category)->create(['name' => 'أ']);
    $groupB = Group::factory()->forClubCategory($club, $category)->create(['name' => 'ب']);

    // Create 2 students in groupA so we can transfer one
    Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $groupA->id,
    ]);

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $groupA->id,
    ]);

    $program = Program::factory()->create();
    $session = ProgramSession::factory()->create(['program_id' => $program->id]);

    // Record attendance while in group A
    $attendance = (new RecordAttendanceAction)->execute($session, $student, 'present');
    expect($attendance->group_id)->toBe($groupA->id);

    // Transfer student to group B
    (new TransferStudentAction)->execute($student, $groupB);

    // Attendance should still show group A (historical)
    $attendance->refresh();
    expect($attendance->group_id)->toBe($groupA->id);

    // Student should now be in group B
    $student->refresh();
    expect($student->group_id)->toBe($groupB->id);
});

it('program with group_id filters students by that group', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $groupA = Group::factory()->forClubCategory($club, $category)->create(['name' => 'أ']);
    $groupB = Group::factory()->forClubCategory($club, $category)->create(['name' => 'ب']);

    // Create students in different groups
    $studentInGroupA = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $groupA->id,
    ]);

    $studentInGroupB = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $groupB->id,
    ]);

    // Program targeting group A
    $program = Program::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $groupA->id,
    ]);

    // Get students for this program (should only be group A)
    $studentsQuery = Student::where('club_id', $program->club_id)
        ->where('category_id', $program->category_id);

    if ($program->group_id) {
        $studentsQuery->where('group_id', $program->group_id);
    }

    $students = $studentsQuery->get();

    expect($students)->toHaveCount(1)
        ->and($students->first()->id)->toBe($studentInGroupA->id);
});

it('program without group_id shows all students in class', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $groupA = Group::factory()->forClubCategory($club, $category)->create(['name' => 'أ']);
    $groupB = Group::factory()->forClubCategory($club, $category)->create(['name' => 'ب']);

    // Create students in different groups
    Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $groupA->id,
    ]);

    Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $groupB->id,
    ]);

    // Note: With new business rules, ungrouped students shouldn't exist when groups exist
    // But for backward compatibility, the program query still handles this case

    // Program without group targeting (backward compatible)
    $program = Program::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => null,
    ]);

    // Get students for this program (should be all students in class)
    $studentsQuery = Student::where('club_id', $program->club_id)
        ->where('category_id', $program->category_id);

    if ($program->group_id) {
        $studentsQuery->where('group_id', $program->group_id);
    }

    $students = $studentsQuery->get();

    expect($students)->toHaveCount(2);
});

it('reuses deleted letter names when creating new groups', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    // Create students first (need at least 2 for initial group creation)
    Student::factory()->count(4)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => null,
    ]);

    // Create initial groups (أ and ب)
    $initialGroups = (new CreateGroupAction)->execute($club->id, $category->id);
    expect($initialGroups)->toBeArray()
        ->and($initialGroups[0]->name)->toBe('أ')
        ->and($initialGroups[1]->name)->toBe('ب');

    // Create third group (ج)
    $group3 = (new CreateGroupAction)->execute($club->id, $category->id);
    expect($group3)->toBeInstanceOf(Group::class)
        ->and($group3->name)->toBe('ج');

    // Soft delete the second group (ب)
    $initialGroups[1]->delete();

    // Create fourth group - should REUSE ب (not skip to د)
    $group4 = (new CreateGroupAction)->execute($club->id, $category->id);
    expect($group4)->toBeInstanceOf(Group::class)
        ->and($group4->name)->toBe('ب');
});

it('groups are scoped to club and category', function () {
    $club1 = Club::factory()->create();
    $club2 = Club::factory()->create();
    $category = Category::factory()->create();

    // Create students in each club
    Student::factory()->count(2)->create([
        'club_id' => $club1->id,
        'category_id' => $category->id,
        'group_id' => null,
    ]);

    Student::factory()->count(2)->create([
        'club_id' => $club2->id,
        'category_id' => $category->id,
        'group_id' => null,
    ]);

    // Create groups in different clubs
    $groupsClub1 = (new CreateGroupAction)->execute($club1->id, $category->id);
    $groupsClub2 = (new CreateGroupAction)->execute($club2->id, $category->id);

    // Both should start with 'أ' since they're in different clubs
    expect($groupsClub1[0]->name)->toBe('أ')
        ->and($groupsClub2[0]->name)->toBe('أ');
});

it('can get groups via ajax endpoint', function () {
    $user = User::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $group1 = Group::factory()->forClubCategory($club, $category)->create();
    $group2 = Group::factory()->forClubCategory($club, $category)->create();

    $response = $this->actingAs($user)
        ->getJson(route('groups.index', [
            'club_id' => $club->id,
            'category_id' => $category->id,
        ]));

    $response->assertOk()
        ->assertJsonCount(2, 'groups')
        ->assertJsonPath('groups.0.id', $group1->id);
});

it('can bulk transfer students leaving at least one in source', function () {
    $user = User::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $sourceGroup = Group::factory()->forClubCategory($club, $category)->create();
    $targetGroup = Group::factory()->forClubCategory($club, $category)->create();

    // Create 4 students in source group
    $students = Student::factory()->count(4)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $sourceGroup->id,
    ]);

    // Transfer only 3 (leaving 1 in source)
    $studentsToTransfer = $students->take(3);

    $response = $this->actingAs($user)->post(route('groups.bulkTransfer'), [
        'student_ids' => $studentsToTransfer->pluck('id')->toArray(),
        'group_id' => $targetGroup->id,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    foreach ($studentsToTransfer as $student) {
        $student->refresh();
        expect($student->group_id)->toBe($targetGroup->id);
    }

    // 4th student should remain in source
    $remainingStudent = $students->last();
    $remainingStudent->refresh();
    expect($remainingStudent->group_id)->toBe($sourceGroup->id);
});

it('cannot bulk transfer all students from a group', function () {
    $user = User::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $sourceGroup = Group::factory()->forClubCategory($club, $category)->create();
    $targetGroup = Group::factory()->forClubCategory($club, $category)->create();

    // Create 3 students in source group
    $students = Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $sourceGroup->id,
    ]);

    // Try to transfer ALL students
    $response = $this->actingAs($user)->post(route('groups.bulkTransfer'), [
        'student_ids' => $students->pluck('id')->toArray(),
        'group_id' => $targetGroup->id,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('error');

    // Students should still be in source group
    foreach ($students as $student) {
        $student->refresh();
        expect($student->group_id)->toBe($sourceGroup->id);
    }
});

it('can create program with group targeting', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $group = Group::factory()->forClubCategory($club, $category)->create();

    $program = Program::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    expect($program->group_id)->toBe($group->id)
        ->and($program->group)->toBeInstanceOf(Group::class)
        ->and($program->group->id)->toBe($group->id);
});

it('handles deleted group gracefully in program', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $group = Group::factory()->forClubCategory($club, $category)->create();

    $program = Program::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    // Force delete the group (simulating SET NULL behavior)
    $group->forceDelete();

    $program->refresh();

    // Program's group_id should be null now
    expect($program->group_id)->toBeNull();
});

it('attendance records survive group deletion', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $group = Group::factory()->forClubCategory($club, $category)->create();

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    $program = Program::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    $session = ProgramSession::factory()->create(['program_id' => $program->id]);

    // Record attendance while group exists
    $attendance = (new RecordAttendanceAction)->execute($session, $student, 'present');
    $attendanceId = $attendance->id;
    $originalGroupId = $group->id;

    // Verify attendance was recorded with group_id
    expect($attendance->group_id)->toBe($originalGroupId);

    // Soft delete the group
    $group->delete();

    // Attendance record should still exist and retain original group_id
    $attendance->refresh();
    expect($attendance->group_id)->toBe($originalGroupId);

    $this->assertDatabaseHas('attendances', [
        'id' => $attendanceId,
        'student_id' => $student->id,
        'session_id' => $session->id,
        'group_id' => $originalGroupId,
        'status' => 'present',
    ]);

    // The historical group should still be accessible via withTrashed
    $historicalGroup = Group::withTrashed()->find($originalGroupId);
    expect($historicalGroup)->not->toBeNull()
        ->and($historicalGroup->trashed())->toBeTrue();
});

it('attendance records survive student soft deletion', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $program = Program::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $session = ProgramSession::factory()->create(['program_id' => $program->id]);

    // Record attendance
    $attendance = (new RecordAttendanceAction)->execute($session, $student, 'present');
    $attendanceId = $attendance->id;
    $studentId = $student->id;

    // Soft delete the student
    $student->delete();

    // Attendance record should still exist
    $this->assertDatabaseHas('attendances', [
        'id' => $attendanceId,
        'student_id' => $studentId,
        'session_id' => $session->id,
        'status' => 'present',
    ]);

    // Student should be accessible via withTrashed
    $deletedStudent = Student::withTrashed()->find($studentId);
    expect($deletedStudent)->not->toBeNull()
        ->and($deletedStudent->trashed())->toBeTrue();
});

it('can create group with students via store endpoint', function () {
    $user = User::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    // Create initial groups with students
    $group1 = Group::factory()->forClubCategory($club, $category)->create(['name' => 'أ']);
    $group2 = Group::factory()->forClubCategory($club, $category)->create(['name' => 'ب']);

    // Create students in group1 (need more than 1 to be able to transfer)
    $students = Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group1->id,
    ]);

    // Create one student in group2 (to keep it from being empty)
    Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group2->id,
    ]);

    // Select 2 students to move to the new group
    $studentsToTransfer = $students->take(2)->pluck('id')->toArray();

    // Create new group with students
    $response = $this->actingAs($user)->post(route('groups.store'), [
        'club_id' => $club->id,
        'category_id' => $category->id,
        'student_ids' => $studentsToTransfer,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    // New group (ج) should exist with the transferred students
    $newGroup = Group::where('club_id', $club->id)
        ->where('category_id', $category->id)
        ->where('name', 'ج')
        ->first();

    expect($newGroup)->not->toBeNull();
    expect($newGroup->students()->count())->toBe(2);

    // The transferred students should be in the new group
    foreach ($studentsToTransfer as $studentId) {
        $student = Student::find($studentId);
        expect($student->group_id)->toBe($newGroup->id);
    }

    // Original group should still have 1 student
    expect($group1->fresh()->students()->count())->toBe(1);
});

it('cannot create group with students that would empty source group', function () {
    $user = User::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    // Create groups
    $group1 = Group::factory()->forClubCategory($club, $category)->create(['name' => 'أ']);
    $group2 = Group::factory()->forClubCategory($club, $category)->create(['name' => 'ب']);

    // Create only 1 student in group1 (cannot be transferred)
    $student1 = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group1->id,
    ]);

    // Create student in group2 (need spare students somewhere)
    Student::factory()->count(2)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group2->id,
    ]);

    // Try to create group with the only student from group1
    $response = $this->actingAs($user)->post(route('groups.store'), [
        'club_id' => $club->id,
        'category_id' => $category->id,
        'student_ids' => [$student1->id],
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('error');

    // Student should still be in group1
    $student1->refresh();
    expect($student1->group_id)->toBe($group1->id);

    // No new group should be created
    expect(Group::where('club_id', $club->id)->where('category_id', $category->id)->count())->toBe(2);
});
