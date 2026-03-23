<?php

use App\Models\Attendance;
use App\Models\Category;
use App\Models\Club;
use App\Models\Program;
use App\Models\ProgramSession;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Helper to create an admin user attached to a club (for session access authorization).
 */
function createAdminWithClub(Club $club): User
{
    $user = User::factory()->create(['role' => 'admin']);

    return $user;
}

it('can view attendance page for a session', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $user = createAdminWithClub($club);

    $program = Program::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $session = ProgramSession::factory()->create([
        'program_id' => $program->id,
        'status' => 'scheduled',
    ]);

    Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)->get(route('sessions.attendance', $session));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Sessions/Attendance')
        ->has('session')
        ->has('program')
        ->has('students')
    );
});

it('can record single student attendance', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $user = createAdminWithClub($club);

    $program = Program::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $session = ProgramSession::factory()->create([
        'program_id' => $program->id,
        'is_optional' => false,
    ]);

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'subscription' => 100,
        'sessions_credit' => 10,
    ]);

    $response = $this->actingAs($user)->post(route('sessions.recordAttendance', $session), [
        'student_id' => $student->id,
        'status' => 'present',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('attendances', [
        'session_id' => $session->id,
        'student_id' => $student->id,
        'status' => 'present',
    ]);
});

it('can record bulk attendance', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $user = createAdminWithClub($club);

    $program = Program::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $session = ProgramSession::factory()->create([
        'program_id' => $program->id,
        'is_optional' => false,
    ]);

    $students = Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'subscription' => 100,
        'sessions_credit' => 10,
    ]);

    $attendanceData = $students->map(fn ($student) => [
        'student_id' => $student->id,
        'status' => 'present',
        'hizb_id' => null,
        'thoman_id' => 1,
        'reason' => null,
    ])->toArray();

    $response = $this->actingAs($user)->post(route('sessions.recordAttendanceBulk', $session), [
        'attendance' => $attendanceData,
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    foreach ($students as $student) {
        $this->assertDatabaseHas('attendances', [
            'session_id' => $session->id,
            'student_id' => $student->id,
            'status' => 'present',
        ]);
    }
});

it('recording attendance validates status values', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $user = createAdminWithClub($club);

    $program = Program::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $session = ProgramSession::factory()->create([
        'program_id' => $program->id,
    ]);

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $response = $this->actingAs($user)->post(route('sessions.recordAttendance', $session), [
        'student_id' => $student->id,
        'status' => 'invalid_status',
    ]);

    // Should redirect with error (validation failure caught by try/catch)
    $response->assertRedirect();

    // No attendance should be recorded
    $this->assertDatabaseMissing('attendances', [
        'session_id' => $session->id,
        'student_id' => $student->id,
    ]);
});

it('can create a manual session for a program', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $user = createAdminWithClub($club);

    $program = Program::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $sessionDate = now()->addDay()->toDateString();

    $response = $this->actingAs($user)->post(route('programs.sessions.store', $program), [
        'session_date' => $sessionDate,
        'start_time' => '09:00',
        'end_time' => '11:00',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('program_sessions', [
        'program_id' => $program->id,
        'session_date' => $sessionDate,
        'status' => 'scheduled',
    ]);
});

it('can update session date and time', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $user = createAdminWithClub($club);

    $program = Program::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $session = ProgramSession::factory()->create([
        'program_id' => $program->id,
    ]);

    $newDate = now()->addDays(5)->toDateString();

    $response = $this->actingAs($user)->post(route('sessions.update', $session), [
        'session_date' => $newDate,
        'start_time' => '14:00',
        'end_time' => '16:00',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $session->refresh();
    expect($session->session_date->toDateString())->toBe($newDate);
});

it('can cancel a session', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $user = createAdminWithClub($club);

    $program = Program::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $session = ProgramSession::factory()->create([
        'program_id' => $program->id,
        'status' => 'scheduled',
    ]);

    $response = $this->actingAs($user)->post(route('sessions.cancel', $session));

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $session->refresh();
    expect($session->status)->toBe('cancelled');
});

it('can toggle session optional status', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $user = createAdminWithClub($club);

    $program = Program::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $session = ProgramSession::factory()->create([
        'program_id' => $program->id,
        'is_optional' => false,
    ]);

    $response = $this->actingAs($user)->put(route('sessions.toggleOptional', $session), [
        'is_optional' => true,
    ]);

    $response->assertRedirect();

    $session->refresh();
    expect($session->is_optional)->toBeTrue();
});

it('toggling optional adjusts credits for present students', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $user = createAdminWithClub($club);

    $program = Program::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    $session = ProgramSession::factory()->create([
        'program_id' => $program->id,
        'is_optional' => false,
    ]);

    $student = Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'subscription' => 100,
        'sessions_credit' => 8,
    ]);

    // Record attendance as present (this will deduct a credit)
    Attendance::create([
        'session_id' => $session->id,
        'student_id' => $student->id,
        'status' => 'present',
    ]);

    // Toggle to optional - should refund the credit
    $this->actingAs($user)->put(route('sessions.toggleOptional', $session), [
        'is_optional' => true,
    ]);

    $student->refresh();
    expect($student->sessions_credit)->toBe(9);

    $session->refresh();
    expect($session->is_optional)->toBeTrue();
});
