<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Field;
use App\Models\FieldResponse;

class FieldResponseFactory extends Factory
{
    protected $model = FieldResponse::class;

    public function definition()
    {
        return [
            'field_id' => Field::factory(),
            'response_id' => $this->faker->numberBetween(1, 100),
            'response_value' => $this->faker->text,
        ];
    }
}
