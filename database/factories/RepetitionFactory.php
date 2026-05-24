<?php

namespace Database\Factories;

use App\Models\Hizb;
use App\Models\ProgramSession;
use App\Models\Repetition;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Repetition>
 */
class RepetitionFactory extends Factory
{
    protected $model = Repetition::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'session_id' => ProgramSession::factory(),
            'student_id' => Student::factory(),
            'hizb_id' => Hizb::query()->inRandomOrder()->value('id') ?? Hizb::factory(),
            'tester_user_id' => User::factory(),
            'tester_student_id' => null,
            'overall_rating' => fake()->randomElement(['good', 'mid', 'bad']),
            'remark' => null,
        ];
    }

    public function forSession(ProgramSession $session): static
    {
        return $this->state(fn () => ['session_id' => $session->id]);
    }

    public function forStudent(Student $student): static
    {
        return $this->state(fn () => ['student_id' => $student->id]);
    }

    public function testedBy(User|Student $tester): static
    {
        return $this->state(fn () => $tester instanceof User
            ? ['tester_user_id' => $tester->id, 'tester_student_id' => null]
            : ['tester_user_id' => null, 'tester_student_id' => $tester->id]
        );
    }
}
