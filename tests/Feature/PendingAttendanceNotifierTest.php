<?php

use App\Models\Attendance;
use App\Models\Category;
use App\Models\Club;
use App\Models\NotificationPreference;
use App\Models\Program;
use App\Models\ProgramSession;
use App\Models\Student;
use App\Models\User;
use App\Notifications\Registry;
use App\Notifications\Sessions\SessionAttendancePending;
use App\Services\Notifications\PendingAttendanceNotifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

function makeAttendanceTarget(string $status = 'scheduled'): ProgramSession
{
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $program = Program::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);

    return ProgramSession::factory()->create([
        'program_id' => $program->id,
        'session_date' => now()->subDays(2)->toDateString(),
        'status' => $status,
    ]);
}

it('fires when a session is 24h+ old, status not completed, no attendance', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    makeAttendanceTarget('scheduled');

    Notification::fake();
    $result = app(PendingAttendanceNotifier::class)->sync();

    expect($result['sent'])->toBe(1);
    Notification::assertSentTo($admin, SessionAttendancePending::class);
});

it('skips when session status is completed', function () {
    User::factory()->create(['role' => 'admin']);
    makeAttendanceTarget('completed');

    $result = app(PendingAttendanceNotifier::class)->sync();

    expect($result['sent'])->toBe(0);
});

it('skips when an attendance row already exists', function () {
    User::factory()->create(['role' => 'admin']);
    $session = makeAttendanceTarget('scheduled');
    Attendance::create([
        'session_id' => $session->id,
        'student_id' => Student::factory()->create(['club_id' => $session->program->club_id])->id,
        'group_id' => null,
        'status' => 'present',
    ]);

    $result = app(PendingAttendanceNotifier::class)->sync();

    expect($result['sent'])->toBe(0);
});

it('skips sessions less than a day old', function () {
    User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $program = Program::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);
    ProgramSession::factory()->create([
        'program_id' => $program->id,
        'session_date' => now()->toDateString(),
        'status' => 'scheduled',
    ]);

    $result = app(PendingAttendanceNotifier::class)->sync();

    expect($result['sent'])->toBe(0);
});

it('auto-resolves when an attendance row is added', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $session = makeAttendanceTarget('scheduled');

    app(PendingAttendanceNotifier::class)->sync();
    expect($admin->fresh()->unreadNotifications()->count())->toBe(1);

    Attendance::create([
        'session_id' => $session->id,
        'student_id' => Student::factory()->create(['club_id' => $session->program->club_id])->id,
        'group_id' => null,
        'status' => 'present',
    ]);
    $result = app(PendingAttendanceNotifier::class)->sync();

    expect($result['resolved'])->toBe(1)
        ->and($admin->fresh()->unreadNotifications()->count())->toBe(0);
});

it('respects in_app preference: master off creates no DB row', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    NotificationPreference::create([
        'user_id' => $admin->id,
        'type' => Registry::SESSION_ATTENDANCE_PENDING,
        'in_app' => false,
        'email' => false,
        'push' => false,
    ]);
    makeAttendanceTarget('scheduled');

    app(PendingAttendanceNotifier::class)->sync();

    expect($admin->fresh()->notifications()->count())->toBe(0);
});

it('does not notify personnel with no club attachments', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);
    makeAttendanceTarget('scheduled');

    app(PendingAttendanceNotifier::class)->sync();

    expect($teacher->fresh()->notifications()->count())->toBe(0);
});

it('notifies personnel attached to the program club, not personnel of other clubs', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $teacherSame = User::factory()->create(['role' => 'teacher']);
    $teacherOther = User::factory()->create(['role' => 'teacher']);
    $otherClub = Club::factory()->create();
    $teacherOther->clubs()->attach([$otherClub->id]);

    $session = makeAttendanceTarget('scheduled');
    $teacherSame->clubs()->attach([$session->program->club_id]);

    app(PendingAttendanceNotifier::class)->sync();

    expect($admin->fresh()->unreadNotifications()->count())->toBe(1)
        ->and($teacherSame->fresh()->unreadNotifications()->count())->toBe(1)
        ->and($teacherOther->fresh()->unreadNotifications()->count())->toBe(0);
});

it('auto-resolves both admin and teacher when one of them records attendance', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $teacher = User::factory()->create(['role' => 'teacher']);

    $session = makeAttendanceTarget('scheduled');
    $teacher->clubs()->attach([$session->program->club_id]);

    app(PendingAttendanceNotifier::class)->sync();
    expect($admin->fresh()->unreadNotifications()->count())->toBe(1)
        ->and($teacher->fresh()->unreadNotifications()->count())->toBe(1);

    Attendance::create([
        'session_id' => $session->id,
        'student_id' => Student::factory()->create(['club_id' => $session->program->club_id])->id,
        'group_id' => null,
        'status' => 'present',
    ]);
    app(PendingAttendanceNotifier::class)->sync();

    expect($admin->fresh()->unreadNotifications()->count())->toBe(0)
        ->and($teacher->fresh()->unreadNotifications()->count())->toBe(0);
});
