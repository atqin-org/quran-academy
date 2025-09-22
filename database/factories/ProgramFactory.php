<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Club;
use App\Models\Subject;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Program>
 */
class ProgramFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
             'subject_id' => Subject::factory(),
            'club_id' => Club::factory(),
            'category_id' => Category::factory(),
            'section_id' => null,
            'start_date' => fake()->date,
            'end_date' => fake()->date,
            'days_of_week' => json_encode(['Mon','Wed','Fri']),
        ];
    }
}
