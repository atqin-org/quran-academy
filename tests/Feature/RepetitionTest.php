<?php

use App\Models\Category;
use App\Models\Club;
use App\Models\Hizb;
use App\Models\Program;
use App\Models\ProgramSession;
use App\Models\Repetition;
use App\Models\RepetitionThumn;
use App\Models\Student;
use App\Models\Thoman;
use App\Models\User;
use Database\Seeders\AhzabAthmanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(AhzabAthmanSeeder::class);
});

/**
 * Build a session + club + program + tested student with memorized envelope.
 *
 * @return array{user:User, session:ProgramSession, student:Student, club:Club}
 */
function repetitionsScenario(int $lastAscending = 5, int $lastDescending = 56): array
{
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $user = User::factory()->create(['role' => 'admin']);

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
        'last_hizb_ascending' => $lastAscending,
        'last_hizb_descending' => $lastDescending,
        'memorization_direction' => 'descending',
        'subscription' => 100,
        'sessions_credit' => 8,
    ]);

    return ['user' => $user, 'session' => $session, 'student' => $student, 'club' => $club];
}

it('records a single section with thumns including a bad-result mistake count', function () {
    ['user' => $user, 'session' => $session, 'student' => $student] = repetitionsScenario();

    $hizb = Hizb::where('number', 3)->first(); // inside ascending envelope (5)
    $thumns = Thoman::where('hizb_id', $hizb->id)->orderBy('number')->get();

    $response = $this->actingAs($user)->post(route('sessions.recordRepetitionsBulk', $session), [
        'student_id' => $student->id,
        'sections' => [[
            'hizb_id' => $hizb->id,
            'tester_user_id' => $user->id,
            'tester_student_id' => null,
            'overall_rating' => 'good',
            'remark' => 'تسميع ممتاز',
            'thumns' => [
                ['thoman_id' => $thumns[0]->id, 'result' => 'good', 'mistakes_count' => null, 'note' => null],
                ['thoman_id' => $thumns[1]->id, 'result' => 'bad', 'mistakes_count' => 3, 'note' => 'تكرار خطأ'],
            ],
        ]],
    ]);

    $response->assertRedirect();
    expect(Repetition::count())->toBe(1);
    expect(RepetitionThumn::count())->toBe(2);

    $bad = RepetitionThumn::where('result', 'bad')->first();
    expect($bad->mistakes_count)->toBe(3)
        ->and($bad->note)->toBe('تكرار خطأ');
});

it('allows multiple sections in the same session for the same hizb', function () {
    ['user' => $user, 'session' => $session, 'student' => $student] = repetitionsScenario();
    $hizb = Hizb::where('number', 58)->first(); // inside descending envelope (>=56)

    $this->actingAs($user)->post(route('sessions.recordRepetitionsBulk', $session), [
        'student_id' => $student->id,
        'sections' => [
            ['hizb_id' => $hizb->id, 'tester_user_id' => $user->id, 'overall_rating' => 'mid', 'thumns' => []],
            ['hizb_id' => $hizb->id, 'tester_user_id' => $user->id, 'overall_rating' => 'good', 'thumns' => []],
        ],
    ])->assertRedirect();

    expect(Repetition::where('hizb_id', $hizb->id)->count())->toBe(2);
});

it('rejects a tester_student equal to the tested student', function () {
    ['user' => $user, 'session' => $session, 'student' => $student] = repetitionsScenario();
    $hizb = Hizb::where('number', 3)->first();

    $this->actingAs($user)
        ->from(route('sessions.attendance', $session))
        ->post(route('sessions.recordRepetitionsBulk', $session), [
            'student_id' => $student->id,
            'sections' => [[
                'hizb_id' => $hizb->id,
                'tester_user_id' => null,
                'tester_student_id' => $student->id,
                'overall_rating' => 'good',
                'thumns' => [],
            ]],
        ])
        ->assertSessionHasErrors('sections.0.tester_student_id');

    expect(Repetition::count())->toBe(0);
});

it('rejects a hizb outside the student memorization envelope', function () {
    ['user' => $user, 'session' => $session, 'student' => $student] = repetitionsScenario(lastAscending: 3, lastDescending: 58);
    $hizb = Hizb::where('number', 20)->first(); // 3 < 20 < 58 — outside envelope

    $this->actingAs($user)
        ->from(route('sessions.attendance', $session))
        ->post(route('sessions.recordRepetitionsBulk', $session), [
            'student_id' => $student->id,
            'sections' => [[
                'hizb_id' => $hizb->id,
                'tester_user_id' => $user->id,
                'overall_rating' => 'good',
                'thumns' => [],
            ]],
        ])
        ->assertSessionHasErrors('sections.0.hizb_id');

    expect(Repetition::count())->toBe(0);
});

