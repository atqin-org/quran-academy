<?php

namespace App\Http\Controllers;

use App\Actions\Attendance\RecordAttendanceAction;
use App\Models\Program;
use App\Models\ProgramSession;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

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

        if (! in_array($sessionClubId, $accessibleClubIds)) {
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

        if (! in_array($program->club_id, $accessibleClubIds)) {
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

        $program = $session->program;

        // Get IDs of students who already have attendance records for this session
        // This ensures historical records are preserved even if students left/deleted/moved
        $studentsWithAttendance = $session->attendances()->pluck('student_id')->toArray();

        // Build query for current students in this class (club + category)
        $studentsQuery = Student::withTrashed()
            ->with([
                'category',
                'club',
                'group' => function ($q) {
                    $q->withTrashed(); // Include soft-deleted groups for historical display
                },
                'attendances' => function ($q) use ($session) {
                    $q->where('session_id', $session->id);
                },
                'lastHizbAttendance',
                'lastThomanAttendance',
            ])
            ->where(function ($query) use ($program, $studentsWithAttendance) {
                // Include current students matching program criteria
                $query->where(function ($q) use ($program) {
                    $q->where('club_id', $program->club_id)
                        ->where('category_id', $program->category_id);

                    // If program targets a specific group, filter by that group
                    if ($program->group_id) {
                        $q->where('group_id', $program->group_id);
                    }
                });

                // Also include any students with existing attendance records (historical)
                if (! empty($studentsWithAttendance)) {
                    $query->orWhereIn('id', $studentsWithAttendance);
                }
            });

        $students = $studentsQuery->orderBy('first_name')->get();

        // Get hizb number mapping for converting stored hizb numbers to IDs
        $hizbNumberToId = \App\Models\Hizb::pluck('id', 'number')->toArray();

        return Inertia::render('Dashboard/Sessions/Attendance', [
            'session' => $session,
            'program' => [
                'id' => $program->id,
                'group_id' => $program->group_id,
                'group_name' => $program->group?->name,
            ],
            'students' => $students->map(function ($s) use ($hizbNumberToId) {
                // Get last hizb ID based on current direction
                $lastHizbId = null;
                if ($s->memorization_direction === 'ascending' && $s->last_hizb_ascending) {
                    $lastHizbId = $hizbNumberToId[$s->last_hizb_ascending] ?? null;
                } elseif ($s->memorization_direction === 'descending' && $s->last_hizb_descending) {
                    $lastHizbId = $hizbNumberToId[$s->last_hizb_descending] ?? null;
                }

                // Fallback to lastHizbAttendance if no direction-specific data
                if (! $lastHizbId) {
                    $lastHizbId = optional($s->lastHizbAttendance)->hizb_id;
                }

                $attendance = $s->attendances->first();

                // Get historical group from attendance if student's current group is different
                $historicalGroupId = $attendance?->group_id;
                $historicalGroupName = null;
                if ($historicalGroupId && $historicalGroupId !== $s->group_id) {
                    $historicalGroup = \App\Models\Group::withTrashed()->find($historicalGroupId);
                    $historicalGroupName = $historicalGroup?->name;
                }

                return [
                    'id' => $s->id,
                    'first_name' => $s->first_name,
                    'last_name' => $s->last_name,
                    'group_id' => $s->group_id,
                    'group_name' => $s->group?->name,
                    'historical_group_id' => $historicalGroupId,
                    'historical_group_name' => $historicalGroupName,
                    'is_deleted' => $s->trashed(),
                    'attendance_status' => $attendance?->status,
                    'excusedReason' => $attendance?->excusedReason,
                    'hizb_id' => $attendance?->hizb_id
                        ?? optional($s->lastHizbAttendance)->hizb_id,
                    'thoman_id' => $attendance?->thoman_id
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

            (new RecordAttendanceAction)->execute(
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
                    'student_name' => $student->first_name.' '.$student->last_name,
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

    /**
     * Bulk record attendance for multiple students in a session
     */
    public function recordAttendanceBulk(Request $request, ProgramSession $session)
    {
        $this->authorizeSessionAccess($session);

        try {
            $request->validate([
                'attendance' => 'required|array',
                'attendance.*.student_id' => 'required|exists:students,id',
                'attendance.*.status' => 'nullable|in:present,absent,excused,late_excused,kicked',
                'attendance.*.hizb_id' => 'nullable|exists:ahzab,id',
                'attendance.*.thoman_id' => 'nullable|exists:athman,id',
                'attendance.*.reason' => 'nullable|string|max:255',
            ]);

            $savedCount = 0;
            foreach ($request->attendance as $record) {
                // Skip records without a status
                if (empty($record['status'])) {
                    continue;
                }

                // Validate that present/late_excused students have thoman
                if (in_array($record['status'], ['present', 'late_excused']) && empty($record['thoman_id'])) {
                    continue; // Skip invalid records
                }

                $student = Student::findOrFail($record['student_id']);

                (new RecordAttendanceAction)->execute(
                    $session,
                    $student,
                    $record['status'],
                    $record['hizb_id'] ?? null,
                    $record['thoman_id'] ?? null,
                    $record['reason'] ?? null,
                );

                $savedCount++;
            }

            // Log bulk attendance recording
            activity('attendance')
                ->performedOn($session)
                ->causedBy(Auth::user())
                ->event('bulk_recorded')
                ->withProperties([
                    'session_id' => $session->id,
                    'session_date' => $session->session_date?->format('Y-m-d'),
                    'records_saved' => $savedCount,
                ])
                ->log("تم تسجيل حضور {$savedCount} طالب");

            return redirect()
                ->back()
                ->with('success', "تم حفظ الحضور بنجاح ({$savedCount} سجل)");
        } catch (\Throwable $e) {
            Log::error('Bulk attendance recording failed', [
                'error' => $e->getMessage(),
                'session_id' => $session->id,
            ]);

            return redirect()
                ->back()
                ->with('error', 'حدث خطأ أثناء حفظ الحضور. الرجاء المحاولة لاحقًا.');
        }
    }
}
