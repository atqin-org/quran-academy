<?php

use App\Models\Category;
use App\Models\Club;
use App\Models\ClubCategorySession;
use App\Models\Group;
use App\Models\Student;
use App\Services\CapacityMonitor;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns empty list when no capacity is set', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    Student::factory()->count(5)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => null,
    ]);

    expect(app(CapacityMonitor::class)->getOverflows())->toBe([]);
});

it('flags a group whose student count exceeds capacity', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $group = Group::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'capacity' => 2,
        'is_active' => true,
    ]);
    Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    $overflows = app(CapacityMonitor::class)->getOverflows();

    expect($overflows)->toHaveCount(1)
        ->and($overflows[0]['kind'])->toBe('group')
        ->and($overflows[0]['id'])->toBe($group->id)
        ->and($overflows[0]['current'])->toBe(3)
        ->and($overflows[0]['capacity'])->toBe(2);
});

it('does not flag a group within its capacity', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $group = Group::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'capacity' => 10,
    ]);
    Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    expect(app(CapacityMonitor::class)->getOverflows())->toBe([]);
});

it('ignores groups whose capacity is null', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $group = Group::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'capacity' => null,
    ]);
    Student::factory()->count(50)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    expect(app(CapacityMonitor::class)->getOverflows())->toBe([]);
});

it('ignores inactive groups even if over capacity', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $group = Group::factory()->inactive()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'capacity' => 1,
    ]);
    Student::factory()->count(5)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    expect(app(CapacityMonitor::class)->getOverflows())->toBe([]);
});

it('flags a club+category pair over capacity when no groups exist', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    ClubCategorySession::create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'sessions_per_month' => 12,
        'capacity' => 3,
    ]);
    Student::factory()->count(5)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => null,
    ]);

    $overflows = app(CapacityMonitor::class)->getOverflows();

    expect($overflows)->toHaveCount(1)
        ->and($overflows[0]['kind'])->toBe('club_category')
        ->and($overflows[0]['club_id'])->toBe($club->id)
        ->and($overflows[0]['category_id'])->toBe($category->id)
        ->and($overflows[0]['current'])->toBe(5)
        ->and($overflows[0]['capacity'])->toBe(3);
});

it('ignores club+category capacity when active groups exist for that pair', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    ClubCategorySession::create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'sessions_per_month' => 12,
        'capacity' => 1,
    ]);
    Group::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'is_active' => true,
        'capacity' => null,
    ]);
    Student::factory()->count(5)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => null,
    ]);

    expect(app(CapacityMonitor::class)->getOverflows())->toBe([]);
});

it('still flags club+category when only an inactive group exists', function () {
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    ClubCategorySession::create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'sessions_per_month' => 12,
        'capacity' => 2,
    ]);
    Group::factory()->inactive()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);
    Student::factory()->count(4)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => null,
    ]);

    $overflows = app(CapacityMonitor::class)->getOverflows();

    expect($overflows)->toHaveCount(1)
        ->and($overflows[0]['kind'])->toBe('club_category');
});

it('returns both group and club+category overflows mixed together', function () {
    $clubA = Club::factory()->create();
    $catA = Category::factory()->create();
    $group = Group::factory()->create([
        'club_id' => $clubA->id,
        'category_id' => $catA->id,
        'capacity' => 1,
    ]);
    Student::factory()->count(3)->create([
        'club_id' => $clubA->id,
        'category_id' => $catA->id,
        'group_id' => $group->id,
    ]);

    $clubB = Club::factory()->create();
    $catB = Category::factory()->create();
    ClubCategorySession::create([
        'club_id' => $clubB->id,
        'category_id' => $catB->id,
        'sessions_per_month' => 12,
        'capacity' => 2,
    ]);
    Student::factory()->count(4)->create([
        'club_id' => $clubB->id,
        'category_id' => $catB->id,
        'group_id' => null,
    ]);

    $overflows = app(CapacityMonitor::class)->getOverflows();
    $kinds = collect($overflows)->pluck('kind')->sort()->values()->all();

    expect($overflows)->toHaveCount(2)
        ->and($kinds)->toBe(['club_category', 'group']);
});
