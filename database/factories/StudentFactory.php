<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\Club;
use App\Models\Category;
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

        $faker->addProvider(new class($faker) extends \Faker\Provider\Base {
            public function algerianPhoneNumber()
            {
                $formats = [
                    '05########',
                    '06########',
                    '07########'
                ];
                return $this->generator->numerify($this->generator->randomElement($formats));
            }
        });

        return [
            'id_club' => $faker->randomElement(Club::all()->pluck('id')->toArray()),
            'first_name' => $faker->firstName,
            'last_name' => $faker->lastName,
            'gender' => $faker->randomElement(['male', 'female']),
            'birthdate' => $faker->dateTimeBetween('-60 years', '-3 years')->format('Y-m-d'),
            'social_status' => $faker->randomElement(['good', 'mid', 'low']),
            'has_cronic_disease' => $faker->boolean,
            'cronic_disease' => $faker->optional()->word,
            'family_status' => $faker->optional()->word,
            'father_job' => $faker->optional()->randomElement(['مهندس', 'طبيب', 'معلم', 'محامي']),
            'mother_job' => $faker->optional()->randomElement(['مهندسة', 'طبيبة', 'معلمة', 'محامية']),
            'father_phone' => $faker->algerianPhoneNumber(),
            'mother_phone' => $faker->optional()->algerianPhoneNumber(),
            'id_category' => $faker->randomElement(Category::all()->pluck('id')->toArray()),
            'subscription' => $faker->numberBetween(1500, 3000),
            'ahzab' => $faker->numberBetween(0, 60),
            'subscription_expire_at' => $faker->optional()->dateTimeBetween('-8 months', '+8 months'),
            'insurance_expire_at' => $faker->optional()->dateTimeBetween('-8 months', '+8 months'),
        ];
    }
}
