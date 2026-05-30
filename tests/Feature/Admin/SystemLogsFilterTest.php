<?php

use App\Models\Category;
use App\Models\Club;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Activitylog\Models\Activity;

uses(RefreshDatabase::class);

function adminUser(): User
{
    return User::factory()->create(['role' => 'admin']);
}

function makeStudent(): Student
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

it('blocks non-admin from viewing the logs page', function () {
    $user = User::factory()->create(['role' => 'teacher']);

    $this->actingAs($user)
        ->get(route('admin.logs.index'))
        ->assertForbidden();
});

it('renders the logs page for admin', function () {
    $admin = adminUser();

    $this->actingAs($admin)
        ->get(route('admin.logs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Dashboard/System/Logs/Index')
            ->has('filters')
            ->has('causerOptions')
        );
});

it('filters by causer_id', function () {
    $admin = adminUser();
    $other = User::factory()->create(['role' => 'teacher']);
    $student = makeStudent();

    activity('student')
        ->performedOn($student)
        ->causedBy($admin)
        ->event('updated')
        ->log('a');

    activity('student')
        ->performedOn($student)
        ->causedBy($other)
        ->event('updated')
        ->log('b');

    $this->actingAs($admin)
        ->get(route('admin.logs.index', ['causer_id' => $admin->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('logs.data', 1));
});

it('filters by event', function () {
    $admin = adminUser();
    $student = makeStudent();

    activity('student')
        ->performedOn($student)
        ->causedBy($admin)
        ->event('archived')
        ->log('arch');

    activity('student')
        ->performedOn($student)
        ->causedBy($admin)
        ->event('restored')
        ->log('rest');

    $this->actingAs($admin)
        ->get(route('admin.logs.index', ['event' => 'archived']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('logs.data', 1));
});

it('filters by free-text search on description', function () {
    $admin = adminUser();
    $student = makeStudent();

    activity('student')
        ->performedOn($student)
        ->causedBy($admin)
        ->event('updated')
        ->log('تم تحديث الاشتراك');

    activity('student')
        ->performedOn($student)
        ->causedBy($admin)
        ->event('updated')
        ->log('تم تحديث الفئة');

    $this->actingAs($admin)
        ->get(route('admin.logs.index', ['search' => 'الاشتراك']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('logs.data', 1));
});

it('filters by date preset last_7 and excludes older entries', function () {
    $admin = adminUser();
    $student = makeStudent();

    activity('student')
        ->performedOn($student)
        ->causedBy($admin)
        ->event('updated')
        ->log('recent');

    $old = activity('student')
        ->performedOn($student)
        ->causedBy($admin)
        ->event('updated')
        ->log('old');

    Activity::query()
        ->where('id', $old->id)
        ->update(['created_at' => now()->subDays(20)]);

    $this->actingAs($admin)
        ->get(route('admin.logs.index', ['date_preset' => 'last_7', 'type' => 'student']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('logs.data', 1));
});

it('returns only roles admin/moderator/staff/teacher in causerOptions', function () {
    $admin = adminUser();
    $student = makeStudent();

    activity('student')
        ->performedOn($student)
        ->causedBy($admin)
        ->event('updated')
        ->log('a');

    $this->actingAs($admin)
        ->get(route('admin.logs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('causerOptions', 1));
});
