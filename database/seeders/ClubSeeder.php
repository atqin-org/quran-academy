<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Club;

class ClubSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $clubs = [
            [
                'name' => 'مالك ابن أنس',
                'location' => 'Tlemcen',
            ],
            [
                'name' => 'أم سلمة',
                'location' => 'Tlemcen',
            ],
            [
                'name' => 'أبي موسى الأشعري',
                'location' => 'Tlemcen',
            ],
            [
                'name' => 'أحمد سحنون',
                'location' => 'Tlemcen',
            ],
            [
                'name' => 'عبد الرحمان شيبان',
                'location' => 'Tlemcen',
            ],
            [
                'name' => 'يخلف البوعناني',
                'location' => 'Tlemcen',
            ],
        ];

        foreach ($clubs as $club) {
            Club::create($club);
        }
    }
}
