<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\Club;
use App\Models\Category;
use App\Models\Guardian;
use Illuminate\Database\Eloquent\Factories\Factory;
use Faker\Factory as FakerFactory;
use Illuminate\Support\Lottery;

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
        return [
            'club_id' => $faker->randomElement(Club::all()->pluck('id')->toArray()),
            'first_name' => $faker->firstName,
            'last_name' => $faker->lastName,
            'gender' => $faker->randomElement(['male', 'female']),
            'birthdate' => $faker->dateTimeBetween('-60 years', '-3 years')->format('Y-m-d'),
            'social_status' => $faker->randomElement(['good', 'mid', 'low']),
            'cronic_disease' => $faker->optional()->word,
            'family_status' => $faker->optional()->word,
            'father_id' => $hasFather ? Guardian::factory()->state(['gender' => 'male']) : null,
            'mother_id' => $hasMother ? Guardian::factory()->state(['gender' => 'female']) : null,
            'category_id' => $faker->randomElement(Category::all()->pluck('id')->toArray()),
            'ahzab' => $faker->numberBetween(0, 60),
            'subscription' => $faker->randomElement([0, $faker->numberBetween(1500, 3000)]),
            'subscription_expire_at' => $faker->optional()->dateTimeBetween('-8 months', '+8 months'),
            'insurance_expire_at' => $faker->optional()->dateTimeBetween('-3 months', '+8 months'),
        ];
    }
}
