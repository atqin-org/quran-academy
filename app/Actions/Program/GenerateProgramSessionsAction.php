<?php

namespace App\Actions\Program;

use App\Models\Program;
use App\Models\ProgramSession;
use Carbon\Carbon;

class GenerateProgramSessionsAction
{
    /**
     * Generate sessions automatically based on days_of_week.
     */
    public function execute(Program $program): void
    {
        $days = $program->days_of_week;

        $startDate = Carbon::parse($program->start_date);
        $endDate = Carbon::parse($program->end_date);

        $existingSessions = ProgramSession::where('program_id', $program->id)
            ->get()
            ->keyBy(fn (ProgramSession $session) => Carbon::parse($session->session_date)->toDateString());

        // الجلسات المتوقعة
        $expectedDates = [];
        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            if (in_array($date->format('D'), $days)) {
                $expectedDates[] = $date->toDateString();
            }
        }

        // 1. إضافة الجلسات الناقصة
        foreach ($expectedDates as $date) {
            if (! $existingSessions->has($date)) {
                ProgramSession::create([
                    'program_id' => $program->id,
                    'session_date' => $date,
                    'status' => 'scheduled',
                ]);
            }
        }

        // 2. حذف الجلسات غير المطلوبة (مع الحفاظ على المكتملة أو التي بها حضور)
        foreach ($existingSessions as $date => $session) {
            if (! in_array($date, $expectedDates, true) && $this->isSafeToDelete($session)) {
                $session->delete();
            }
        }
    }

    /**
     * Reconcile sessions from custom session data provided by the frontend.
     * Each session includes: date, start_time, end_time.
     *
     * Existing sessions are matched by date and updated in place so their row id
     * (and any attendance attached to it) is preserved. Sessions that are no
     * longer wanted are deleted only when they are safe to delete (not completed
     * and have no attendance records).
     *
     * @param  array<int, array{date: string, start_time?: ?string, end_time?: ?string}>  $customSessions
     */
    public function executeWithCustomSessions(Program $program, array $customSessions): void
    {
        $existingSessions = ProgramSession::where('program_id', $program->id)
            ->get()
            ->keyBy(fn (ProgramSession $session) => Carbon::parse($session->session_date)->toDateString());

        $desiredDates = [];

        foreach ($customSessions as $sessionData) {
            $date = Carbon::parse($sessionData['date'])->toDateString();
            $desiredDates[$date] = true;

            $session = $existingSessions->get($date);

            if ($session) {
                $session->update([
                    'start_time' => $sessionData['start_time'] ?? null,
                    'end_time' => $sessionData['end_time'] ?? null,
                ]);
            } else {
                ProgramSession::create([
                    'program_id' => $program->id,
                    'session_date' => $date,
                    'start_time' => $sessionData['start_time'] ?? null,
                    'end_time' => $sessionData['end_time'] ?? null,
                    'status' => 'scheduled',
                ]);
            }
        }

        foreach ($existingSessions as $date => $session) {
            if (! isset($desiredDates[$date]) && $this->isSafeToDelete($session)) {
                $session->delete();
            }
        }
    }

    /**
     * A session may be removed only when it has not been completed and has no
     * attendance records (deleting it would cascade-delete attendance).
     */
    private function isSafeToDelete(ProgramSession $session): bool
    {
        return $session->status !== 'completed' && ! $session->attendances()->exists();
    }
}
