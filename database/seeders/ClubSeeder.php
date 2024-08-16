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
                'name' => 'نادي مالك ابن أنس',
                'location' => 'Tlemcen',
            ],
            [
                'name' => 'نادي أم سلمة',
                'location' => 'Tlemcen',
            ],
            [
                'name' => 'نادي أبي موسى الأشعري',
                'location' => 'Tlemcen',
            ],
            [
                'name' => 'نادي أحمد سحنون',
                'location' => 'Tlemcen',
            ],
            [
                'name' => 'نادي عبد الرحمان شيبان',
                'location' => 'Tlemcen',
            ],
            [
                'name' => 'نادي يخلف البوعناني',
                'location' => 'Tlemcen',
            ],
        ];

        foreach ($clubs as $club) {
            Club::create($club);
        }
    }
}
