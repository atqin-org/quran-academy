<?php

namespace Database\Factories;

use App\Models\Attendance;
use App\Models\ProgramSession;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Attendance>
 */
class AttendanceFactory extends Factory
{
    protected $model = Attendance::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Realistic distribution: 75% present, 15% absent, 10% excused
        $status = fake()->randomElement([
            'present', 'present', 'present', 'present', 'present', 'present', 'present', 'present',  // 8x present
            'absent', 'absent',  // 2x absent
            'excused'  // 1x excused
        ]);

        return [
            'session_id' => ProgramSession::factory(),
            'student_id' => Student::factory(),
            'status' => $status,
            'hizb_id' => null,
            'thoman_id' => null,
            'excusedReason' => $status === 'excused' ? fake()->randomElement([
                'مرض',
                'ظرف عائلي',
                'سفر',
                'امتحانات مدرسية',
                'موعد طبي',
            ]) : null,
        ];
    }

    /**
     * Mark as present
     */
    public function present(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'present',
            'excusedReason' => null,
        ]);
    }

    /**
     * Mark as absent
     */
    public function absent(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'absent',
            'hizb_id' => null,
            'thoman_id' => null,
            'excusedReason' => null,
        ]);
    }

    /**
     * Mark as excused with a reason
     */
    public function excused(?string $reason = null): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'excused',
            'hizb_id' => null,
            'thoman_id' => null,
            'excusedReason' => $reason ?? fake()->randomElement([
                'مرض',
                'ظرف عائلي',
                'سفر',
                'امتحانات مدرسية',
                'موعد طبي',
            ]),
        ]);
    }

    /**
     * With Quran progress (hizb and thoman)
     */
    public function withProgress(int $hizbId, ?int $thomanId = null): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'present',
            'hizb_id' => $hizbId,
            'thoman_id' => $thomanId,
            'excusedReason' => null,
        ]);
    }

    /**
     * For a specific session
     */
    public function forSession(ProgramSession $session): static
    {
        return $this->state(fn (array $attributes) => [
            'session_id' => $session->id,
        ]);
    }

    /**
     * For a specific student
     */
    public function forStudent(Student $student): static
    {
        return $this->state(fn (array $attributes) => [
            'student_id' => $student->id,
        ]);
    }

    /**
     * Simulates progressive learning (student advances through hizb)
     *
     * @param int $startHizb Starting hizb number (1-60)
     * @param int $sessionsCount Number of sessions to simulate
     */
    public function simulateProgress(int $startHizb = 1, int $sessionsCount = 1): static
    {
        // Progress every 2-4 sessions typically
        $progressRate = fake()->numberBetween(2, 4);
        $currentHizb = min(60, $startHizb + intval($sessionsCount / $progressRate));

        return $this->state(fn (array $attributes) => [
            'status' => 'present',
            'hizb_id' => $currentHizb,
            'thoman_id' => fake()->numberBetween(1, 8),
        ]);
    }
}
