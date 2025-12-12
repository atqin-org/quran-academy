<?php

namespace Tests\Feature\Actions;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Program;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Club;
use App\Models\Category;
use App\Models\ProgramSession;

use App\Actions\Program\CreateProgramAction;
use App\Actions\Attendance\RecordAttendanceAction;
use App\Actions\Program\GenerateProgramSessionsAction;

class ProgramTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_create_a_program()
    {
        $subject = Subject::factory()->create();
        $club = Club::factory()->create();
        $category = Category::factory()->create();

        $program = (new CreateProgramAction())->execute([
            'subject_id' => $subject->id,
            'club_id' => $club->id,
            'category_id' => $category->id,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addWeek()->toDateString(),
            'days_of_week' => ['Mon','Wed','Fri'],
        ]);

        $this->assertDatabaseHas('programs', [
            'id' => $program->id,
            'subject_id' => $subject->id,
            'club_id' => $club->id,
            'category_id' => $category->id,
        ]);
    }

    /** @test */
    public function it_can_generate_program_sessions_for_each_day()
    {
        $program = Program::factory()->create([
            'days_of_week' => json_encode(['Mon','Wed','Fri']),
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(31)->toDateString(),
        ]);

        (new GenerateProgramSessionsAction())->execute($program);

        $sessions = ProgramSession::where('program_id', $program->id)->get();
        $this->assertCount(13, $sessions); // Mon, Wed, Fri
    }

    /** @test */
    public function it_can_record_attendance_for_a_student()
    {
        $student = Student::factory()->create();
        $program = Program::factory()->create([
            'days_of_week' => json_encode(['Mon']),
            'start_date' => now()->toDateString(),
            'end_date' => now()->toDateString(),
        ]);

        $session = ProgramSession::factory()->create([
            'program_id' => $program->id,
            'session_date' => now()->toDateString(),
        ]);

        $attendance = (new RecordAttendanceAction())->execute($session, $student, 'present');

        $this->assertDatabaseHas('attendances', [
            'id' => $attendance->id,
            'student_id' => $student->id,
            'status' => 'present',
        ]);
    }

    /** @test */
    public function it_prevents_duplicate_attendance_for_same_student_and_session()
    {
        $student = Student::factory()->create();
        $program = Program::factory()->create();
        $session = ProgramSession::factory()->create(['program_id' => $program->id]);

        (new RecordAttendanceAction())->execute($session, $student, 'present');

        // إعادة التسجيل يجب أن يحدث تحديث وليس إنشاء جديد
        $attendance = (new RecordAttendanceAction())->execute($session, $student, 'absent');

        $this->assertDatabaseHas('attendances', [
            'id' => $attendance->id,
            'student_id' => $student->id,
            'status' => 'absent',
        ]);

        $this->assertDatabaseCount('attendances', 1);
    }

    /** @test */
    public function it_deducts_credit_when_student_is_marked_present()
    {
        $club = Club::factory()->create();
        $category = Category::factory()->create();
        $student = Student::factory()->create([
            'club_id' => $club->id,
            'category_id' => $category->id,
            'subscription' => 100,
            'sessions_credit' => 10,
        ]);
        $program = Program::factory()->create();
        $session = ProgramSession::factory()->create([
            'program_id' => $program->id,
            'is_optional' => false,
        ]);

        (new RecordAttendanceAction())->execute($session, $student, 'present');

        $student->refresh();
        $this->assertEquals(9, $student->sessions_credit);
    }

    /** @test */
    public function it_refunds_credit_when_status_changes_from_present_to_excused()
    {
        $club = Club::factory()->create();
        $category = Category::factory()->create();
        $student = Student::factory()->create([
            'club_id' => $club->id,
            'category_id' => $category->id,
            'subscription' => 100,
            'sessions_credit' => 10,
        ]);
        $program = Program::factory()->create();
        $session = ProgramSession::factory()->create([
            'program_id' => $program->id,
            'is_optional' => false,
        ]);

        // Mark as present first (deducts 1 credit)
        (new RecordAttendanceAction())->execute($session, $student, 'present');
        $student->refresh();
        $this->assertEquals(9, $student->sessions_credit);

        // Change to excused (refunds 1 credit - excused is the only non-deducting status)
        (new RecordAttendanceAction())->execute($session, $student, 'excused');
        $student->refresh();
        $this->assertEquals(10, $student->sessions_credit);
    }

    /** @test */
    public function it_does_not_refund_when_status_changes_from_present_to_absent()
    {
        $club = Club::factory()->create();
        $category = Category::factory()->create();
        $student = Student::factory()->create([
            'club_id' => $club->id,
            'category_id' => $category->id,
            'subscription' => 100,
            'sessions_credit' => 10,
        ]);
        $program = Program::factory()->create();
        $session = ProgramSession::factory()->create([
            'program_id' => $program->id,
            'is_optional' => false,
        ]);

        // Mark as present first (deducts 1 credit)
        (new RecordAttendanceAction())->execute($session, $student, 'present');
        $student->refresh();
        $this->assertEquals(9, $student->sessions_credit);

        // Change to absent (no refund - absent also deducts credit)
        (new RecordAttendanceAction())->execute($session, $student, 'absent');
        $student->refresh();
        $this->assertEquals(9, $student->sessions_credit);
    }

    /** @test */
    public function it_does_not_deduct_credit_for_optional_sessions()
    {
        $club = Club::factory()->create();
        $category = Category::factory()->create();
        $student = Student::factory()->create([
            'club_id' => $club->id,
            'category_id' => $category->id,
            'subscription' => 100,
            'sessions_credit' => 10,
        ]);
        $program = Program::factory()->create();
        $session = ProgramSession::factory()->create([
            'program_id' => $program->id,
            'is_optional' => true,
        ]);

        (new RecordAttendanceAction())->execute($session, $student, 'present');

        $student->refresh();
        $this->assertEquals(10, $student->sessions_credit);
    }

    /** @test */
    public function it_does_not_deduct_credit_for_students_with_infinite_sessions()
    {
        $club = Club::factory()->create();
        $category = Category::factory()->create();
        $student = Student::factory()->create([
            'club_id' => $club->id,
            'category_id' => $category->id,
            'subscription' => 0, // Infinite sessions
            'sessions_credit' => 5,
        ]);
        $program = Program::factory()->create();
        $session = ProgramSession::factory()->create([
            'program_id' => $program->id,
            'is_optional' => false,
        ]);

        (new RecordAttendanceAction())->execute($session, $student, 'present');

        $student->refresh();
        $this->assertEquals(5, $student->sessions_credit);
    }

    /** @test */
    public function it_does_not_double_deduct_when_re_recording_present_status()
    {
        $club = Club::factory()->create();
        $category = Category::factory()->create();
        $student = Student::factory()->create([
            'club_id' => $club->id,
            'category_id' => $category->id,
            'subscription' => 100,
            'sessions_credit' => 10,
        ]);
        $program = Program::factory()->create();
        $session = ProgramSession::factory()->create([
            'program_id' => $program->id,
            'is_optional' => false,
        ]);

        // Mark as present twice
        (new RecordAttendanceAction())->execute($session, $student, 'present');
        (new RecordAttendanceAction())->execute($session, $student, 'present');

        $student->refresh();
        $this->assertEquals(9, $student->sessions_credit); // Only deducted once
    }

    /** @test */
    public function it_allows_credits_to_go_negative()
    {
        $club = Club::factory()->create();
        $category = Category::factory()->create();
        $student = Student::factory()->create([
            'club_id' => $club->id,
            'category_id' => $category->id,
            'subscription' => 100,
            'sessions_credit' => 0,
        ]);
        $program = Program::factory()->create();
        $session = ProgramSession::factory()->create([
            'program_id' => $program->id,
            'is_optional' => false,
        ]);

        (new RecordAttendanceAction())->execute($session, $student, 'present');

        $student->refresh();
        $this->assertEquals(-1, $student->sessions_credit);
    }

    /** @test */
    public function it_refunds_credits_when_session_changes_from_required_to_optional()
    {
        $club = Club::factory()->create();
        $category = Category::factory()->create();
        $student = Student::factory()->create([
            'club_id' => $club->id,
            'category_id' => $category->id,
            'subscription' => 100,
            'sessions_credit' => 10,
        ]);
        $program = Program::factory()->create();
        $session = ProgramSession::factory()->create([
            'program_id' => $program->id,
            'is_optional' => false,
        ]);

        // Record attendance as present (deducts 1 credit)
        (new RecordAttendanceAction())->execute($session, $student, 'present');
        $student->refresh();
        $this->assertEquals(9, $student->sessions_credit);

        // Change session to optional - should refund the credit
        $controller = new \App\Http\Controllers\ProgramSessionController();
        $reflection = new \ReflectionMethod($controller, 'adjustCreditsForOptionalChange');
        $reflection->setAccessible(true);
        $reflection->invoke($controller, $session, true);

        $student->refresh();
        $this->assertEquals(10, $student->sessions_credit);
    }

    /** @test */
    public function it_deducts_credits_when_session_changes_from_optional_to_required()
    {
        $club = Club::factory()->create();
        $category = Category::factory()->create();
        $student = Student::factory()->create([
            'club_id' => $club->id,
            'category_id' => $category->id,
            'subscription' => 100,
            'sessions_credit' => 10,
        ]);
        $program = Program::factory()->create();
        $session = ProgramSession::factory()->create([
            'program_id' => $program->id,
            'is_optional' => true,
        ]);

        // Record attendance as present (no credit deducted because optional)
        (new RecordAttendanceAction())->execute($session, $student, 'present');
        $student->refresh();
        $this->assertEquals(10, $student->sessions_credit);

        // Change session to required - should deduct the credit
        $controller = new \App\Http\Controllers\ProgramSessionController();
        $reflection = new \ReflectionMethod($controller, 'adjustCreditsForOptionalChange');
        $reflection->setAccessible(true);
        $reflection->invoke($controller, $session, false);

        $student->refresh();
        $this->assertEquals(9, $student->sessions_credit);
    }

    /** @test */
    public function it_deducts_credit_for_late_excused_status()
    {
        $club = Club::factory()->create();
        $category = Category::factory()->create();
        $student = Student::factory()->create([
            'club_id' => $club->id,
            'category_id' => $category->id,
            'subscription' => 100,
            'sessions_credit' => 10,
        ]);
        $program = Program::factory()->create();
        $session = ProgramSession::factory()->create([
            'program_id' => $program->id,
            'is_optional' => false,
        ]);

        (new RecordAttendanceAction())->execute($session, $student, 'late_excused');

        $student->refresh();
        $this->assertEquals(9, $student->sessions_credit);
    }

    /** @test */
    public function it_deducts_credit_for_kicked_status()
    {
        $club = Club::factory()->create();
        $category = Category::factory()->create();
        $student = Student::factory()->create([
            'club_id' => $club->id,
            'category_id' => $category->id,
            'subscription' => 100,
            'sessions_credit' => 10,
        ]);
        $program = Program::factory()->create();
        $session = ProgramSession::factory()->create([
            'program_id' => $program->id,
            'is_optional' => false,
        ]);

        (new RecordAttendanceAction())->execute($session, $student, 'kicked');

        $student->refresh();
        $this->assertEquals(9, $student->sessions_credit);
    }

    /** @test */
    public function it_deducts_credit_for_absent_status()
    {
        $club = Club::factory()->create();
        $category = Category::factory()->create();
        $student = Student::factory()->create([
            'club_id' => $club->id,
            'category_id' => $category->id,
            'subscription' => 100,
            'sessions_credit' => 10,
        ]);
        $program = Program::factory()->create();
        $session = ProgramSession::factory()->create([
            'program_id' => $program->id,
            'is_optional' => false,
        ]);

        (new RecordAttendanceAction())->execute($session, $student, 'absent');

        $student->refresh();
        $this->assertEquals(9, $student->sessions_credit);
    }

    /** @test */
    public function excused_is_the_only_status_that_does_not_deduct_credit()
    {
        $club = Club::factory()->create();
        $category = Category::factory()->create();
        $student = Student::factory()->create([
            'club_id' => $club->id,
            'category_id' => $category->id,
            'subscription' => 100,
            'sessions_credit' => 10,
        ]);
        $program = Program::factory()->create();
        $session = ProgramSession::factory()->create([
            'program_id' => $program->id,
            'is_optional' => false,
        ]);

        (new RecordAttendanceAction())->execute($session, $student, 'excused');

        $student->refresh();
        $this->assertEquals(10, $student->sessions_credit);
    }
}
