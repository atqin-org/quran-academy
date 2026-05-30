<?php

use App\Models\Category;
use App\Models\Club;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeStudentForLog(): Student
{
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    // Clear factory-create auto-log so each test starts from a clean slate.
    $student->activities()->delete();

    return $student;
}

it('blocks non-admin from the student activity log endpoint', function () {
    $user = User::factory()->create(['role' => 'teacher']);
    $student = makeStudentForLog();

    $this->actingAs($user)
        ->getJson(route('students.activityLog', $student))
        ->assertForbidden();
});

it('returns activity log JSON for admin', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $student = makeStudentForLog();

    activity('student')
        ->performedOn($student)
        ->causedBy($admin)
        ->event('updated')
        ->withProperties(['old' => ['ahzab' => 1], 'new' => ['ahzab' => 2]])
        ->log('تم تحديث الطالب');

    $this->actingAs($admin)
        ->getJson(route('students.activityLog', $student))
        ->assertOk()
        ->assertJsonStructure([
            'logs' => [
                '*' => [
                    'id',
                    'event',
                    'subject_id',
                    'subject_type',
                    'description',
                    'causer',
                    'properties',
                    'created_at',
                ],
            ],
        ])
        ->assertJsonPath('logs.0.event', 'updated')
        ->assertJsonPath('logs.0.subject_id', $student->id);
});

it('works for soft-deleted students', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $student = makeStudentForLog();

    activity('student')
        ->performedOn($student)
        ->causedBy($admin)
        ->event('archived')
        ->log('تم أرشفة الطالب');

    $student->delete();

    // After delete: manual `archived` + auto `deleted` from LogsActivity trait = 2.
    $this->actingAs($admin)
        ->getJson(route('students.activityLog', $student->id))
        ->assertOk()
        ->assertJsonCount(2, 'logs');
});

it('returns empty array for student with no activity', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $student = makeStudentForLog();

    // Auto-created activity from factory creation is possible; clear it
    $student->activities()->delete();

    $this->actingAs($admin)
        ->getJson(route('students.activityLog', $student))
        ->assertOk()
        ->assertJsonPath('logs', []);
});
