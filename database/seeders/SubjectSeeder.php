<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Student;
use App\Models\Club;
use App\Models\Category;
use App\Models\Subject;

class SubjectSeeder extends Seeder
{
    public function run(): void
    {
        $subjects = [
            ['name' => 'القرآن الكريم'],
            ['name' => 'اللغة العربية'],
        ];

        foreach ($subjects as $subject) {
            Subject::create($subject);
        }
    }
}