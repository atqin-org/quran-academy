<?php

use App\Models\Category;
use App\Models\Club;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function personnelPayload(User $personnel, array $overrides = []): array
{
    return array_merge([
        'firstName' => $personnel->name,
        'lastName' => $personnel->last_name,
        'role' => 'staff',
        'phone' => '0555555555',
        'mail' => $personnel->email,
    ], $overrides);
}

it('stores category restrictions per club when creating personnel', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $otherClub = Club::factory()->create();
    [$categoryA, $categoryB] = Category::factory()->count(2)->create();

    $this->actingAs($admin)->post(route('personnels.store'), [
        'firstName' => 'أحمد',
        'lastName' => 'محمد',
        'clubs' => [$club->id, $otherClub->id],
        'club_categories' => [$club->id => [$categoryA->id]],
        'role' => 'staff',
        'phone' => '0555555555',
        'mail' => 'staff@example.com',
    ])->assertRedirect(route('personnels.index'));

    $user = User::where('email', 'staff@example.com')->firstOrFail();

    expect($user->accessMap()->all())->toBe([
        $club->id => [$categoryA->id],
        $otherClub->id => null,
    ]);
    expect($user->canAccess($club->id, $categoryA->id))->toBeTrue()
        ->and($user->canAccess($club->id, $categoryB->id))->toBeFalse()
        ->and($user->canAccess($otherClub->id, $categoryB->id))->toBeTrue();
});

it('replaces category restrictions when updating personnel', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    [$categoryA, $categoryB] = Category::factory()->count(2)->create();
    $personnel = User::factory()->create(['role' => 'staff']);
    $personnel->clubs()->attach($club);
    $personnel->categoryRestrictions()->attach($categoryA, ['club_id' => $club->id]);

    $this->actingAs($admin)->post(route('personnels.update.post', $personnel), personnelPayload($personnel, [
        'clubs' => [$club->id],
        'club_categories' => [$club->id => [$categoryB->id]],
    ]))->assertRedirect(route('personnels.index'));

    $this->assertDatabaseMissing('category_club_user', ['user_id' => $personnel->id, 'category_id' => $categoryA->id]);
    $this->assertDatabaseHas('category_club_user', [
        'user_id' => $personnel->id,
        'club_id' => $club->id,
        'category_id' => $categoryB->id,
    ]);
});

it('clears restrictions when no categories are sent, granting the whole club', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $personnel = User::factory()->create(['role' => 'staff']);
    $personnel->clubs()->attach($club);
    $personnel->categoryRestrictions()->attach($category, ['club_id' => $club->id]);

    $this->actingAs($admin)->post(route('personnels.update.post', $personnel), personnelPayload($personnel, [
        'clubs' => [$club->id],
    ]))->assertRedirect(route('personnels.index'));

    $this->assertDatabaseMissing('category_club_user', ['user_id' => $personnel->id]);
    expect($personnel->fresh()->accessMap()->all())->toBe([$club->id => null]);
});

it('drops restrictions of a club that is removed from the personnel', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    [$clubA, $clubB] = Club::factory()->count(2)->create();
    $category = Category::factory()->create();
    $personnel = User::factory()->create(['role' => 'staff']);
    $personnel->clubs()->attach([$clubA->id, $clubB->id]);
    $personnel->categoryRestrictions()->attach($category, ['club_id' => $clubA->id]);

    $this->actingAs($admin)->post(route('personnels.update.post', $personnel), personnelPayload($personnel, [
        'clubs' => [$clubB->id],
    ]));

    $this->assertDatabaseMissing('category_club_user', ['user_id' => $personnel->id]);
});

it('rejects categories for a club that is not selected', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    [$clubA, $clubB] = Club::factory()->count(2)->create();
    $category = Category::factory()->create();
    $personnel = User::factory()->create(['role' => 'staff']);

    $this->actingAs($admin)->post(route('personnels.update.post', $personnel), personnelPayload($personnel, [
        'clubs' => [$clubA->id],
        'club_categories' => [$clubB->id => [$category->id]],
    ]))->assertSessionHasErrors("club_categories.{$clubB->id}");

    $this->assertDatabaseMissing('category_club_user', ['user_id' => $personnel->id]);
});

it('rejects unknown category ids', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $personnel = User::factory()->create(['role' => 'staff']);

    $this->actingAs($admin)->post(route('personnels.update.post', $personnel), personnelPayload($personnel, [
        'clubs' => [$club->id],
        'club_categories' => [$club->id => [999]],
    ]))->assertSessionHasErrors("club_categories.{$club->id}.0");
});

it('sends the existing restrictions to the edit page', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $personnel = User::factory()->create(['role' => 'staff']);
    $personnel->clubs()->attach($club);
    $personnel->categoryRestrictions()->attach($category, ['club_id' => $club->id]);

    $this->actingAs($admin)->get(route('personnels.edit', $personnel))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Dashboard/Personnels/Edit')
            ->where("clubCategories.{$club->id}", [$category->id])
        );
});
