<?php

use App\Models\Category;
use App\Models\Club;
use App\Models\ClubCategorySession;
use App\Models\Group;
use App\Models\Student;
use App\Models\User;
use App\Services\CapacityNotifier;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('saving a Student schedules a sync via afterResponse', function () {
    $this->mock(CapacityNotifier::class)
        ->shouldReceive('sync')
        ->once()
        ->andReturn(['sent' => 0, 'resolved' => 0]);

    $club = Club::factory()->create();
    $category = Category::factory()->create();
    Student::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);
    app()->terminate();
});

it('saving a Group schedules a sync via afterResponse', function () {
    $this->mock(CapacityNotifier::class)
        ->shouldReceive('sync')
        ->once()
        ->andReturn(['sent' => 0, 'resolved' => 0]);

    $club = Club::factory()->create();
    $category = Category::factory()->create();
    Group::factory()->create([
        'club_id' => $club->id,
        'category_id' => $category->id,
    ]);
    app()->terminate();
});

it('saving a ClubCategorySession schedules a sync via afterResponse', function () {
    $this->mock(CapacityNotifier::class)
        ->shouldReceive('sync')
        ->once()
        ->andReturn(['sent' => 0, 'resolved' => 0]);

    $club = Club::factory()->create();
    $category = Category::factory()->create();
    ClubCategorySession::create([
        'club_id' => $club->id,
        'category_id' => $category->id,
        'sessions_per_month' => 12,
        'capacity' => 5,
    ]);
    app()->terminate();
});

it('end-to-end: surfaces an admin notification when overflow exists', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $club = Club::factory()->create();
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

    app()->terminate();

    expect($admin->fresh()->unreadNotifications()->count())->toBe(1);
});
