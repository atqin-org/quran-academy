<?php

namespace App\Actions\Group;

use App\Models\Group;
use App\Models\Student;

class TransferStudentAction
{
    public function execute(Student $student, ?Group $targetGroup): void
    {
        $student->group_id = $targetGroup?->id;
        $student->save();
    }
}