it('replaces previous repetitions on retry instead of duplicating', function () {
    ['user' => $user, 'session' => $session, 'student' => $student] = repetitionsScenario();
    $hizb = Hizb::where('number', 4)->first();

    $payload = [
        'student_id' => $student->id,
        'sections' => [[
            'hizb_id' => $hizb->id,
            'tester_user_id' => $user->id,
            'overall_rating' => 'good',
            'thumns' => [],
        ]],
    ];

    $this->actingAs($user)->post(route('sessions.recordRepetitionsBulk', $session), $payload)->assertRedirect();
    $this->actingAs($user)->post(route('sessions.recordRepetitionsBulk', $session), $payload)->assertRedirect();

    expect(Repetition::count())->toBe(1);
});

it('does not deduct session credit when recording repetitions', function () {
    ['user' => $user, 'session' => $session, 'student' => $student] = repetitionsScenario();
    $hizb = Hizb::where('number', 4)->first();
    $creditBefore = $student->sessions_credit;

    $this->actingAs($user)->post(route('sessions.recordRepetitionsBulk', $session), [
        'student_id' => $student->id,
        'sections' => [[
            'hizb_id' => $hizb->id,
            'tester_user_id' => $user->id,
            'overall_rating' => 'good',
            'thumns' => [],
        ]],
    ])->assertRedirect();

    expect($student->fresh()->sessions_credit)->toBe($creditBefore);
});

it('exposes tested_thumns and attendees in the attendance page props', function () {
    ['user' => $user, 'session' => $session, 'student' => $student, 'club' => $club] = repetitionsScenario();
    Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $session->program->category_id,
    ]);
    $hizb = Hizb::where('number', 3)->first();
    $thumn = Thoman::where('hizb_id', $hizb->id)->first();

    $repetition = Repetition::create([
        'session_id' => $session->id,
        'student_id' => $student->id,
        'hizb_id' => $hizb->id,
        'tester_user_id' => $user->id,
        'overall_rating' => 'good',
    ]);

    RepetitionThumn::create([
        'repetition_id' => $repetition->id,
        'thoman_id' => $thumn->id,
        'result' => 'good',
    ]);

    $response = $this->actingAs($user)->get(route('sessions.attendance', $session));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('attendees')
        ->has('students.0.tested_thumns')
        ->has('students.0.repetitions')
    );
});

it('accepts the new overall_rating values on a repetition section', function (string $rating) {
    ['user' => $user, 'session' => $session, 'student' => $student] = repetitionsScenario();
    $hizb = Hizb::where('number', 3)->first();

    $this->actingAs($user)->post(route('sessions.recordRepetitionsBulk', $session), [
        'student_id' => $student->id,
        'sections' => [[
            'hizb_id' => $hizb->id,
            'tester_user_id' => $user->id,
            'overall_rating' => $rating,
            'thumns' => [],
        ]],
    ])->assertRedirect();

    expect(Repetition::first()->overall_rating)->toBe($rating);
})->with(['great', 'not_memorized']);

it('rejects an invalid overall_rating value', function () {
    ['user' => $user, 'session' => $session, 'student' => $student] = repetitionsScenario();
    $hizb = Hizb::where('number', 3)->first();

    $this->actingAs($user)
        ->from(route('sessions.attendance', $session))
        ->post(route('sessions.recordRepetitionsBulk', $session), [
            'student_id' => $student->id,
            'sections' => [[
                'hizb_id' => $hizb->id,
                'tester_user_id' => $user->id,
                'overall_rating' => 'excellent',
                'thumns' => [],
            ]],
        ])
        ->assertSessionHasErrors('sections.0.overall_rating');

    expect(Repetition::count())->toBe(0);
});

it('accepts the new memorization_rating values on attendance bulk', function (string $rating) {
    ['user' => $user, 'session' => $session, 'student' => $student] = repetitionsScenario();
    $hizb = Hizb::where('number', 5)->first();

    $this->actingAs($user)->post(route('sessions.recordAttendanceBulk', $session), [
        'attendance' => [[
            'student_id' => $student->id,
            'status' => 'present',
            'hizb_id' => $hizb->id,
            'memorization_rating' => $rating,
        ]],
    ])->assertRedirect();

    expect($session->attendances()->where('student_id', $student->id)->first()->memorization_rating)->toBe($rating);
})->with(['great', 'not_memorized']);

it('extends attendance bulk to accept memorization_rating and memorization_remark', function () {
    ['user' => $user, 'session' => $session, 'student' => $student] = repetitionsScenario();
    $hizb = Hizb::where('number', 5)->first();
    $thumn = Thoman::where('hizb_id', $hizb->id)->first();

    $this->actingAs($user)->post(route('sessions.recordAttendanceBulk', $session), [
        'attendance' => [[
            'student_id' => $student->id,
            'status' => 'present',
            'hizb_id' => $hizb->id,
            'thoman_id' => $thumn->id,
            'memorization_rating' => 'mid',
            'memorization_remark' => 'ملاحظات الحفظ',
        ]],
    ])->assertRedirect();

    $attendance = $session->attendances()->where('student_id', $student->id)->first();
    expect($attendance->memorization_rating)->toBe('mid')
        ->and($attendance->memorization_remark)->toBe('ملاحظات الحفظ');
});
