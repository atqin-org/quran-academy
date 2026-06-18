<?php

use App\Models\Attendance;
use App\Models\Category;
use App\Models\Club;
use App\Models\Program;
use App\Models\ProgramSession;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Build a program with one session that already has an attendance record.
 *
 * @return array{user:User, program:Program, session:ProgramSession, attendance:Attendance}
 */
function programWithAttendance(): array
{
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $program = Program::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'start_date' => now()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'days_of_week' => ['Mon', 'Wed'],
    ]);

    $session = ProgramSession::factory()->create([
        'program_id' => $program->id,
        'session_date' => '2026-06-15',
        'start_time' => '14:00',
        'end_time' => '15:00',
        'status' => 'scheduled',
    ]);

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $attendance = Attendance::create([
        'session_id' => $session->id,
        'student_id' => $student->id,
        'status' => 'present',
    ]);

    return ['user' => $user, 'program' => $program, 'session' => $session, 'attendance' => $attendance];
}

it('can view programs index', function () {
    $user = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($user)->get(route('programs.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Program/Index')
        ->has('programs')
    );
});

it('can view program create form', function () {
    $user = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($user)->get(route('programs.create'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Program/Create')
        ->has('subjects')
        ->has('clubs')
        ->has('categories')
        ->has('days')
    );
});

it('can create a program and sessions are generated', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $subject = Subject::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $startDate = now()->toDateString();
    $endDate = now()->addDays(14)->toDateString();

    $response = $this->actingAs($user)->post(route('programs.store'), [
        'name' => 'Test Program',
        'subject_id' => $subject->id,
        'club_id' => $club->id,
        'category_id' => $category->id,
        'start_date' => $startDate,
        'end_date' => $endDate,
        'days_of_week' => [
            ['value' => 'Mon', 'label' => 'Monday'],
            ['value' => 'Wed', 'label' => 'Wednesday'],
        ],
    ]);

    $response->assertRedirect(route('programs.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('programs', [
        'subject_id' => $subject->id,
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $program = Program::where('club_id', $club->id)->first();
    expect($program)->not->toBeNull();
    expect($program->sessions()->count())->toBeGreaterThan(0);
});

it('can view program show page', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $subject = Subject::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $program = Program::factory()->create([
        'subject_id' => $subject->id,
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)->get(route('programs.show', $program));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Program/Show')
        ->has('program')
    );
});

it('can view program edit form', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $subject = Subject::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $program = Program::factory()->create([
        'subject_id' => $subject->id,
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)->get(route('programs.edit', $program));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Program/Edit')
        ->has('program')
        ->has('subjects')
        ->has('clubs')
        ->has('categories')
    );
});

it('can update a program', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $subject = Subject::factory()->create();
    $newSubject = Subject::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $program = Program::factory()->create([
        'name' => 'Original Name',
        'subject_id' => $subject->id,
        'club_id' => $club->id,
        'category_id' => $category->id,
        'start_date' => now()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'days_of_week' => ['Mon', 'Wed'],
    ]);

    $response = $this->actingAs($user)->post(route('programs.update', $program), [
        'name' => 'Updated Name',
        'subject_id' => $newSubject->id,
        'club_id' => $club->id,
        'category_id' => $category->id,
        'start_date' => now()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'days_of_week' => [
            ['value' => 'Tue', 'label' => 'Tuesday'],
            ['value' => 'Thu', 'label' => 'Thursday'],
        ],
    ]);

    $response->assertRedirect(route('programs.index'));
    $response->assertSessionHas('success');

    $program->refresh();
    expect($program->name)->toBe('Updated Name');
    expect($program->subject_id)->toBe($newSubject->id);
});

it('preserves attendance for an attended session when the day is removed on update', function () {
    ['user' => $user, 'program' => $program, 'session' => $session, 'attendance' => $attendance] = programWithAttendance();

    $this->actingAs($user)->post(route('programs.update', $program), [
        'name' => $program->name,
        'club_id' => $program->club_id,
        'category_id' => $program->category_id,
        'start_date' => now()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'days_of_week' => [
            ['value' => 'Tue', 'label' => 'Tuesday'],
        ],
        // New sessions list does NOT include the attended date.
        'sessions' => [
            ['date' => '2026-06-16', 'start_time' => '16:00', 'end_time' => '17:00'],
        ],
    ])->assertRedirect(route('programs.index'));

    $this->assertDatabaseHas('program_sessions', ['id' => $session->id]);
    $this->assertDatabaseHas('attendances', ['id' => $attendance->id]);
});

it('updates session times in place without duplicating or losing attendance', function () {
    ['user' => $user, 'program' => $program, 'session' => $session, 'attendance' => $attendance] = programWithAttendance();

    $this->actingAs($user)->post(route('programs.update', $program), [
        'name' => $program->name,
        'club_id' => $program->club_id,
        'category_id' => $program->category_id,
        'start_date' => now()->toDateString(),
        'end_date' => now()->addMonth()->toDateString(),
        'days_of_week' => [
            ['value' => 'Mon', 'label' => 'Monday'],
        ],
        // Same date as the attended session, new times.
        'sessions' => [
            ['date' => '2026-06-15', 'start_time' => '18:00', 'end_time' => '19:00'],
        ],
    ])->assertRedirect(route('programs.index'));

    expect($program->sessions()->count())->toBe(1);
    $this->assertDatabaseHas('attendances', ['id' => $attendance->id]);

    $fresh = $session->fresh();
    expect($fresh)->not->toBeNull()
        ->and($fresh->start_time->format('H:i'))->toBe('18:00');
});

it('can delete a program', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $subject = Subject::factory()->create();
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    $program = Program::factory()->create([
        'subject_id' => $subject->id,
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $programId = $program->id;

    $response = $this->actingAs($user)->delete(route('programs.destroy', $program));

    $response->assertRedirect(route('programs.index'));
    $response->assertSessionHas('success');

    $this->assertDatabaseMissing('programs', ['id' => $programId]);
});
