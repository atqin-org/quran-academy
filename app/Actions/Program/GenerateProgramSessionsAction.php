<?php

namespace App\Actions\Program;

use App\Models\Program;
use App\Models\ProgramSession;
use Carbon\Carbon;

class GenerateProgramSessionsAction
{
    /**
     * Generate sessions automatically based on days_of_week
     */
    public function execute(Program $program): void
    {
        $days = $program->days_of_week;

        $startDate = Carbon::parse($program->start_date);
        $endDate   = Carbon::parse($program->end_date);
        // الجلسات الحالية
        $existingSessions = ProgramSession::where('program_id', $program->id)->get()->keyBy('session_date');

        // الجلسات المتوقعة
        $expectedDates = [];
        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            if (in_array($date->format('D'), $days)) {
                $expectedDates[] = $date->toDateString();
            }
        }

        // 1. إضافة الجلسات الناقصة
        foreach ($expectedDates as $date) {
            if (!$existingSessions->has($date)) {
                ProgramSession::create([
                    'program_id'   => $program->id,
                    'session_date' => $date,
                    'status'       => 'scheduled',
                ]);
            }
        }

        // 2. حذف الجلسات غير المطلوبة (لكن فقط لو status != completed)
        foreach ($existingSessions as $date => $session) {
            if (!in_array($date, $expectedDates) && $session->status !== 'completed') {
                $session->delete();
            }
        }
    }

    /**
     * Generate sessions from custom session data provided by frontend
     * Each session includes: date, start_time, end_time
     */
    public function executeWithCustomSessions(Program $program, array $customSessions): void
    {
        // Delete existing sessions that are not completed
        ProgramSession::where('program_id', $program->id)
            ->where('status', '!=', 'completed')
            ->delete();

        // Create new sessions from custom data
        foreach ($customSessions as $sessionData) {
            ProgramSession::create([
                'program_id'   => $program->id,
                'session_date' => $sessionData['date'],
                'start_time'   => $sessionData['start_time'] ?? null,
                'end_time'     => $sessionData['end_time'] ?? null,
                'status'       => 'scheduled',
            ]);
        }
    }
}
