<?php

namespace App\Actions\Program;

use App\Models\Program;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class CreateProgramAction
{
    public function execute(array $data): Program
    {
        // تحقق من صحة البيانات
        $validator = Validator::make($data, [
            'subject_id' => 'required|exists:subjects,id',
            'club_id' => 'required|exists:clubs,id',
            'category_id' => 'required|exists:categories,id',
            'section_id' => 'nullable|exists:sections,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'days_of_week' => 'required|array|min:1',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        // إنشاء البرنامج
        return Program::create([
            'subject_id' => $data['subject_id'],
            'club_id' => $data['club_id'],
            'category_id' => $data['category_id'],
            'section_id' => $data['section_id'] ?? null,
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'days_of_week' => json_encode($data['days_of_week']),
        ]);
    }
}
