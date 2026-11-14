<?php

use App\Models\Category;
use App\Models\Club;
use App\Models\ClubCategorySession;
use App\Models\Group;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('admin can update a group capacity', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $group = Group::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'capacity' => null,
    ]);

    $response = $this->actingAs($admin)
        ->put(route('groups.updateCapacity', $group->id), ['capacity' => 25]);

    $response->assertRedirect();
    expect($group->fresh()->capacity)->toBe(25);
});

it('rejects capacity below 1', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $group = Group::factory()->create();

    $response = $this->actingAs($admin)
        ->from('/clubs')
        ->put(route('groups.updateCapacity', $group->id), ['capacity' => 0]);

    $response->assertSessionHasErrors('capacity');
});

it('accepts a null capacity to clear it', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $group = Group::factory()->create(['capacity' => 10]);

    $this->actingAs($admin)
        ->put(route('groups.updateCapacity', $group->id), ['capacity' => null]);

    expect($group->fresh()->capacity)->toBeNull();
});

it('admin can save capacity through the sessions config update', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $admin->clubs()->attach([$club->id]);
    $category = Category::factory()->create();

    $response = $this->actingAs($admin)
        ->put(route('clubs.sessions-config.update', $club->id), [
            'configs' => [[
                'category_id' => $category->id,
                'sessions_per_month' => 12,
                'capacity' => 30,
            ]],
        ]);

    $response->assertRedirect();
    $config = ClubCategorySession::where('club_id', $club->id)
        ->where('category_id', $category->id)
        ->first();
    expect($config)->not->toBeNull()
        ->and($config->capacity)->toBe(30);
});

it('rejects sessions config capacity of zero', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $admin->clubs()->attach([$club->id]);
    $category = Category::factory()->create();

    $response = $this->actingAs($admin)
        ->from('/clubs')
        ->put(route('clubs.sessions-config.update', $club->id), [
            'configs' => [[
                'category_id' => $category->id,
                'sessions_per_month' => 12,
                'capacity' => 0,
            ]],
        ]);

    $response->assertSessionHasErrors('configs.0.capacity');
});

it('sessions config edit returns has_groups flag for each category', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $admin->clubs()->attach([$club->id]);
    $catWithGroup = Category::factory()->create();
    $catWithoutGroup = Category::factory()->create();
    Group::factory()->create([
        'club_id' => $club->id,
        'category_id' => $catWithGroup->id,
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)
        ->get(route('clubs.sessions-config.edit', $club->id));

    $response->assertOk();
    $response->assertInertia(function ($page) use ($catWithGroup, $catWithoutGroup) {
        $configs = collect($page->toArray()['props']['categoryConfigs']);
        $withGroup = $configs->firstWhere('category_id', $catWithGroup->id);
        $withoutGroup = $configs->firstWhere('category_id', $catWithoutGroup->id);
        expect($withGroup['has_groups'])->toBeTrue()
            ->and($withoutGroup['has_groups'])->toBeFalse();
    });
});
