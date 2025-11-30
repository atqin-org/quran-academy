<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Club;
use App\Models\Subject;
use App\Models\Program;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Program>
 */
class ProgramFactory extends Factory
{
    protected $model = Program::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = fake()->dateTimeBetween('-6 months', '-1 month');
        $endDate = Carbon::parse($startDate)->addMonths(fake()->numberBetween(2, 6));

        // Random days of week (at least 2, max 5)
        $allDays = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
        $numDays = fake()->numberBetween(2, 4);
        $daysOfWeek = fake()->randomElements($allDays, $numDays);

        return [
            'name' => 'برنامج ' . fake()->randomElement(['الحفظ', 'المراجعة', 'التجويد', 'القراءة']) . ' ' . fake()->numberBetween(1, 10),
            'subject_id' => Subject::inRandomOrder()->first()?->id ?? Subject::factory(),
            'club_id' => Club::inRandomOrder()->first()?->id ?? Club::factory(),
            'category_id' => Category::inRandomOrder()->first()?->id ?? Category::factory(),
            'section_id' => null,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'days_of_week' => $daysOfWeek,
        ];
    }

    /**
     * Program starting in the past (for historical data)
     */
    public function past(): static
    {
        return $this->state(function (array $attributes) {
            $startDate = fake()->dateTimeBetween('-12 months', '-6 months');
            $endDate = Carbon::parse($startDate)->addMonths(fake()->numberBetween(3, 6));

            return [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ];
        });
    }

    /**
     * Currently active program
     */
    public function active(): static
    {
        return $this->state(function (array $attributes) {
            $startDate = fake()->dateTimeBetween('-3 months', '-1 month');
            $endDate = Carbon::parse($startDate)->addMonths(fake()->numberBetween(4, 8));

            return [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ];
        });
    }

    /**
     * Assign to specific club
     */
    public function forClub(Club $club): static
    {
        return $this->state(fn (array $attributes) => [
            'club_id' => $club->id,
        ]);
    }

    /**
     * Assign to specific category
     */
    public function forCategory(Category $category): static
    {
        return $this->state(fn (array $attributes) => [
            'category_id' => $category->id,
        ]);
    }
}
