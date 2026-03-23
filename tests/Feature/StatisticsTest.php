<?php

use App\Models\Category;
use App\Models\Club;
use App\Models\DashboardLayout;
use App\Models\Group;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('admin can view statistics page', function () {
    $user = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($user)->get(route('statistics.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Statistics/Index')
        ->has('statistics')
        ->has('clubs')
        ->has('categories')
        ->has('filters')
        ->has('layout')
    );
});

it('statistics can be filtered by time range', function () {
    $user = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($user)->get(route('statistics.index', [
        'range' => 'month',
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Statistics/Index')
        ->where('filters.range', 'month')
    );
});

it('statistics can be filtered by club', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();

    $response = $this->actingAs($user)->get(route('statistics.index', [
        'club_id' => $club->id,
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Statistics/Index')
        ->where('filters.club_id', (string) $club->id)
    );
});

it('statistics can be filtered by category', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $category = Category::factory()->create();

    $response = $this->actingAs($user)->get(route('statistics.index', [
        'category_id' => $category->id,
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Statistics/Index')
        ->where('filters.category_id', (string) $category->id)
    );
});

it('statistics can be filtered by group', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();
    $group = Group::factory()->forClubCategory($club, $category)->create();

    $response = $this->actingAs($user)->get(route('statistics.index', [
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Dashboard/Statistics/Index')
        ->where('filters.group_id', (string) $group->id)
    );
});

it('statistics data endpoint returns json', function () {
    $user = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($user)->getJson(route('statistics.data'));

    $response->assertOk();
    $response->assertJsonStructure([
        'statistics' => [
            'financial',
            'attendance',
            'students',
            'personnel',
            'progress',
        ],
        'groups',
    ]);
});

it('statistics data endpoint returns groups when club selected', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $category = Category::factory()->create();

    Group::factory()->forClubCategory($club, $category)->create(['is_active' => true]);
    Group::factory()->forClubCategory($club, $category)->create(['is_active' => true]);

    $response = $this->actingAs($user)->getJson(route('statistics.data', [
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]));

    $response->assertOk();
    $response->assertJsonCount(2, 'groups');
});

it('can save widget layout', function () {
    $user = User::factory()->create(['role' => 'admin']);

    $widgets = [
        [
            'id' => 'financial-total',
            'type' => 'financial_total',
            'position' => ['x' => 0, 'y' => 0],
            'size' => ['w' => 2, 'h' => 1],
            'visible' => true,
        ],
        [
            'id' => 'attendance-rate',
            'type' => 'attendance_rate',
            'position' => ['x' => 2, 'y' => 0],
            'size' => ['w' => 1, 'h' => 1],
            'visible' => false,
        ],
    ];

    $response = $this->actingAs($user)->putJson(route('statistics.layout.update'), [
        'widgets' => $widgets,
    ]);

    $response->assertOk();
    $response->assertJson(['success' => true]);

    $layout = DashboardLayout::where('user_id', $user->id)->first();
    expect($layout)->not->toBeNull();
    expect($layout->widgets)->toHaveCount(2);
    expect($layout->widgets[0]['id'])->toBe('financial-total');
});

it('can reset widget layout', function () {
    $user = User::factory()->create(['role' => 'admin']);

    // Create a custom layout first
    DashboardLayout::create([
        'user_id' => $user->id,
        'widgets' => [
            [
                'id' => 'custom',
                'type' => 'custom',
                'position' => ['x' => 0, 'y' => 0],
                'size' => ['w' => 1, 'h' => 1],
                'visible' => true,
            ],
        ],
    ]);

    $response = $this->actingAs($user)->delete(route('statistics.layout.reset'));

    $response->assertRedirect();

    // Layout should be deleted
    $layout = DashboardLayout::where('user_id', $user->id)->first();
    expect($layout)->toBeNull();
});
