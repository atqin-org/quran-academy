<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Models\Program;
use App\Models\ProgramSession;
use App\Models\Student;
use App\Actions\Attendance\RecordAttendanceAction;
use Illuminate\Support\Facades\Auth;

class ProgramSessionController extends Controller
{
    /**
     * Check if user has access to this session's club
     */
    private function authorizeSessionAccess(ProgramSession $session): void
    {
        $user = Auth::user();
        $sessionClubId = $session->program->club_id;
        $accessibleClubIds = $user->accessibleClubs()->pluck('id')->toArray();

        if (!in_array($sessionClubId, $accessibleClubIds)) {
            abort(403, 'غير مصرح لك بالوصول إلى هذه الحصة');
        }
    }

    /**
     * Check if user has access to this program's club
     */
    private function authorizeProgramAccess(Program $program): void
    {
        $user = Auth::user();
        $accessibleClubIds = $user->accessibleClubs()->pluck('id')->toArray();

        if (!in_array($program->club_id, $accessibleClubIds)) {
            abort(403, 'غير مصرح لك بالوصول إلى هذا البرنامج');
        }
    }

    /**
     * إنشاء حصة استثنائية جديدة
     */
    public function store(Request $request, Program $program)
    {
        $this->authorizeProgramAccess($program);

        $request->validate([
            'session_date' => 'required|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
        ]);

        $session = ProgramSession::create([
            'program_id' => $program->id,
            'session_date' => $request->session_date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'status' => 'scheduled',
        ]);

        activity('program_session')
            ->performedOn($session)
            ->causedBy(Auth::user())
            ->event('created')
            ->withProperties([
                'program_id' => $program->id,
                'session_date' => $request->session_date,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'type' => 'exceptional',
            ])
            ->log("تم إنشاء حصة استثنائية: {$request->session_date}");

        return redirect()
            ->back()
            ->with('success', 'تم إنشاء الحصة الاستثنائية بنجاح');
    }

    /**
     * صفحة تسجيل الحضور لحصة معينة
     */
    public function attendance(ProgramSession $session)
    {
        $this->authorizeSessionAccess($session);

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



        // Get hizb number mapping for converting stored hizb numbers to IDs
        $hizbNumberToId = \App\Models\Hizb::pluck('id', 'number')->toArray();

        return Inertia::render('Dashboard/Sessions/Attendance', [
            'session' => $session,
            'students' => $students->map(function ($s) use ($hizbNumberToId) {
                // Get last hizb ID based on current direction
                $lastHizbId = null;
                if ($s->memorization_direction === 'ascending' && $s->last_hizb_ascending) {
                    $lastHizbId = $hizbNumberToId[$s->last_hizb_ascending] ?? null;
                } elseif ($s->memorization_direction === 'descending' && $s->last_hizb_descending) {
                    $lastHizbId = $hizbNumberToId[$s->last_hizb_descending] ?? null;
                }

                // Fallback to lastHizbAttendance if no direction-specific data
                if (!$lastHizbId) {
                    $lastHizbId = optional($s->lastHizbAttendance)->hizb_id;
                }

                return [
                    'id' => $s->id,
                    'first_name' => $s->first_name,
                    'last_name' => $s->last_name,
                    'attendance_status' => optional($s->attendances->first())->status,
                    'excusedReason' => optional($s->attendances->first())->excusedReason,
                    'hizb_id' => $s->attendances->first()->hizb_id
                        ?? optional($s->lastHizbAttendance)->hizb_id,
                    'thoman_id' => $s->attendances->first()->thoman_id
                        ?? optional($s->lastThomanAttendance)->thoman_id,
                    'memorization_direction' => $s->memorization_direction ?? 'descending',
                    'last_hizb_id' => $lastHizbId,
                    'last_hizb_ascending' => $s->last_hizb_ascending,
                    'last_hizb_descending' => $s->last_hizb_descending,
                ];
            }),
            'ahzab' => \App\Models\Hizb::all(),
            'athman' => \App\Models\Thoman::all(),
        ]);
    }

