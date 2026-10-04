<?php

use App\Models\Category;
use App\Models\Club;
use App\Models\Group;
use App\Models\Program;
use App\Models\ProgramSession;
use App\Models\Student;
use App\Models\User;
use App\Services\Notifications\PendingAttendanceNotifier;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->clubA = Club::factory()->create();
    $this->clubB = Club::factory()->create();
    $this->clubC = Club::factory()->create();
    $this->allowedCategory = Category::factory()->create();
    $this->blockedCategory = Category::factory()->create();

    // Staff: clubA restricted to one category, clubB unrestricted, clubC not attached.
    $this->staff = User::factory()->create(['role' => 'staff']);
    $this->staff->clubs()->attach([$this->clubA->id, $this->clubB->id]);
    $this->staff->categoryRestrictions()->attach($this->allowedCategory, ['club_id' => $this->clubA->id]);
});

it('only lists students of allowed club + category pairs', function () {
    Student::factory()->count(2)->create(['club_id' => $this->clubA->id, 'category_id' => $this->allowedCategory->id]);
    Student::factory()->count(3)->create(['club_id' => $this->clubA->id, 'category_id' => $this->blockedCategory->id]);
    Student::factory()->create(['club_id' => $this->clubB->id, 'category_id' => $this->blockedCategory->id]);
    Student::factory()->count(4)->create(['club_id' => $this->clubC->id, 'category_id' => $this->allowedCategory->id]);

    $this->actingAs($this->staff)->get(route('students.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('students.data', 3));
});

it('lets an admin see every student', function () {
    Student::factory()->count(2)->create(['club_id' => $this->clubA->id, 'category_id' => $this->blockedCategory->id]);
    Student::factory()->count(3)->create(['club_id' => $this->clubC->id, 'category_id' => $this->allowedCategory->id]);
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->get(route('students.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('students.data', 5));
});

it('forbids opening a student of a blocked category', function (string $routeName) {
    $student = Student::factory()->create(['club_id' => $this->clubA->id, 'category_id' => $this->blockedCategory->id]);

    $this->actingAs($this->staff)->get(route($routeName, $student))->assertForbidden();
})->with(['students.show', 'students.edit', 'students.payment.show']);

it('forbids archiving a student of a blocked category', function () {
    $student = Student::factory()->create(['club_id' => $this->clubA->id, 'category_id' => $this->blockedCategory->id]);

    $this->actingAs($this->staff)->delete(route('students.destroy', $student))->assertForbidden();

    expect($student->fresh()->trashed())->toBeFalse();
});

it('allows editing a student of an allowed category', function () {
    $student = Student::factory()->create(['club_id' => $this->clubA->id, 'category_id' => $this->allowedCategory->id]);

    $this->actingAs($this->staff)->get(route('students.edit', $student))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('accessMap.'.$this->clubA->id, [$this->allowedCategory->id])
            ->where('accessMap.'.$this->clubB->id, null)
        );
});

it('rejects creating a student in a blocked category', function () {
    $this->actingAs($this->staff)->post(route('students.store'), [
        'firstName' => 'محمد',
        'lastName' => 'أمين',
        'gender' => 'male',
        'birthdate' => now()->subYears(10)->toDateString(),
        'socialStatus' => 'good',
        'hasCronicDisease' => 'no',
        'father' => ['phone' => '0555555555'],
        'subscription' => 0,
        'club' => $this->clubA->id,
        'category' => $this->blockedCategory->id,
    ])->assertSessionHasErrors('category');

    expect(Student::count())->toBe(0);
});

it('scopes programs and forbids sessions of a blocked category', function () {
    $allowedProgram = Program::factory()->create(['club_id' => $this->clubA->id, 'category_id' => $this->allowedCategory->id]);
    $blockedProgram = Program::factory()->create(['club_id' => $this->clubA->id, 'category_id' => $this->blockedCategory->id]);
    $blockedSession = ProgramSession::factory()->create(['program_id' => $blockedProgram->id]);

    $this->actingAs($this->staff)->get(route('programs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('programs.data', 1)
            ->where('programs.data.0.id', $allowedProgram->id)
        );

    $this->actingAs($this->staff)->get(route('programs.show', $blockedProgram))->assertForbidden();
    $this->actingAs($this->staff)->get(route('sessions.attendance', $blockedSession))->assertForbidden();
});

it('forbids managing groups of a blocked category and hides it from the club page', function () {
    Student::factory()->create(['club_id' => $this->clubA->id, 'category_id' => $this->allowedCategory->id]);
    Student::factory()->create(['club_id' => $this->clubA->id, 'category_id' => $this->blockedCategory->id]);
    $blockedGroup = Group::factory()->create(['club_id' => $this->clubA->id, 'category_id' => $this->blockedCategory->id]);

    $this->actingAs($this->staff)
        ->get(route('groups.manage', ['club' => $this->clubA->id, 'category' => $this->blockedCategory->id]))
        ->assertForbidden();

    $this->actingAs($this->staff)
        ->get(route('groups.clubGroups', ['club' => $this->clubA->id, 'category' => $this->blockedCategory->id]))
        ->assertForbidden();

    $this->actingAs($this->staff)
        ->delete(route('groups.destroy', $blockedGroup))
        ->assertForbidden();

    $this->actingAs($this->staff)
        ->get(route('groups.clubGroups', ['club' => $this->clubA->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('categories', 1)
            ->where('categories.0.id', $this->allowedCategory->id)
        );
});

it('only notifies restricted staff about sessions of their categories', function () {
    $blockedProgram = Program::factory()->create(['club_id' => $this->clubA->id, 'category_id' => $this->blockedCategory->id]);
    ProgramSession::factory()->create([
        'program_id' => $blockedProgram->id,
        'session_date' => now()->subDays(2)->toDateString(),
        'status' => 'scheduled',
    ]);

    app(PendingAttendanceNotifier::class)->sync();
    expect($this->staff->fresh()->notifications()->count())->toBe(0);

    $allowedProgram = Program::factory()->create(['club_id' => $this->clubA->id, 'category_id' => $this->allowedCategory->id]);
    ProgramSession::factory()->create([
        'program_id' => $allowedProgram->id,
        'session_date' => now()->subDays(2)->toDateString(),
        'status' => 'scheduled',
    ]);

    app(PendingAttendanceNotifier::class)->sync();
    expect($this->staff->fresh()->notifications()->count())->toBe(1);
});
