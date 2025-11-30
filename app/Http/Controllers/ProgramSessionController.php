<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Models\ProgramSession;
use App\Models\Student;
use App\Actions\Attendance\RecordAttendanceAction;

class ProgramSessionController extends Controller
{
    /**
     * صفحة تسجيل الحضور لحصة معينة
     */
    public function attendance(ProgramSession $session)

    {
        $session->update(['status' => 'completed']);
        // should get only student who have same club as program and category
        $students = Student::with([
            'category',
            'club',
            'attendances' => function ($q) use ($session) {
                $q->where('session_id', $session->id);
            },
            'lastHizbAttendance',
            'lastThomanAttendance',
        ])
            ->where('club_id', $session->program->club_id)
            ->where('category_id', $session->program->category_id)
            ->orderBy('first_name')
            ->get();



        return Inertia::render('Dashboard/Sessions/Attendance', [
            'session' => $session,
            'students' => $students->map(fn($s) => [
                'id' => $s->id,
                'first_name' => $s->first_name,
                'last_name' => $s->last_name,
                'attendance_status' => optional($s->attendances->first())->status,
                'excusedReason' => optional($s->attendances->first())->excusedReason,
                'hizb_id' => $s->attendances->first()->hizb_id
                    ?? optional($s->lastHizbAttendance)->hizb_id,
                'thoman_id' => $s->attendances->first()->thoman_id
                    ?? optional($s->lastThomanAttendance)->thoman_id,
            ]),
            'ahzab' => \App\Models\Hizb::all(),
            'athman' => \App\Models\Thoman::all(),
        ]);
    }

    /**
     * تحديث بيانات الحصة (التاريخ والوقت)
     */
    public function update(Request $request, ProgramSession $session)
    {
        $request->validate([
            'session_date' => 'required|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
        ]);

        $session->update([
            'session_date' => $request->session_date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
        ]);

        return redirect()
            ->back()
            ->with('success', 'تم تحديث الحصة بنجاح');
    }

    /**
     * إلغاء حصة
     */
    public function cancel(ProgramSession $session)
    {
        $session->update(['status' => 'cancelled']);

        return redirect()
            ->back()
            ->with('success', 'تم إلغاء الحصة بنجاح');
    }

    /**
     * تسجيل حضور طالب
     */
    public function recordAttendance(Request $request, ProgramSession $session)
    {
        try {
            $request->validate([
                'student_id' => 'required|exists:students,id',
                'status' => 'required|in:present,absent,excused',
                'hizb_id' => 'nullable|exists:ahzab,id',
                'thoman_id' => 'nullable|exists:athman,id',
                'excusedReason' => 'nullable|string|max:255',
            ]);
            $student = Student::findOrFail($request->student_id);

            (new RecordAttendanceAction())->execute(
                $session,
                $student,
                $request->status,
                $request->hizb_id,
                $request->thoman_id,
                $request->excusedReason,
            );

            return redirect()
                ->back()
                ->with('success', 'تم تسجيل الحضور بنجاح ✅');
        } catch (\Throwable $e) {
            Log::error('Attendance recording failed', [
                'error' => $e->getMessage(),
                'student_id' => $request->student_id,
                'session_id' => $session->id,
            ]);

            return redirect()
                ->back()
                ->with('error', 'حدث خطأ أثناء تسجيل الحضور. الرجاء المحاولة لاحقًا.');
        }
    }
}
