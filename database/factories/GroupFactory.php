<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Club;
use App\Models\Group;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Group>
 */
class GroupFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'club_id' => Club::factory(),
            'category_id' => Category::factory(),
            'name' => fake()->randomElement(Group::ARABIC_ABJAD),
            'order' => fake()->numberBetween(1, 10),
            'is_active' => true,
        ];
    }

    /**
     * Create a group for a specific club and category
     */
    public function forClubCategory(Club $club, Category $category): static
    {
        return $this->state(fn () => [
            'club_id' => $club->id,
            'category_id' => $category->id,
            'name' => Group::getNextName($club->id, $category->id),
            'order' => Group::getNextOrder($club->id, $category->id),
        ]);
    }

    /**
     * Create an inactive group
     */
    public function inactive(): static
    {
        return $this->state(fn () => [
            'is_active' => false,
        ]);
    }
}
