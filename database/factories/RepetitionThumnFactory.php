<?php

namespace Database\Factories;

use App\Models\Repetition;
use App\Models\RepetitionThumn;
use App\Models\Thoman;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<RepetitionThumn>
 */
class RepetitionThumnFactory extends Factory
{
    protected $model = RepetitionThumn::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $result = fake()->randomElement(['good', 'bad']);

        return [
            'repetition_id' => Repetition::factory(),
            'thoman_id' => Thoman::query()->inRandomOrder()->value('id') ?? Thoman::factory(),
            'result' => $result,
            'mistakes_count' => $result === 'bad' ? fake()->numberBetween(0, 5) : null,
            'note' => null,
        ];
    }

    public function good(): static
    {
        return $this->state(fn () => ['result' => 'good', 'mistakes_count' => null, 'note' => null]);
    }

    public function bad(?int $mistakes = null, ?string $note = null): static
    {
        return $this->state(fn () => [
            'result' => 'bad',
            'mistakes_count' => $mistakes ?? fake()->numberBetween(1, 5),
            'note' => $note,
        ]);
    }
}
