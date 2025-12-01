<?php

namespace App\Actions\Attendance;

use App\Models\Hizb;
use App\Models\ProgramSession;
use App\Models\Student;
use Illuminate\Support\Facades\Log;

class RecordAttendanceAction
{
    public function execute(
        ProgramSession $session,
        Student $student,
        string $status,
        $hizb_id = null,
        $thoman_id = null,
        $excusedReason = null
    ) {
        try {
            $attendance = $session->attendances()->updateOrCreate(
                ['student_id' => $student->id],
                [
                    'status'    => $status,
                    'hizb_id'   => $hizb_id,
                    'thoman_id' => $thoman_id,
                    'excusedReason'    => $excusedReason,
                ]
            );

            // Update student's last hizb for current direction if present and hizb is recorded
            if ($status === 'present' && $hizb_id) {
                $hizb = Hizb::find($hizb_id);
                if ($hizb) {
                    $student->updateLastHizbForCurrentDirection($hizb->number);
                }
            }

            Log::info('Attendance saved/updated', [
                'id' => $attendance->id,
                'student_id' => $student->id,
                'status' => $attendance->status,
                'hizb_id' => $attendance->hizb_id,
                'thoman_id' => $attendance->thoman_id,
                'excusedReason' => $attendance->excusedReason,
            ]);

            return $attendance;
        } catch (\Throwable $e) {
            // تسجيل الخطأ في ملف اللوج
            Log::error('Failed to record attendance', [
                'session_id' => $session->id,
                'student_id' => $student->id,
                'error' => $e->getMessage(),
            ]);

            // يمكنك إما إرجاع null أو إعادة رمي الاستثناء
            throw $e;
        }
    }
}
