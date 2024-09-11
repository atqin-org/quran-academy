<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Lottery;
use Faker\Factory as FakerFactory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Guardian>
 */
class GuardianFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $faker = FakerFactory::create('ar_SA');
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
            'name' => $faker->name,
            'job' => $faker->jobTitle,
            'gender' =>  $faker->randomElement(["male", "female"]),
            'phone' => $faker->algerianPhoneNumber(),
        ];
    }
}
