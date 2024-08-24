<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Form;

class FormFactory extends Factory
{
    protected $model = Form::class;

    public function definition()
    {
        return [
            'name' => $this->faker->word,
            'description' => $this->faker->optional()->text,
        ];
    }
}
