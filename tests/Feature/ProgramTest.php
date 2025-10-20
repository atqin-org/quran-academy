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
}