    /**
     * تحديث بيانات الحصة (التاريخ والوقت)
     */
    public function update(Request $request, ProgramSession $session)
    {
        $this->authorizeSessionAccess($session);

        $request->validate([
            'session_date' => 'required|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
        ]);

        $oldData = [
            'session_date' => $session->session_date?->format('Y-m-d'),
            'start_time' => $session->start_time,
            'end_time' => $session->end_time,
        ];

        $session->update([
            'session_date' => $request->session_date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
        ]);

        // Log session update
        activity('program_session')
            ->performedOn($session)
            ->causedBy(Auth::user())
            ->event('updated')
            ->withProperties([
                'program_id' => $session->program_id,
                'old' => $oldData,
                'new' => [
                    'session_date' => $request->session_date,
                    'start_time' => $request->start_time,
                    'end_time' => $request->end_time,
                ],
            ])
            ->log("تم تحديث الحصة: {$request->session_date}");

        return redirect()
            ->back()
            ->with('success', 'تم تحديث الحصة بنجاح');
    }

    /**
     * إلغاء حصة
     */
    public function cancel(ProgramSession $session)
    {
        $this->authorizeSessionAccess($session);

        $session->update(['status' => 'cancelled']);

        // Log session cancellation
        activity('program_session')
            ->performedOn($session)
            ->causedBy(Auth::user())
            ->event('cancelled')
            ->withProperties([
                'program_id' => $session->program_id,
                'session_date' => $session->session_date?->format('Y-m-d'),
            ])
            ->log("تم إلغاء الحصة: {$session->session_date?->format('Y-m-d')}");

        return redirect()
            ->back()
            ->with('success', 'تم إلغاء الحصة بنجاح');
    }

    /**
     * Toggle optional status for a session
     */
    public function toggleOptional(Request $request, ProgramSession $session)
    {
        $this->authorizeSessionAccess($session);

        $validated = $request->validate([
            'is_optional' => 'required|boolean',
        ]);

        $wasOptional = $session->is_optional;
        $isNowOptional = $validated['is_optional'];

        // If the optional status actually changed, adjust credits for existing attendance
        if ($wasOptional !== $isNowOptional) {
            $this->adjustCreditsForOptionalChange($session, $isNowOptional);
        }

        $session->update(['is_optional' => $isNowOptional]);

        activity('program_session')
            ->performedOn($session)
            ->causedBy(Auth::user())
            ->event('optional_toggled')
            ->withProperties([
                'is_optional' => $isNowOptional,
                'session_date' => $session->session_date?->format('Y-m-d'),
            ])
            ->log($isNowOptional
                ? 'تم تحديد الحصة كاختيارية'
                : 'تم إلغاء تحديد الحصة كاختيارية');

        return redirect()->back();
    }

    /**
     * Adjust credits for students when session optional status changes
     * All statuses except 'excused' deduct credits
     */
    private function adjustCreditsForOptionalChange(ProgramSession $session, bool $isNowOptional): void
    {
        // Statuses that deduct credits (all except 'excused' which is absent excused)
        $creditDeductingStatuses = ['present', 'absent', 'late_excused', 'kicked'];

        // Get all attendance records that would deduct credits
        $deductingAttendances = $session->attendances()
            ->whereIn('status', $creditDeductingStatuses)
            ->with('student')
            ->get();

        foreach ($deductingAttendances as $attendance) {
            $student = $attendance->student;

            // Skip students with infinite sessions
            if ($student->hasInfiniteSessions()) {
                continue;
            }

            if ($isNowOptional) {
                // Changed from required to optional: refund the credit
                $student->addCredit(1);
            } else {
                // Changed from optional to required: deduct the credit
                $student->deductCredit(1);
            }
        }
    }

    /**
     * تسجيل حضور طالب
     */
    public function recordAttendance(Request $request, ProgramSession $session)
    {
        $this->authorizeSessionAccess($session);

        try {
            $request->validate([
                'student_id' => 'required|exists:students,id',
                'status' => 'required|in:present,absent,excused,late_excused,kicked',
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

            // Log attendance recording
            activity('attendance')
                ->performedOn($session)
                ->causedBy(Auth::user())
                ->event('recorded')
                ->withProperties([
                    'student_id' => $student->id,
                    'student_name' => $student->first_name . ' ' . $student->last_name,
                    'status' => $request->status,
                    'session_id' => $session->id,
                    'session_date' => $session->session_date?->format('Y-m-d'),
                ])
                ->log("تم تسجيل الحضور: {$student->first_name} - {$request->status}");

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
