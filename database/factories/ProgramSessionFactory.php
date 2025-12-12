<?php

namespace Database\Factories;

use App\Models\Program;
use App\Models\ProgramSession;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProgramSession>
 */
class ProgramSessionFactory extends Factory
{
    protected $model = ProgramSession::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Default start times for Quran classes
        $startHour = fake()->randomElement([8, 9, 10, 14, 15, 16, 17]);
        $startTime = sprintf('%02d:00', $startHour);
        $endTime = sprintf('%02d:00', $startHour + fake()->randomElement([1, 2]));

        return [
            'program_id' => Program::factory(),
            'session_date' => fake()->dateTimeBetween('-3 months', 'now'),
            'start_time' => $startTime,
            'end_time' => $endTime,
            'status' => fake()->randomElement(['scheduled', 'completed', 'completed', 'completed']), // 75% completed (valid: scheduled, completed, canceled)
        ];
    }

    /**
     * Session for a specific date
     */
    public function onDate(Carbon $date): static
    {
        return $this->state(fn (array $attributes) => [
            'session_date' => $date->format('Y-m-d'),
        ]);
    }

    /**
     * Completed session
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }

    /**
     * Canceled session
     */
    public function canceled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'canceled',
        ]);
    }

    /**
     * Scheduled (upcoming) session
     */
    public function scheduled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'scheduled',
        ]);
    }

    /**
     * Morning session (8-12)
     */
    public function morning(): static
    {
        return $this->state(function (array $attributes) {
            $startHour = fake()->numberBetween(8, 10);
            return [
                'start_time' => sprintf('%02d:00', $startHour),
                'end_time' => sprintf('%02d:00', $startHour + 2),
            ];
        });
    }

    /**
     * Afternoon session (14-18)
     */
    public function afternoon(): static
    {
        return $this->state(function (array $attributes) {
            $startHour = fake()->numberBetween(14, 16);
            return [
                'start_time' => sprintf('%02d:00', $startHour),
                'end_time' => sprintf('%02d:00', $startHour + 2),
            ];
        });
    }
}
