<?php

use App\Models\Category;
use App\Models\Club;
use App\Models\Group;
use App\Models\Student;
use App\Models\User;
use App\Notifications\Registry;
use App\Services\CapacityNotifier;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shares notifications block with admin including their unread capacity entry', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $admin->clubs()->attach([$club->id]);
    $category = Category::factory()->create();
    $group = Group::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'capacity' => 1,
    ]);
    Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);

    app(CapacityNotifier::class)->sync();

    $response = $this->actingAs($admin)->get(route('clubs.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('notifications.unread_count', 1)
        ->has('notifications.unread', 1)
        ->where('notifications.unread.0.type', Registry::CLASS_OVER_CAPACITY)
    );
});

it('shares an empty notifications block when admin has none', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
    $admin->clubs()->attach([$club->id]);

    $response = $this->actingAs($admin)->get(route('clubs.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('notifications.unread_count', 0)
        ->where('notifications.unread', [])
    );
});

it('shares an empty notifications block for users not attached to the affected club', function () {
    // Teacher is attached to a different club from the one with the overflow.
    $teacher = User::factory()->create(['role' => 'teacher']);
    $teacherClub = Club::factory()->create();
    $teacher->clubs()->attach([$teacherClub->id]);

    $admin = User::factory()->create(['role' => 'admin']);
    $overflowClub = Club::factory()->create();
    $category = Category::factory()->create();
    $group = Group::factory()->create([
        'club_id' => $overflowClub->id,
        'category_id' => $category->id,
        'capacity' => 1,
    ]);
    Student::factory()->count(3)->create([
        'club_id' => $overflowClub->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);
    app(CapacityNotifier::class)->sync();

    $response = $this->actingAs($teacher)->get(route('clubs.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('notifications.unread_count', 0)
        ->where('notifications.unread', [])
    );

    expect($admin->fresh()->unreadNotifications()->count())->toBe(1);
});

it('shares unread notifications with personnel attached to the affected club', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);
    $club = Club::factory()->create();
    $teacher->clubs()->attach([$club->id]);

    $category = Category::factory()->create();
    $group = Group::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'capacity' => 1,
    ]);
    Student::factory()->count(3)->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'group_id' => $group->id,
    ]);
    app(CapacityNotifier::class)->sync();

    $response = $this->actingAs($teacher)->get(route('clubs.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('notifications.unread_count', 1)
        ->has('notifications.unread', 1)
        ->where('notifications.unread.0.type', Registry::CLASS_OVER_CAPACITY)
    );
});
