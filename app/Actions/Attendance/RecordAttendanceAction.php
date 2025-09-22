<?php

namespace App\Actions\Attendance;

use App\Models\ProgramSession;
use App\Models\Student;

class RecordAttendanceAction
{
    public function execute(ProgramSession $session, Student $student, string $status)
    {
        return $session->attendances()->updateOrCreate(
            ['student_id' => $student->id],
            ['status' => $status]
        );
    }
}
