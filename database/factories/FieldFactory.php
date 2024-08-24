<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Field;
use App\Models\Form;

class FieldFactory extends Factory
{
    protected $model = Field::class;

    public function definition()
    {
        return [
            'form_id' => Form::factory(),
            'label' => $this->faker->word,
            'width' => $this->faker->numberBetween(1, 12),
            'type' => $this->faker->randomElement(['text', 'textarea', 'select', 'radio']),
            'options' => $this->faker->optional()->text,
            'table_reference' => $this->faker->optional()->word,
            'is_required' => $this->faker->boolean,
            'is_multiple' => $this->faker->boolean,
            'order' => $this->faker->optional()->numberBetween(1, 10),
        ];
    }
}
