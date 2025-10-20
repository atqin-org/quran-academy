<?php

namespace App\Actions\Program;

use App\Models\Program;
use App\Models\ProgramSession;
use Carbon\Carbon;

class GenerateProgramSessionsAction
{
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
}
