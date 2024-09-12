<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\User;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        // Determine if the payment is for insurance or subscription
        $isInsurance = $this->faker->boolean(10); // 10% chance of being insurance
        $value = $isInsurance ? 200 : $this->faker->numberBetween(1500, 3000);
        $startAt = $this->faker->dateTimeBetween('-8 months', '-1 months');

        if ($isInsurance) {
            $endAt = (clone $startAt)->modify('last day of September')->modify('+1 year');
        } else {
            $endAt = $this->faker->dateTimeBetween($startAt->format('Y-m-d H:i:s'), $startAt->modify('+6 months')->format('Y-m-d H:i:s'));
        }

        return [
            'type' => $isInsurance ? 'ins' : 'sub',
            'value' => $value,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'user_id' => User::inRandomOrder()->first()->id,
            'student_id' => Student::inRandomOrder()->first()->id,
        ];
    }
}
