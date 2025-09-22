<?php

namespace App\Actions\Program;

use App\Models\Program;
use App\Models\ProgramSession;
use Carbon\Carbon;

class GenerateProgramSessionsAction
{
    public function execute(Program $program): void
    {
        $days = json_decode($program->days_of_week);

        $startDate = Carbon::parse($program->start_date);
        $endDate = Carbon::parse($program->end_date);

        for ($date = $startDate; $date->lte($endDate); $date->addDay()) {
            if (in_array($date->format('D'), $days)) {
                ProgramSession::firstOrCreate([
                    'program_id' => $program->id,
                    'session_date' => $date->toDateString(),
                ]);
            }
        }
    }
}
