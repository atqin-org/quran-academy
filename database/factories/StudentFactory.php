<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\Club;
use App\Models\Category;
use App\Models\Guardian;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;
use Faker\Factory as FakerFactory;

class StudentFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Student::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $faker = FakerFactory::create('ar_EG');
        // Determine if we should generate a father, mother, or both
        $hasFather = $faker->boolean;
        $hasMother = !$hasFather || $faker->boolean;
        $ahzab_up = $faker->numberBetween(0, 30);
        $ahzab_down = $faker->numberBetween(0, 30);
        return [
            'club_id' => Club::factory(),
            'first_name' => $faker->firstName,
            'last_name' => $faker->lastName,
            'gender' => $faker->randomElement(['male', 'female']),
            'birthdate' => $faker->dateTimeBetween('-60 years', '-3 years')->format('Y-m-d'),
            'social_status' => $faker->randomElement(['good', 'mid', 'low']),
            'cronic_disease' => $faker->optional()->word,
            'family_status' => $faker->optional()->word,
            'father_id' => $hasFather ? Guardian::factory()->state(['gender' => 'male']) : null,
            'mother_id' => $hasMother ? Guardian::factory()->state(['gender' => 'female']) : null,
            'category_id' => Category::factory(),
            'ahzab_up' => $ahzab_up,
            'ahzab_down' => $ahzab_down,
            'ahzab' => $ahzab_up + $ahzab_down,
            'subscription' => $faker->randomElement([0, 1500, 2000, 2500, 3000]),
            'subscription_expire_at' => $faker->optional()->dateTimeBetween('-8 months', '+8 months'),
            'insurance_expire_at' => $faker->optional()->dateTimeBetween('-3 months', '+8 months'),
        ];
    }

    /**
     * Indicate that the model should have payments.
     *
     * @return \Illuminate\Database\Eloquent\Factories\Factory
     */
    public function withPayments()
    {
        return $this->has(
            Payment::factory()->count(rand(0, 13)),
            'payments'
        );
    }
}
